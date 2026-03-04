// src/common/guards/suspicious-paths.guard.ts
import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';

@Injectable()
export class SuspiciousPathsGuard implements CanActivate {
  private suspiciousPaths = [
    '.env',
    '.git',
    'config/',
    'backup/',
    'phpMyAdmin',
    'wp-admin',
    'admin',
    'phpmyadmin',
    '.htaccess',
    'web.config',
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const path = request.url.toLowerCase();

    // Bloquer les requêtes suspectes
    if (this.suspiciousPaths.some(suspicious => path.includes(suspicious))) {
      throw new NotFoundException();
    }

    return true;
  }
}