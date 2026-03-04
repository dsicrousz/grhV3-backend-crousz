import { Module } from '@nestjs/common';
import { DivisionService } from './division.service';
import { DivisionController } from './division.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Division, DivisionSchema } from './entities/division.entity';

@Module({
  imports:[MongooseModule.forFeature([{name: Division.name,schema: DivisionSchema}])],
  controllers: [DivisionController],
  providers: [DivisionService],
})
export class DivisionModule {}
