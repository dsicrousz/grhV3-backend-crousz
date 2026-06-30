import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './packe/http-filter';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  const config = app.get(ConfigService);
  const allowedOrigins = config.get<string>('FRONTEND_URLS')?.split(',').map(url => url.trim()) || [];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-api-key', 'x-visitor-id'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: process.env.NODE_ENV == 'production',
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = parseInt(config.get('NEST_PORT'), 10) || process.env.PORT;
  await app.listen(port, () => logger.log(`App started at port: ${port}`));
}
bootstrap();
