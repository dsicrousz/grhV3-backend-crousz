import { Module } from '@nestjs/common';
import { CategorieService } from './categorie.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Categorie, CategorieSchema } from './entities/categorie.entity';
import { CategorieController } from './categorie.controller';

@Module({
  imports:[MongooseModule.forFeature([{name: Categorie.name,schema: CategorieSchema}])],
  controllers: [CategorieController],
  providers: [CategorieService],
})
export class CategorieModule {}
