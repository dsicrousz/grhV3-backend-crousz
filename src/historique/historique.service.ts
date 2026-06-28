import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Historique, HistoriqueDocument, TypeEvenement } from './entities/historique.entity';
import { CreateHistoriqueDto } from './dto/create-historique.dto';
import { UpdateHistoriqueDto } from './dto/update-historique.dto';

@Injectable()
export class HistoriqueService extends AbstractModel<Historique, CreateHistoriqueDto, UpdateHistoriqueDto> {
    constructor(@InjectModel(Historique.name) private readonly historiqueModel: Model<HistoriqueDocument>) {
        super(historiqueModel);
    }

    async findByEmploye(employeId: string): Promise<Historique[]> {
        try {
            return await this.historiqueModel.find({ employe: employeId }).sort({ createdAt: -1 });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findByEmployeAndType(employeId: string, type: TypeEvenement): Promise<Historique[]> {
        try {
            return await this.historiqueModel.find({ employe: employeId, type_evenement: type }).sort({ createdAt: -1 });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async deleteByEmploye(employeId: string): Promise<number> {
        try {
            return (await this.historiqueModel.deleteMany({ employe: employeId })).deletedCount;
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }
}
