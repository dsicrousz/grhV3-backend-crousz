import { HttpException, Injectable } from '@nestjs/common';
import { CreateNominationDto } from './dto/create-nomination.dto';
import { UpdateNominationDto } from './dto/update-nomination.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Nomination, NominationDocument } from './entities/nomination.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class NominationService extends AbstractModel<Nomination,CreateNominationDto,UpdateNominationDto>{
  constructor(@InjectModel(Nomination.name) private readonly nominationModel: Model<NominationDocument>){
    super(nominationModel);
  }

  async findByEmploye(emp: string):Promise<Nomination[]> {
    try {
      return this.nominationModel.find({employe: emp});
    } catch (error) {
      throw new HttpException(error.message,500)
    }
  }

  async findActiveByEmploye(emp: string):Promise<Nomination[]> {
    try {
      return this.nominationModel.find({employe: emp,est_active: true});
    } catch (error) {
      throw new HttpException(error.message,500)
    }
  }

  async toggleState(id: string, dto: {est_active: boolean}):Promise<Nomination> {
    try {
     return this.nominationModel.findByIdAndUpdate(id,dto)
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
   }
}
