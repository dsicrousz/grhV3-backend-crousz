import { Injectable } from '@nestjs/common';
import { CreatePosteDto } from './dto/create-poste.dto';
import { UpdatePosteDto } from './dto/update-poste.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Poste, PosteDocument } from './entities/poste.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class PosteService extends AbstractModel<Poste, CreatePosteDto, UpdatePosteDto>{
  constructor(@InjectModel(Poste.name) private readonly sessionModel: Model<PosteDocument>){
    super(sessionModel);
  }
}
