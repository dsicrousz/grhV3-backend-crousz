import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RequestContextMiddleware } from './common/request-context.middleware';
import { AppService } from './app.service';
import { EmployeModule } from './employe/employe.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LogAggregatorModule } from './log-aggregator/log-aggregator.module';
import { LogAggregatorInterceptor } from './log-aggregator/interceptors/log-aggregator.interceptor';
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
import { WorkflowModule } from './workflow/workflow.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
import { LogAggregatorService } from './log-aggregator/log-aggregator.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // no need to import into other modules
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes par défaut
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
    WorkflowModule,
    ContratModule,
    SiteModule,
    AffectationSiteModule,
    HistoriqueModule,
    ReportingModule,
    StorageModule,
    LogAggregatorModule,
    AuthModule.forRootAsync({
      inject: [LogAggregatorService],
      useFactory: (logAggregatorService: LogAggregatorService) => ({
        auth,
        middleware: (req, _res, next) => {
          // Fix pour Express 5
          req.url = req.originalUrl;
          req.baseUrl = '';

          const start = Date.now();
          const originalEnd = _res.end;
          _res.end = function (...args: any[]) {
            const duration = Date.now() - start;
            logAggregatorService.sendAuthLog({
              action: `${req.method} ${req.originalUrl}`,
              message: `Auth ${req.method} ${req.originalUrl} ${_res.statusCode} ${duration}ms`,
              level: _res.statusCode >= 400
                ? (_res.statusCode >= 500 ? 'error' as any : 'warn' as any)
                : 'info' as any,
              userId: (req as any)?.user?.id,
              metadata: {
                method: req.method,
                url: req.originalUrl,
                statusCode: _res.statusCode,
                duration,
                ip: req.ip || req.socket?.remoteAddress,
                userAgent: req.headers['user-agent'],
              },
            }).catch(() => {});
            return originalEnd.apply(_res, args);
          };

          next();
        },
      }),
    }),
  ],
  providers: [AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: LogAggregatorInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}

