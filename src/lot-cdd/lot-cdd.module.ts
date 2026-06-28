import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';

import { LotCDDService } from './lot-cdd.service';
import { LotCDDController } from './lot-cdd.controller';
import { LotCDD, LotCDDSchema } from './entities/lot-cdd.entity';
import { LotCDDConsumer } from './LotCDDConsumer';

import { EmployeModule } from 'src/employe/employe.module';
import { AttributionGlobaleModule } from 'src/attribution-globale/attribution-globale.module';
import { AttributionFonctionnelleModule } from 'src/attribution-fonctionnelle/attribution-fonctionnelle.module';
import { ExclusionSpecifiqueModule } from 'src/exclusion-specifique/exclusion-specifique.module';
import { AttributionIndividuelleModule } from 'src/attribution-individuelle/attribution-individuelle.module';
import { NominationModule } from 'src/nomination/nomination.module';
import { ImpotModule } from 'src/impot/impot.module';
import { RubriqueModule } from 'src/rubrique/rubrique.module';
import { BulletinCDDModule } from 'src/bulletin-cdd/bulletin-cdd.module';
import { ContratModule } from 'src/contrat/contrat.module';
import { PdfMakerModule } from 'src/helpers/pdf-maker.module';
import { StorageModule } from 'src/storage/storage.module';
import { ParametreBulletinModule } from 'src/parametre-bulletin/parametre-bulletin.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: LotCDD.name, schema: LotCDDSchema }]),
        BullModule.registerQueue({ name: 'lot-cdd' }),
        EmployeModule,
        AttributionGlobaleModule,
        AttributionFonctionnelleModule,
        ExclusionSpecifiqueModule,
        AttributionIndividuelleModule,
        NominationModule,
        ImpotModule,
        RubriqueModule,
        BulletinCDDModule,
        ContratModule,
        PdfMakerModule,
        StorageModule,
        ParametreBulletinModule,
    ],
    controllers: [LotCDDController],
    providers: [LotCDDService, LotCDDConsumer],
})
export class LotCDDModule {}
