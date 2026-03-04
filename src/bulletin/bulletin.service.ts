import { Injectable } from '@nestjs/common';
import { CreateBulletinDto } from './dto/create-bulletin.dto';
import { UpdateBulletinDto } from './dto/update-bulletin.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Bulletin, BulletinDocument } from './entities/bulletin.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class BulletinService extends AbstractModel<Bulletin,CreateBulletinDto,UpdateBulletinDto>{
 constructor(@InjectModel(Bulletin.name) private readonly bulletinModel: Model<BulletinDocument>){
  super(bulletinModel);
 } 

 async createMany(dto: CreateBulletinDto[]): Promise<Bulletin[]> {
    try {
      const bulletins = dto.map((bulletin) => new this.bulletinModel(bulletin));
      return await this.bulletinModel.create(bulletins);
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
 }

 async deleteMany(idLot: string): Promise<any> {
    try {
      return (await this.bulletinModel.deleteMany({lot: idLot})).deletedCount;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async updateBulletin(idEmp:string,bulletin:CreateBulletinDto): Promise<Bulletin>{
    try {
      return await this.bulletinModel.findOneAndUpdate({employe:idEmp},bulletin,{upsert:true});
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async findByLot(idLot:string):Promise<Bulletin[]>{
    try {
      return await this.bulletinModel.find({lot:idLot});
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async findByEmploye(id:string):Promise<Bulletin[]>{
    try {
      return await this.bulletinModel.find({employe:id});
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}
