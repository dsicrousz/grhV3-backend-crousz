import { Module } from '@nestjs/common';
import { RubriqueService } from './rubrique.service';
import { RubriqueController } from './rubrique.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Rubrique, RubriqueSchema } from './entities/rubrique.entity';

@Module({
  imports:[MongooseModule.forFeature([{name:Rubrique.name,schema:RubriqueSchema}])],
  controllers: [RubriqueController],
  providers: [RubriqueService],
  exports: [RubriqueService]
})
export class RubriqueModule {}
