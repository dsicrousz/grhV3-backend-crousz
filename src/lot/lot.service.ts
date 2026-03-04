import { HttpException, Injectable } from '@nestjs/common';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Lot, LotDocument, StateLot } from './entities/lot.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class LotService extends AbstractModel<Lot,CreateLotDto,UpdateLotDto>{
  constructor(@InjectModel(Lot.name) private readonly lotModel: Model<LotDocument>){
    super(lotModel);
  }

  async createLot(createLotDto:CreateLotDto): Promise<Lot>{
    try {
      const d = createLotDto.debut.split('-');
      const annee = d[0];
      const mois = d[1];
      const createdLot = new this.lotModel({...createLotDto,annee: +annee,mois:+mois});
      return await createdLot.save();
    } catch (error) {
      throw new HttpException(error,500);
    }
  }

  async findAllValide(): Promise<Lot[]> {
      try {
        return await this.lotModel.find({etat: StateLot.VALIDE});
      } catch (error) {
        throw new HttpException(error.message,500);
      }
  }


  async submit(id: string): Promise<Lot> {
    try {
      return await this.lotModel.findByIdAndUpdate(id, { etat: StateLot.WAITING1 });
    } catch (error) {
      throw new HttpException(error.message,500);
    }
  }

  async cancelSubmit(id: string): Promise<Lot> {
    try {
      return await this.lotModel.findByIdAndUpdate(id, { etat: StateLot.BROUILLON });
    } catch (error) {
      throw new HttpException(error.message,500);
    }
  }

  async encours(id: string): Promise<Lot> {
    try {
      return await this.lotModel.findByIdAndUpdate(id, { etat: StateLot.WAITING2 });
    } catch (error) {
      throw new HttpException(error.message,500);
    }
  }

  async cancelEncours(id: string): Promise<Lot> {
    try {
      return await this.lotModel.findByIdAndUpdate(id, { etat: StateLot.WAITING1 });
    } catch (error) {
      throw new HttpException(error.message,500);
    }
  }

  async cancelValidate(id: string): Promise<Lot> {
    try {
      return await this.lotModel.findByIdAndUpdate(id, { etat: StateLot.WAITING2 });
    } catch (error) {
      throw new HttpException(error.message,500);
    }
  }

  async validate(id: string): Promise<Lot> {
    try {
      return await this.lotModel.findByIdAndUpdate(id, { etat: StateLot.VALIDE });
    } catch (error) {
      throw new HttpException(error.message,500);
    }
  }

  async findByAnneeAndOldMois(annee: number, mois: number): Promise<Lot[]> {
    try {
      return await this.lotModel.aggregate([
        {
          $match: {
            annee,
            mois: { $lt: mois }
          }
        },
        {
          $lookup: {
            from: 'bulletins',
            localField: '_id',
            foreignField: 'lot',
            as: 'bulletins'
          }
        }
      ]);
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

}
