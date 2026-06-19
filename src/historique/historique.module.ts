import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoriqueService } from './historique.service';
import { HistoriqueController } from './historique.controller';
import { Historique, HistoriqueSchema } from './entities/historique.entity';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Historique.name, schema: HistoriqueSchema }]),
    ],
    controllers: [HistoriqueController],
    providers: [HistoriqueService],
    exports: [HistoriqueService],
})
export class HistoriqueModule {}
