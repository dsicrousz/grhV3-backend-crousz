import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RequestContextMiddleware } from './common/request-context.middleware';
import { AppService } from './app.service';
import { EmployeModule } from './employe/employe.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LogAggregatorModule } from './log-aggregator/log-aggregator.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionModule } from './session/session.module';
import { RubriqueModule } from './rubrique/rubrique.module';
import { CategorieModule } from './categorie/categorie.module';
import { DivisionModule } from './division/division.module';
import { ServiceModule } from './service/service.module';
import { FonctionModule } from './fonction/fonction.module';
import { PosteModule } from './poste/poste.module';
import { TypedocumentModule } from './typedocument/typedocument.module';
import { DocumentModule } from './document/document.module';
import { NominationModule } from './nomination/nomination.module';
import { AttributionFonctionnelleModule } from './attribution-fonctionnelle/attribution-fonctionnelle.module';
import { AttributionGlobaleModule } from './attribution-globale/attribution-globale.module';
import { AttributionIndividuelleModule } from './attribution-individuelle/attribution-individuelle.module';
import { ExclusionSpecifiqueModule } from './exclusion-specifique/exclusion-specifique.module';
import { LotModule } from './lot/lot.module';
import { LotCDDModule } from './lot-cdd/lot-cdd.module';
import { LotTemporaireModule } from './lot-temporaire/lot-temporaire.module';
import { BulletinModule } from './bulletin/bulletin.module';
import { BulletinCDDModule } from './bulletin-cdd/bulletin-cdd.module';
import { BulletinTemporaireModule } from './bulletin-temporaire/bulletin-temporaire.module';
import { AbsenceModule } from './absence/absence.module';
import { CongeModule } from './conge/conge.module';
import { PieceJointeModule } from './piece-jointe/piece-jointe.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD} from '@nestjs/core';
import { AuthModule, AuthGuard } from '@thallesp/nestjs-better-auth';
import { RolesGuard } from './common/guards';
import { auth } from './lib/auth';
import { BullModule } from '@nestjs/bullmq';
import { ContratModule } from './contrat/contrat.module';
import { SiteModule } from './site/site.module';
import { AffectationSiteModule } from './affectation-site/affectation-site.module';
import { HistoriqueModule } from './historique/historique.module';
import { ReportingModule } from './reporting/reporting.module';
import { StorageModule } from './storage/storage.module';
import { MotifRuptureModule } from './motif-rupture/motif-rupture.module';
import { ParametreBulletinModule } from './parametre-bulletin/parametre-bulletin.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { SessionAuditModule } from './session-audit/session-audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // no need to import into other modules
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        url: config.get<string>('REDIS_URL'),
        ttl: 300,
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        connection: {
          url: config.get('REDIS_URL')
        },
      }),
      inject: [ConfigService],
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
    PosteModule,
    TypedocumentModule,
    DocumentModule,
    NominationModule,
    AttributionFonctionnelleModule,
    AttributionGlobaleModule,
    AttributionIndividuelleModule,
    ExclusionSpecifiqueModule,
    LotModule,
    LotCDDModule,
    LotTemporaireModule,
    BulletinModule,
    BulletinCDDModule,
    BulletinTemporaireModule,
    AbsenceModule,
    CongeModule,
    PieceJointeModule,
    ContratModule,
    SiteModule,
    AffectationSiteModule,
    HistoriqueModule,
    ReportingModule,
    StorageModule,
    MotifRuptureModule,
    ParametreBulletinModule,
    LogAggregatorModule,
    SessionAuditModule,
    AuthModule.forRoot({ auth }),
  ],
  providers: [AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}

