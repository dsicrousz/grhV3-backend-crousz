import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { runWithContext, setUserInContext } from './request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    runWithContext(() => {
      // Capturer l'utilisateur depuis better-auth (req.user)
      const user = (req as any).user;
      if (user) {
        setUserInContext(user.id, user.email || user.name, user.role ? [user.role] : undefined);
      }
      next();
    });
  }
}
