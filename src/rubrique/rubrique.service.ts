import { Injectable } from '@nestjs/common';
import { CreateRubriqueDto } from './dto/create-rubrique.dto';
import { UpdateRubriqueDto } from './dto/update-rubrique.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Rubrique, RubriqueDocument } from './entities/rubrique.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class RubriqueService extends AbstractModel<Rubrique,CreateRubriqueDto,UpdateRubriqueDto>{
  constructor(@InjectModel(Rubrique.name) private readonly rubriqueModel: Model<RubriqueDocument>){
    super(rubriqueModel);
  }
}
