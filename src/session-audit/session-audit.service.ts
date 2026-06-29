import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { SessionAudit, SessionAuditDocument, TypeActionSession } from './entities/session-audit.entity';

@Injectable()
export class SessionAuditService {
  private readonly logger = new Logger(SessionAuditService.name);

  constructor(
    @InjectModel(SessionAudit.name) private readonly sessionAuditModel: Model<SessionAuditDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private async getUserEmail(userId: string): Promise<string> {
    try {
      const user = await this.connection.collection('user').findOne(
        { _id: new Types.ObjectId(userId) },
        { projection: { email: 1 } },
      );
      return user?.email ?? '';
    } catch {
      return '';
    }
  }

  async logLogin(session: any): Promise<void> {
    try {
      const email = await this.getUserEmail(session.userId);
      await this.sessionAuditModel.create({
        userId: session.userId,
        userEmail: email,
        action: TypeActionSession.LOGIN,
        sessionId: session.id ?? session.token ?? '',
        ipAddress: session.ipAddress ?? session.ip ?? '',
        userAgent: session.userAgent ?? '',
        metadata: {
          expiresAt: session.expiresAt,
          createdAt: session.createdAt,
        },
      });
      this.logger.log(`Connexion utilisateur: ${email || session.userId}`);
    } catch (error) {
      this.logger.error(`Erreur lors de l'enregistrement de la connexion: ${error.message}`);
    }
  }

  async logLogout(session: any): Promise<void> {
    try {
      const email = await this.getUserEmail(session.userId);
      await this.sessionAuditModel.create({
        userId: session.userId,
        userEmail: email,
        action: TypeActionSession.LOGOUT,
        sessionId: session.id ?? session.token ?? '',
        ipAddress: session.ipAddress ?? session.ip ?? '',
        userAgent: session.userAgent ?? '',
        metadata: {
          deletedAt: new Date().toISOString(),
        },
      });
      this.logger.log(`Déconnexion utilisateur: ${email || session.userId}`);
    } catch (error) {
      this.logger.error(`Erreur lors de l'enregistrement de la déconnexion: ${error.message}`);
    }
  }

  async findByUser(userId: string): Promise<SessionAudit[]> {
    return this.sessionAuditModel.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  async findAll(): Promise<SessionAudit[]> {
    return this.sessionAuditModel.find().sort({ createdAt: -1 }).lean();
  }

  async findRecent(limit: number = 50): Promise<SessionAudit[]> {
    return this.sessionAuditModel.find().sort({ createdAt: -1 }).limit(limit).lean();
  }
}
