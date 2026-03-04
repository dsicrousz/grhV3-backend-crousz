import { Injectable } from '@nestjs/common';
import { CreateFonctionDto } from './dto/create-fonction.dto';
import { UpdateFonctionDto } from './dto/update-fonction.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Fonction, FonctionDocument } from './entities/fonction.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class FonctionService extends AbstractModel<Fonction,CreateFonctionDto,UpdateFonctionDto>{
  constructor(@InjectModel(Fonction.name) private readonly sessionModel: Model<FonctionDocument>){
    super(sessionModel);
  }
}