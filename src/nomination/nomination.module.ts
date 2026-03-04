import { Module } from '@nestjs/common';
import { NominationService } from './nomination.service';
import { NominationController } from './nomination.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Nomination, NominationSchema } from './entities/nomination.entity';

@Module({
  imports:[MongooseModule.forFeatureAsync([{name:Nomination.name, useFactory: () => {
    const schema = NominationSchema;
    schema.plugin(require('mongoose-autopopulate'));
    return schema;
  }}])],
  controllers: [NominationController],
  providers: [NominationService],
  exports:[NominationService]
})
export class NominationModule {}
