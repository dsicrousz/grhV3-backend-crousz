import { HttpException, Injectable } from '@nestjs/common';
import { CreateBulletinCDDDto } from './dto/create-bulletin-cdd.dto';
import { UpdateBulletinCDDDto } from './dto/update-bulletin-cdd.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { BulletinCDD, BulletinCDDDocument } from './entities/bulletin-cdd.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class BulletinCDDService extends AbstractModel<BulletinCDD, CreateBulletinCDDDto, UpdateBulletinCDDDto> {
    constructor(@InjectModel(BulletinCDD.name) private readonly bulletinModel: Model<BulletinCDDDocument>) {
        super(bulletinModel);
    }

    async createMany(dto: CreateBulletinCDDDto[]): Promise<BulletinCDD[]> {
        try {
            const bulletins = dto.map((bulletin) => new this.bulletinModel(bulletin));
            return await this.bulletinModel.create(bulletins);
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async deleteMany(idLot: string): Promise<any> {
        try {
            return (await this.bulletinModel.deleteMany({ lot: idLot })).deletedCount;
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async updateBulletin(idEmp: string, bulletin: CreateBulletinCDDDto): Promise<BulletinCDD> {
        try {
            return await this.bulletinModel.findOneAndUpdate({ employe: idEmp, lot: bulletin.lot }, bulletin, { upsert: true });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findByLot(idLot: string): Promise<BulletinCDD[]> {
        try {
            return await this.bulletinModel.find({ lot: idLot });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findByEmploye(id: string): Promise<BulletinCDD[]> {
        try {
            return await this.bulletinModel.find({ employe: id });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }
}
