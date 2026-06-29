import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionAudit, SessionAuditSchema } from './entities/session-audit.entity';
import { SessionAuditService } from './session-audit.service';
import { SessionAuditHook } from './session-audit.hook';
import { SessionAuditController } from './session-audit.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SessionAudit.name, schema: SessionAuditSchema }]),
  ],
  controllers: [SessionAuditController],
  providers: [SessionAuditService, SessionAuditHook],
  exports: [SessionAuditService, SessionAuditHook],
})
export class SessionAuditModule {}
