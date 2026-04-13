import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LogAggregatorService } from '../log-aggregator.service';

@Injectable()
export class LogAggregatorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LogAggregatorInterceptor.name);

  constructor(private readonly logAggregatorService: LogAggregatorService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const traceId = (request.headers['x-trace-id'] as string) || uuidv4();
    const startTime = Date.now();

    const method = request.method;
    const url = request.originalUrl || request.url;
    const ip = request.ip || request.socket?.remoteAddress;
    const userAgent = request.headers['user-agent'];
    const userId = (request as any)?.user?.id || (request as any)?.session?.userId;

    return next.handle().pipe(
      tap(() => {
        if (method === 'GET') return;

        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        this.logAggregatorService.sendHttpLog({
          method,
          url,
          statusCode,
          duration,
          ip,
          userAgent,
          userId,
          traceId,
        }).catch((err) => {
          this.logger.warn(`Erreur envoi log HTTP: ${err.message}`);
        });
      }),
      catchError((error) => {
        if (method === 'GET') return throwError(() => error);

        const duration = Date.now() - startTime;
        const statusCode = error?.status || error?.statusCode || 500;

        this.logAggregatorService.sendHttpLog({
          method,
          url,
          statusCode,
          duration,
          ip,
          userAgent,
          userId,
          traceId,
          error: error?.message || 'Unknown error',
        }).catch((err) => {
          this.logger.warn(`Erreur envoi log HTTP (error path): ${err.message}`);
        });

        return throwError(() => error);
      }),
    );
  }
}
