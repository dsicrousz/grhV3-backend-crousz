import { Controller, Get, Param, Query } from '@nestjs/common';
import { SessionAuditService } from './session-audit.service';
import { SessionAudit } from './entities/session-audit.entity';

@Controller('session-audit')
export class SessionAuditController {
  constructor(private readonly sessionAuditService: SessionAuditService) {}

  @Get()
  findAll(@Query('limit') limit?: string) {
    const lim = limit ? parseInt(limit, 10) : 50;
    return this.sessionAuditService.findRecent(lim);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.sessionAuditService.findByUser(userId);
  }
}
