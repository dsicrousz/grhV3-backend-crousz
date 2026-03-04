import { HttpException, Injectable } from '@nestjs/common';
import { CreateAttributionFonctionnelleDto } from './dto/create-attribution-fonctionnelle.dto';
import { UpdateAttributionFonctionnelleDto } from './dto/update-attribution-fonctionnelle.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { AttributionFonctionnelle, AttributionFonctionnelleDocument } from './entities/attribution-fonctionnelle.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AttributionFonctionnelleService extends AbstractModel<AttributionFonctionnelle,CreateAttributionFonctionnelleDto,UpdateAttributionFonctionnelleDto>{
  constructor(@InjectModel(AttributionFonctionnelle.name) private readonly attributionModel: Model<AttributionFonctionnelleDocument>){
    super(attributionModel);
  }

  async findByFonction(fonc: string):Promise<AttributionFonctionnelle[]>{
    try {
      return this.attributionModel.find({fonction: fonc})
    } catch (error) {
      throw new HttpException(error.message,500);
    }
  }
}
