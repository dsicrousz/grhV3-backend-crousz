import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContratService } from './contrat.service';
import { ContratController } from './contrat.controller';
import { Contrat, ContratSchema } from './entities/contrat.entity';
import { HistoriqueModule } from 'src/historique/historique.module';

@Module({
    imports: [
        MongooseModule.forFeatureAsync([{
            name: Contrat.name,
            useFactory: () => {
                const schema = ContratSchema;
                schema.plugin(require('mongoose-autopopulate'));
                return schema;
            },
        }]),
        HistoriqueModule,
    ],
    controllers: [ContratController],
    providers: [ContratService],
    exports: [ContratService],
})
export class ContratModule {}
