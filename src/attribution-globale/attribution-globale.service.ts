import { Injectable } from '@nestjs/common';
import { CreateAttributionGlobaleDto } from './dto/create-attribution-globale.dto';
import { UpdateAttributionGlobaleDto } from './dto/update-attribution-globale.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { AttributionGlobale, AttributionGlobaleDocument } from './entities/attribution-globale.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AttributionGlobaleService extends AbstractModel<AttributionGlobale,CreateAttributionGlobaleDto,UpdateAttributionGlobaleDto>{
  constructor(@InjectModel(AttributionGlobale.name) private readonly attributionGlobalModel: Model<AttributionGlobaleDocument>){
    super(attributionGlobalModel);
  }
}
