import { Module } from '@nestjs/common';
import { FonctionService } from './fonction.service';
import { FonctionController } from './fonction.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Fonction, FonctionSchema } from './entities/fonction.entity';

@Module({
  imports:[MongooseModule.forFeature([{name: Fonction.name,schema: FonctionSchema}])],
  controllers: [FonctionController],
  providers: [FonctionService],
})
export class FonctionModule {}
