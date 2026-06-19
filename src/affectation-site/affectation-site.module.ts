import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AffectationSiteService } from './affectation-site.service';
import { AffectationSiteController } from './affectation-site.controller';
import { AffectationSite, AffectationSiteSchema } from './entities/affectation-site.entity';
import { HistoriqueModule } from 'src/historique/historique.module';

@Module({
    imports: [
        MongooseModule.forFeatureAsync([{
            name: AffectationSite.name,
            useFactory: () => {
                const schema = AffectationSiteSchema;
                schema.plugin(require('mongoose-autopopulate'));
                return schema;
            },
        }]),
        HistoriqueModule,
    ],
    controllers: [AffectationSiteController],
    providers: [AffectationSiteService],
    exports: [AffectationSiteService],
})
export class AffectationSiteModule {}
