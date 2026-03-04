import { HttpException, Injectable } from '@nestjs/common';
import { CreateAttributionIndividuelleDto } from './dto/create-attribution-individuelle.dto';
import { UpdateAttributionIndividuelleDto } from './dto/update-attribution-individuelle.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { AttributionIndividuelle, AttributionIndividuelleDocument } from './entities/attribution-individuelle.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AttributionIndividuelleService extends AbstractModel<AttributionIndividuelle,CreateAttributionIndividuelleDto,UpdateAttributionIndividuelleDto>{
  constructor(@InjectModel(AttributionIndividuelle.name) private readonly attributionIndividuelleModel: Model<AttributionIndividuelleDocument>){
    super(attributionIndividuelleModel);
  }

  async findByEmploye(emp: string):Promise<AttributionIndividuelle[]> {
    try {
      return await this.attributionIndividuelleModel.find().where('employe').equals(emp);
    } catch (error) {
      throw new HttpException(error.message,500)
    }
  }

  async findByRubrique(ru: string):Promise<AttributionIndividuelle[]> {
    try {
      return await this.attributionIndividuelleModel.find().where('rubrique').equals(ru);
    } catch (error) {
      throw new HttpException(error.message,500)
    }
  }
}
