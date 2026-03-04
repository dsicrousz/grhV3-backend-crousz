import {  Module} from '@nestjs/common';
import { AppService } from './app.service';
import { EmployeModule } from './employe/employe.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionModule } from './session/session.module';
import { RubriqueModule } from './rubrique/rubrique.module';
import { CategorieModule } from './categorie/categorie.module';
import { DivisionModule } from './division/division.module';
import { ServiceModule } from './service/service.module';
import { FonctionModule } from './fonction/fonction.module';
import { TypedocumentModule } from './typedocument/typedocument.module';
import { DocumentModule } from './document/document.module';
import { NominationModule } from './nomination/nomination.module';
import { AttributionFonctionnelleModule } from './attribution-fonctionnelle/attribution-fonctionnelle.module';
import { AttributionGlobaleModule } from './attribution-globale/attribution-globale.module';
import { AttributionIndividuelleModule } from './attribution-individuelle/attribution-individuelle.module';
import { ExclusionSpecifiqueModule } from './exclusion-specifique/exclusion-specifique.module';
import { LotModule } from './lot/lot.module';
import { BulletinModule } from './bulletin/bulletin.module';
import { AbsenceModule } from './absence/absence.module';
import { CongeModule } from './conge/conge.module';
import { PieceJointeModule } from './piece-jointe/piece-jointe.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/auth';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // no need to import into other modules
    }),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 60 secondes
          limit: 100, // 100 requêtes max
        },
      ],
    }),
    MongooseModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        uri: config.get('MONGODB_URL'),
        autoCreate: true,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    EmployeModule,
    SessionModule,
    RubriqueModule,
    CategorieModule,
    DivisionModule,
    ServiceModule,
    FonctionModule,
    TypedocumentModule,
    DocumentModule,
    NominationModule,
    AttributionFonctionnelleModule,
    AttributionGlobaleModule,
    AttributionIndividuelleModule,
    ExclusionSpecifiqueModule,
    LotModule,
    BulletinModule,
    AbsenceModule,
    CongeModule,
    PieceJointeModule,
    WorkflowModule,
    AuthModule.forRoot({
      auth,
      // Fix pour Express 5: le pattern /*path met req.url=/ et req.baseUrl=full_path
      // Ce middleware restaure req.url au chemin complet avant le handler
      middleware: (req, _res, next) => {
        req.url = req.originalUrl;
        req.baseUrl = '';
        next();
      },
    }),
  ],
  providers: [AppService, {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },],
})
export class AppModule {}

