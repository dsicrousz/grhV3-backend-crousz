import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { Contrat, ContratSchema } from 'src/contrat/entities/contrat.entity';
import { Employe, EmployeSchema } from 'src/employe/entities/employe.entity';
import { Bulletin, bulletinSchema } from 'src/bulletin/entities/bulletin.entity';
import { Lot, LotSchema } from 'src/lot/entities/lot.entity';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Contrat.name, schema: ContratSchema },
            { name: Employe.name, schema: EmployeSchema },
            { name: Bulletin.name, schema: bulletinSchema },
            { name: Lot.name, schema: LotSchema },
        ]),
    ],
    controllers: [ReportingController],
    providers: [ReportingService],
})
export class ReportingModule {}
