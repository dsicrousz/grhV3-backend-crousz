import { HttpException, Injectable } from '@nestjs/common';
import { CreateLotCDDDto } from './dto/create-lot-cdd.dto';
import { UpdateLotCDDDto } from './dto/update-lot-cdd.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { LotCDD, LotCDDDocument, StateLotCDD } from './entities/lot-cdd.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class LotCDDService extends AbstractModel<LotCDD, CreateLotCDDDto, UpdateLotCDDDto> {
    constructor(@InjectModel(LotCDD.name) private readonly lotModel: Model<LotCDDDocument>) {
        super(lotModel);
    }

    async createLot(createLotDto: CreateLotCDDDto): Promise<LotCDD> {
        try {
            const d = createLotDto.debut.split('-');
            const annee = d[0];
            const mois = d[1];
            const createdLot = new this.lotModel({ ...createLotDto, annee: +annee, mois: +mois });
            return await createdLot.save();
        } catch (error) {
            throw new HttpException(error, 500);
        }
    }

    async findAllValide(): Promise<LotCDD[]> {
        try {
            return await this.lotModel.find({ etat: StateLotCDD.VALIDE });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findAllTransmitted(): Promise<LotCDD[]> {
        try {
            return await this.lotModel.find({ isTransmitted: true }).lean();
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findOneWithBulletins(id: string): Promise<any> {
        try {
            const lots = await this.lotModel.aggregate([
                { $match: { _id: new Types.ObjectId(id) } },
                {
                    $lookup: {
                        from: 'bulletincdds',
                        localField: '_id',
                        foreignField: 'lot',
                        as: 'bulletins',
                    },
                },
                {
                    $addFields: {
                        bulletinsCount: { $size: '$bulletins' },
                        totalNap: { $sum: '$bulletins.nap' },
                        totalIm: { $sum: '$bulletins.totalIm' },
                        totalNI: { $sum: '$bulletins.totalNI' },
                        totalRet: { $sum: '$bulletins.totalRet' },
                        totalPP: { $sum: '$bulletins.totalPP' },
                    },
                },
            ]);
            return lots[0] ?? null;
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async submit(id: string): Promise<LotCDD> {
        try {
            return await this.lotModel.findByIdAndUpdate(id, { etat: StateLotCDD.WAITING1 });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async cancelSubmit(id: string): Promise<LotCDD> {
        try {
            return await this.lotModel.findByIdAndUpdate(id, { etat: StateLotCDD.BROUILLON });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async encours(id: string): Promise<LotCDD> {
        try {
            return await this.lotModel.findByIdAndUpdate(id, { etat: StateLotCDD.WAITING2 });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async cancelEncours(id: string): Promise<LotCDD> {
        try {
            return await this.lotModel.findByIdAndUpdate(id, { etat: StateLotCDD.WAITING1 });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async cancelValidate(id: string): Promise<LotCDD> {
        try {
            return await this.lotModel.findByIdAndUpdate(id, { etat: StateLotCDD.WAITING2 });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async validate(id: string): Promise<LotCDD> {
        try {
            return await this.lotModel.findByIdAndUpdate(id, { etat: StateLotCDD.VALIDE });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async transmit(id: string): Promise<LotCDD> {
        try {
            return await this.lotModel.findByIdAndUpdate(id, { isTransmitted: true }, { new: true });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async untransmit(id: string): Promise<LotCDD> {
        try {
            return await this.lotModel.findByIdAndUpdate(id, { isTransmitted: false }, { new: true });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }
}
