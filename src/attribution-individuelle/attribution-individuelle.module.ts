import { Module } from '@nestjs/common';
import { AttributionIndividuelleService } from './attribution-individuelle.service';
import { AttributionIndividuelleController } from './attribution-individuelle.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AttributionIndividuelle, AttributionIndividuelleSchema } from './entities/attribution-individuelle.entity';

@Module({
  imports:[MongooseModule.forFeatureAsync([{name: AttributionIndividuelle.name,useFactory:() => {
    const schema = AttributionIndividuelleSchema;
    schema.plugin(require('mongoose-autopopulate'));
    return schema;
  }}])],
  controllers: [AttributionIndividuelleController],
  providers: [AttributionIndividuelleService],
  exports: [AttributionIndividuelleService]
})
export class AttributionIndividuelleModule {}
