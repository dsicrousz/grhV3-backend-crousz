import { Injectable, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractModel } from 'src/packe/abstractmodel';
import { LotTemporaire, LotTemporaireDocument, StateLotTemporaire } from './entities/lot-temporaire.entity';
import { CreateLotTemporaireDto } from './dto/create-lot-temporaire.dto';
import { UpdateLotTemporaireDto } from './dto/update-lot-temporaire.dto';

@Injectable()
export class LotTemporaireService extends AbstractModel<LotTemporaire, CreateLotTemporaireDto, UpdateLotTemporaireDto> {
    constructor(@InjectModel(LotTemporaire.name) private readonly lotTemporaireModel: Model<LotTemporaireDocument>) {
        super(lotTemporaireModel);
    }

    async createLot(createLotTemporaireDto: CreateLotTemporaireDto): Promise<LotTemporaire> {
        try {
            const d = createLotTemporaireDto.debut.split('-');
            const annee = d[0];
            const mois = d[1];
            const createdLot = new this.lotTemporaireModel({ ...createLotTemporaireDto, annee: +annee, mois: +mois });
            return await createdLot.save();
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findByAnneeAndOldMois(annee: number, mois: number): Promise<LotTemporaire[]> {
        try {
            return await this.lotTemporaireModel.find({
                annee,
                mois: { $lt: mois },
                etat: { $in: [StateLotTemporaire.VALIDE, 'PUBLIE'] },
            }).sort({ mois: -1 });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findAllValide(): Promise<LotTemporaire[]> {
        try {
            return await this.lotTemporaireModel.find({ etat: StateLotTemporaire.VALIDE });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async submit(id: string): Promise<LotTemporaire> {
        try {
            return await this.lotTemporaireModel.findByIdAndUpdate(id, { etat: StateLotTemporaire.WAITING1 });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async cancelSubmit(id: string): Promise<LotTemporaire> {
        try {
            return await this.lotTemporaireModel.findByIdAndUpdate(id, { etat: StateLotTemporaire.BROUILLON });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async encours(id: string): Promise<LotTemporaire> {
        try {
            return await this.lotTemporaireModel.findByIdAndUpdate(id, { etat: StateLotTemporaire.WAITING2 });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async cancelEncours(id: string): Promise<LotTemporaire> {
        try {
            return await this.lotTemporaireModel.findByIdAndUpdate(id, { etat: StateLotTemporaire.WAITING1 });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async cancelValidate(id: string): Promise<LotTemporaire> {
        try {
            return await this.lotTemporaireModel.findByIdAndUpdate(id, { etat: StateLotTemporaire.WAITING2 });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async validate(id: string): Promise<LotTemporaire> {
        try {
            return await this.lotTemporaireModel.findByIdAndUpdate(id, { etat: StateLotTemporaire.VALIDE });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }
}
