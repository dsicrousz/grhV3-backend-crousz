import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { auth } from 'src/lib/auth';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'] || request.headers['authorization']?.replace('Bearer ', '');

        if (!apiKey) {
            throw new UnauthorizedException('API key missing');
        }

        const result = await (auth as any).apiKey.verify({ key: apiKey });

        if (!result.valid) {
            throw new UnauthorizedException(result.error?.message || 'Invalid API key');
        }

        (request as any).apiKey = result.key;
        return true;
    }
}
