import { HttpException, Injectable } from '@nestjs/common';
import { CreateExclusionSpecifiqueDto } from './dto/create-exclusion-specifique.dto';
import { UpdateExclusionSpecifiqueDto } from './dto/update-exclusion-specifique.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { ExclusionSpecifique, ExclusionSpecifiqueDocument } from './entities/exclusion-specifique.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ExclusionSpecifiqueService extends AbstractModel<ExclusionSpecifique,CreateExclusionSpecifiqueDto,UpdateExclusionSpecifiqueDto>{
  constructor(@InjectModel(ExclusionSpecifique.name) private readonly exclusionSpecifiqueModel: Model<ExclusionSpecifiqueDocument>){
    super(exclusionSpecifiqueModel);
  }

  async findByEmploye(emp: string):Promise<ExclusionSpecifique[]> {
    try {
      return await this.exclusionSpecifiqueModel.find().where('employe').equals(emp);
    } catch (error) {
      throw new HttpException(error.message,500)
    }
  }

  async findByRubrique(ru: string):Promise<ExclusionSpecifique[]> {
    try {
      return await this.exclusionSpecifiqueModel.find().where('rubrique').equals(ru);
    } catch (error) {
      throw new HttpException(error.message,500)
    }
  }
}
