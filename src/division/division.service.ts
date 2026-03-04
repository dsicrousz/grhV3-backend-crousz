import { Injectable } from '@nestjs/common';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Division, DivisionDocument } from './entities/division.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class DivisionService extends AbstractModel<Division,CreateDivisionDto,UpdateDivisionDto>{
  constructor(@InjectModel(Division.name) private readonly divisionModel: Model<DivisionDocument>){
    super(divisionModel);
  }
}
