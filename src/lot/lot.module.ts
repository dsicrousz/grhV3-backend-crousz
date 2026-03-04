import { Module } from '@nestjs/common';
import { LotService } from './lot.service';
import { LotController } from './lot.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Lot, LotSchema } from './entities/lot.entity';
import { EmployeModule } from 'src/employe/employe.module';
import { AttributionGlobaleModule } from 'src/attribution-globale/attribution-globale.module';
import { AttributionFonctionnelleModule } from 'src/attribution-fonctionnelle/attribution-fonctionnelle.module';
import { ExclusionSpecifiqueModule } from 'src/exclusion-specifique/exclusion-specifique.module';
import { AttributionIndividuelleModule } from 'src/attribution-individuelle/attribution-individuelle.module';
import { NominationModule } from 'src/nomination/nomination.module';
import { ImpotModule } from 'src/impot/impot.module';
import { RubriqueModule } from 'src/rubrique/rubrique.module';
import { BullModule } from '@nestjs/bullmq';
import { BulletinModule } from 'src/bulletin/bulletin.module';
import { LotConsumer } from './LotConsumer';
@Module({
  imports:[MongooseModule.forFeature([{name: Lot.name,schema: LotSchema}]),
   BullModule.registerQueue({
  name: 'lot',
  }),
  EmployeModule,
  AttributionGlobaleModule,
  AttributionFonctionnelleModule,
  ExclusionSpecifiqueModule,
  AttributionIndividuelleModule,
  NominationModule,
  ImpotModule,
  RubriqueModule,
  BulletinModule
],
  controllers: [LotController],
  providers: [LotService,LotConsumer],
})
export class LotModule {}
