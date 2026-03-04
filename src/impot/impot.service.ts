import { HttpException, Injectable } from '@nestjs/common';
import { CreateImpotDto } from './dto/create-impot.dto';
import { UpdateImpotDto } from './dto/update-impot.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Impot, ImpotDocument } from './entities/impot.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ImpotService extends AbstractModel<Impot,CreateImpotDto,UpdateImpotDto>{
  constructor(@InjectModel(Impot.name) private readonly impotModel: Model<ImpotDocument>){
    super(impotModel);
  }

  async findOneByVal(val: number): Promise<Impot> {
      try {
        let v =  val % 1000;
            if(v !== 0) {
              v = Math.floor(val / 1000) * 1000; 
              return this.impotModel.findOne({vals:v})
            }else{
              return this.impotModel.findOne({vals:val})
            }
      } catch (error) {
        throw new HttpException(error.message,500);
      }
  }

}
