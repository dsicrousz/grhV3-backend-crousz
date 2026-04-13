import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export enum LogType {
  AUTH = 'auth',
  ERROR = 'error',
  EXCEPTION = 'exception',
  INFO = 'info',
}

export interface LogPayload {
  appName: string;
  type: LogType;
  level: LogLevel;
  message: string;
  userId?: string;
  action?: string;
  traceId: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class LogAggregatorService {
  private readonly logger = new Logger(LogAggregatorService.name);
  private readonly endpoint: string;
  private readonly secret: string;
  private readonly appName: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('LOG_AGGREGATOR_URL', '');
    this.secret = this.configService.get<string>('LOG_AGGREGATOR_SECRET', '');
    this.appName = this.configService.get<string>('LOG_AGGREGATOR_APP_NAME', 'grh-backend');
    this.enabled = this.configService.get<string>('LOG_AGGREGATOR_ENABLED', 'false') === 'true';

    if (this.enabled && (!this.endpoint || !this.secret)) {
      this.logger.warn('Log aggregator activé mais URL ou SECRET manquant dans .env');
    }
  }

  private signPayload(body: Record<string, unknown>): string {
    const payload = JSON.stringify(body);
    return createHmac('sha256', this.secret).update(payload).digest('hex');
  }

  async send(payload: Omit<LogPayload, 'appName' | 'traceId' | 'occurredAt'> & { traceId?: string; occurredAt?: string }): Promise<void> {
    if (!this.enabled) return;

    const fullPayload: LogPayload = {
      appName: this.appName,
      traceId: payload.traceId || uuidv4(),
      occurredAt: payload.occurredAt || new Date().toISOString(),
      ...payload,
    };

    const signature = this.signPayload(fullPayload as unknown as Record<string, unknown>);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-name': this.appName,
          'x-log-signature': signature,
        },
        body: JSON.stringify(fullPayload),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        this.logger.warn(`Log aggregator HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.logger.warn(`Échec envoi log vers aggregator: ${error.message}`);
    }
  }

  async sendHttpLog(data: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    ip?: string;
    userAgent?: string;
    userId?: string;
    body?: Record<string, unknown>;
    error?: string;
    traceId?: string;
  }): Promise<void> {
    const level = data.statusCode >= 500
      ? LogLevel.ERROR
      : data.statusCode >= 400
        ? LogLevel.WARN
        : LogLevel.INFO;

    const isAuthRoute = data.url.startsWith('/api/auth');

    const type = data.statusCode >= 500
      ? LogType.EXCEPTION
      : data.statusCode >= 400
        ? LogType.ERROR
        : isAuthRoute
          ? LogType.AUTH
          : LogType.INFO;

    await this.send({
      type,
      level,
      message: `${data.method} ${data.url} ${data.statusCode} ${data.duration}ms`,
      userId: data.userId,
      action: `${data.method} ${data.url}`,
      traceId: data.traceId,
      metadata: {
        method: data.method,
        url: data.url,
        statusCode: data.statusCode,
        duration: data.duration,
        ip: data.ip,
        userAgent: data.userAgent,
        ...(data.error && { error: data.error }),
      },
    });
  }

  async sendAuthLog(data: {
    action: string;
    userId?: string;
    level?: LogLevel;
    message: string;
    metadata?: Record<string, unknown>;
    traceId?: string;
  }): Promise<void> {
    await this.send({
      type: LogType.AUTH,
      level: data.level || LogLevel.INFO,
      message: data.message,
      userId: data.userId,
      action: data.action,
      traceId: data.traceId,
      metadata: data.metadata,
    });
  }

  async sendInfoLog(data: {
    action: string;
    userId?: string;
    level?: LogLevel;
    message: string;
    metadata?: Record<string, unknown>;
    traceId?: string;
  }): Promise<void> {
    await this.send({
      type: LogType.INFO,
      level: data.level || LogLevel.INFO,
      message: data.message,
      userId: data.userId,
      action: data.action,
      traceId: data.traceId,
      metadata: data.metadata,
    });
  }

  async sendErrorLog(data: {
    message: string;
    error?: string;
    stack?: string;
    userId?: string;
    action?: string;
    traceId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.send({
      type: LogType.ERROR,
      level: LogLevel.ERROR,
      message: data.message,
      userId: data.userId,
      action: data.action,
      traceId: data.traceId,
      metadata: {
        ...data.metadata,
        ...(data.error && { error: data.error }),
        ...(data.stack && { stack: data.stack }),
      },
    });
  }
}
