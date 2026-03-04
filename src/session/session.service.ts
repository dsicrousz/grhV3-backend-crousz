import { Injectable } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Session, SessionDocument } from './entities/session.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class SessionService extends AbstractModel<Session,CreateSessionDto,UpdateSessionDto>{
  constructor(@InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>){
    super(sessionModel);
  }
}
