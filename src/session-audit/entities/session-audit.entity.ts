import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SessionAuditDocument = HydratedDocument<SessionAudit>;

export enum TypeActionSession {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

@Schema({ timestamps: true })
export class SessionAudit {
  _id?: string;

  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String })
  userEmail: string;

  @Prop({ type: String, enum: TypeActionSession, required: true })
  action: TypeActionSession;

  @Prop({ type: String })
  sessionId: string;

  @Prop({ type: String })
  ipAddress: string;

  @Prop({ type: String })
  userAgent: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const SessionAuditSchema = SchemaFactory.createForClass(SessionAudit);
