import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './entities/session.entity';

@Module({
  imports:[MongooseModule.forFeature([{name: Session.name,schema: SessionSchema}])],
  controllers: [SessionController],
  providers: [SessionService],
  exports:[SessionService]
})
export class SessionModule {}
