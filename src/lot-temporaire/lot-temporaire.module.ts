import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';

import { LotTemporaireService } from './lot-temporaire.service';
import { LotTemporaireController } from './lot-temporaire.controller';
import { LotTemporaire, LotTemporaireSchema } from './entities/lot-temporaire.entity';
import { LotTemporaireConsumer } from './LotTemporaireConsumer';

import { EmployeModule } from 'src/employe/employe.module';
import { AttributionGlobaleModule } from 'src/attribution-globale/attribution-globale.module';
import { ImpotModule } from 'src/impot/impot.module';
import { RubriqueModule } from 'src/rubrique/rubrique.module';
import { BulletinTemporaireModule } from 'src/bulletin-temporaire/bulletin-temporaire.module';
import { ContratModule } from 'src/contrat/contrat.module';
import { PdfMakerModule } from 'src/helpers/pdf-maker.module';
import { StorageModule } from 'src/storage/storage.module';
import { ParametreBulletinModule } from 'src/parametre-bulletin/parametre-bulletin.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: LotTemporaire.name, schema: LotTemporaireSchema }]),
        BullModule.registerQueue({ name: 'lot-temporaire' }),
        EmployeModule,
        AttributionGlobaleModule,
        ImpotModule,
        RubriqueModule,
        BulletinTemporaireModule,
        ContratModule,
        PdfMakerModule,
        StorageModule,
        ParametreBulletinModule,
    ],
    controllers: [LotTemporaireController],
    providers: [LotTemporaireService, LotTemporaireConsumer],
})
export class LotTemporaireModule {}
