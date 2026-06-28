import { Injectable, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractModel } from 'src/packe/abstractmodel';
import { ParametreBulletin, ParametreBulletinDocument } from './entities/parametre-bulletin.entity';
import { CreateParametreBulletinDto } from './dto/create-parametre-bulletin.dto';
import { UpdateParametreBulletinDto } from './dto/update-parametre-bulletin.dto';

@Injectable()
export class ParametreBulletinService extends AbstractModel<ParametreBulletin, CreateParametreBulletinDto, UpdateParametreBulletinDto> {
    constructor(@InjectModel(ParametreBulletin.name) private readonly parametreModel: Model<ParametreBulletinDocument>) {
        super(parametreModel);
    }

    async findByAnnee(annee: number): Promise<ParametreBulletin | null> {
        try {
            return await this.parametreModel.findOne({ annee });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }
}
