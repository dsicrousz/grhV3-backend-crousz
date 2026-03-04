import { Injectable } from '@nestjs/common';
import { CreateCategorieDto } from './dto/create-categorie.dto';
import { UpdateCategorieDto } from './dto/update-categorie.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Categorie, CategorieDocument } from './entities/categorie.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CategorieService extends AbstractModel<Categorie,CreateCategorieDto,UpdateCategorieDto>{
  constructor(@InjectModel(Categorie.name) private readonly categorieModel: Model<CategorieDocument>){
    super(categorieModel);
  }
}
