import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger('HTTP');
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { method, url, ip } = request;
    if (this.isSuspicious(url)) {
      this.logger.warn(`Suspicious request: ${method} ${url} from ${ip}`);
    }
    const status = exception.getStatus();
    this.logger.log(exception);
   return response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: exception.message
      });
  }

  private isSuspicious(url: string): boolean {
    return url.includes('.env') || 
           url.includes('.git') || 
           url.includes('config/');
  }
}

