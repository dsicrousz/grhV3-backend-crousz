import { Module } from '@nestjs/common';
import { ImpotService } from './impot.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Impot, ImpotSchema } from './entities/impot.entity';

@Module({
  imports:[MongooseModule.forFeature([{name: Impot.name,schema: ImpotSchema}])],
  providers: [ImpotService],
  exports:[ImpotService]
})
export class ImpotModule {}
