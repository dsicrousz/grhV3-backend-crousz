import { Injectable, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractModel } from 'src/packe/abstractmodel';
import { BulletinTemporaire, BulletinTemporaireDocument } from './entities/bulletin-temporaire.entity';
import { CreateBulletinTemporaireDto } from './dto/create-bulletin-temporaire.dto';
import { UpdateBulletinTemporaireDto } from './dto/update-bulletin-temporaire.dto';

@Injectable()
export class BulletinTemporaireService extends AbstractModel<BulletinTemporaire, CreateBulletinTemporaireDto, UpdateBulletinTemporaireDto> {
    constructor(@InjectModel(BulletinTemporaire.name) private readonly bulletinModel: Model<BulletinTemporaireDocument>) {
        super(bulletinModel);
    }

    async createMany(createBulletinDtos: CreateBulletinTemporaireDto[]) {
        return await this.bulletinModel.insertMany(createBulletinDtos);
    }

    async deleteMany(idLot: string) {
        return await this.bulletinModel.deleteMany({ lot: idLot });
    }

    async updateBulletin(idEmploye: string, updateBulletinDto: CreateBulletinTemporaireDto) {
        return await this.bulletinModel.findOneAndUpdate(
            { employe: idEmploye, lot: updateBulletinDto.lot },
            updateBulletinDto,
            { upsert: true},
        );
    }

    async findByLot(idLot: string): Promise<BulletinTemporaire[]> {
        try {
            return await this.bulletinModel.find({ lot: idLot }).populate('employe');
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findByEmploye(id: string): Promise<BulletinTemporaire[]> {
        try {
            return await this.bulletinModel.find({ employe: id });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }
}
