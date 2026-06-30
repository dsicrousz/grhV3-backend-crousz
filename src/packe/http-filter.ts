import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { method, url, ip } = request;

    if (this.isSuspicious(url)) {
      this.logger.warn(`Requête suspecte: ${method} ${url} depuis ${ip}`);
    }

    let status: number;
    let message: string;
    let error = '';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, any>;
        message = Array.isArray(r['message']) ? r['message'].join(', ') : (r['message'] ?? exception.message);
        error = r['error'];
        details = r['details'];
      } else {
        message = exception.message;
      }
      this.logger.warn(`[${status}] ${method} ${url} - ${message}`);
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || 'Erreur interne du serveur';
      error = 'Erreur interne du serveur';
      this.logger.error(`[${status}] ${method} ${url} - ${exception.message}`, exception.stack);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = "Une erreur inattendue s'est produite";
      error = 'Erreur interne du serveur';
      this.logger.error(`[${status}] ${method} ${url} - Erreur inconnue`, JSON.stringify(exception));
    }

    if (!error) {
      error = this.getErrorLabel(status);
    }

    const body: Record<string, any> = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method,
      message,
      error,
    };

    if (details) {
      body['details'] = details;
    }

    return response.status(status).json(body);
  }

  private isSuspicious(url: string): boolean {
    return url.includes('.env') ||
           url.includes('.git') ||
           url.includes('config/');
  }

  private getErrorLabel(status: number): string {
    const labels: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Requête invalide',
      [HttpStatus.UNAUTHORIZED]: 'Non authentifié',
      [HttpStatus.FORBIDDEN]: 'Accès refusé',
      [HttpStatus.NOT_FOUND]: 'Ressource introuvable',
      [HttpStatus.CONFLICT]: 'Conflit de données',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Données non valides',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Trop de requêtes',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Erreur interne du serveur',
    };
    return labels[status] ?? 'Erreur';
  }
}

