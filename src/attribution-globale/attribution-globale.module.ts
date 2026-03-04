import { Module } from '@nestjs/common';
import { AttributionGlobaleService } from './attribution-globale.service';
import { AttributionGlobaleController } from './attribution-globale.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AttributionGlobale, AttributionGlobaleSchema } from './entities/attribution-globale.entity';
import { ExclusionSpecifiqueModule } from 'src/exclusion-specifique/exclusion-specifique.module';

@Module({
  imports: [MongooseModule.forFeatureAsync([{name: AttributionGlobale.name, useFactory:() =>{
   const  schema = AttributionGlobaleSchema;
   schema.plugin(require('mongoose-autopopulate'));
   return schema;
  }}]),
  ExclusionSpecifiqueModule
],
  controllers: [AttributionGlobaleController],
  providers: [AttributionGlobaleService],
  exports:[AttributionGlobaleService]
})
export class AttributionGlobaleModule {}
