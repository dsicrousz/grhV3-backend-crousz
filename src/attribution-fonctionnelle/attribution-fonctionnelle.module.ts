import { Module } from '@nestjs/common';
import { AttributionFonctionnelleService } from './attribution-fonctionnelle.service';
import { AttributionFonctionnelleController } from './attribution-fonctionnelle.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AttributionFonctionnelle, AttributionFonctionnelleSchema } from './entities/attribution-fonctionnelle.entity';
import { NominationModule } from 'src/nomination/nomination.module';
import { ExclusionSpecifiqueModule } from 'src/exclusion-specifique/exclusion-specifique.module';

@Module({
  imports:[MongooseModule.forFeatureAsync([{name:AttributionFonctionnelle.name,useFactory: () => {
    const schema =  AttributionFonctionnelleSchema;
    schema.plugin(require('mongoose-autopopulate'));
    return schema;
  }}]),
  NominationModule,
  ExclusionSpecifiqueModule
  ],
  controllers: [AttributionFonctionnelleController],
  providers: [AttributionFonctionnelleService],
  exports:[AttributionFonctionnelleService]
})
export class AttributionFonctionnelleModule {}
