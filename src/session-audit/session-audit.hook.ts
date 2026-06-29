import { Injectable, Logger } from '@nestjs/common';
import {
  DatabaseHook,
  AfterCreate,
  AfterDelete,
} from '@thallesp/nestjs-better-auth';
import { SessionAuditService } from './session-audit.service';

@DatabaseHook()
@Injectable()
export class SessionAuditHook {
  private readonly logger = new Logger(SessionAuditHook.name);

  constructor(private readonly sessionAuditService: SessionAuditService) {}

  @AfterCreate('session')
  async afterSessionCreate(session: any) {
    this.logger.log(`Session créée pour l'utilisateur: ${session.userId}`);
    await this.sessionAuditService.logLogin(session);
  }

  @AfterDelete('session')
  async afterSessionDelete(session: any) {
    this.logger.log(`Session supprimée pour l'utilisateur: ${session.userId}`);
    await this.sessionAuditService.logLogout(session);
  }
}
