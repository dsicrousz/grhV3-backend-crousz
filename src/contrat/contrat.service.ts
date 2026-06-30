import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Contrat, ContratDocument, MotifTerminaison, TypeContrat } from './entities/contrat.entity';
import { CreateContratDto } from './dto/create-contrat.dto';
import { UpdateContratDto } from './dto/update-contrat.dto';
import { TerminerContratDto } from './dto/terminer-contrat.dto';
import { HistoriqueService } from 'src/historique/historique.service';
import { TypeEvenement } from 'src/historique/entities/historique.entity';
import { getUserIdFromContext } from 'src/common/request-context';

@Injectable()
export class ContratService extends AbstractModel<Contrat, CreateContratDto, UpdateContratDto> {
    constructor(
        @InjectModel(Contrat.name) private readonly contratModel: Model<ContratDocument>,
        private readonly historiqueService: HistoriqueService,
    ) {
        super(contratModel);
    }

    async create(createDto: CreateContratDto): Promise<Contrat> {
        const contrat = await super.create(createDto);
        const auteur = getUserIdFromContext();
        await this.historiqueService.create({
            employe: contrat.employe,
            type_evenement: TypeEvenement.CONTRAT_CREATION,
            description: `Création d'un contrat ${contrat.type} pour le poste ${contrat.poste}`,
            details: { contrat },
            auteur,
        });
        return contrat;
    }

    async update(id: string, updateDto: UpdateContratDto): Promise<Contrat> {
        const contratAvant = await this.findOne(id);
        const contrat = await super.update(id, updateDto);
        const auteur = getUserIdFromContext();
        await this.historiqueService.create({
            employe: contrat.employe,
            type_evenement: TypeEvenement.CONTRAT_MODIFICATION,
            description: `Modification du contrat ${contrat.type}`,
            details: { avant: contratAvant, apres: contrat },
            auteur,
        });
        return contrat;
    }

    async terminer(id: string, dto: TerminerContratDto): Promise<Contrat> {
        const dateFin = dto.date_fin ? new Date(dto.date_fin) : new Date();
        const contrat = await super.update(id, {
            est_actif: false,
            date_fin: dateFin,
            motif_terminaison: dto.motif_terminaison,
        } as any);
        const auteur = getUserIdFromContext();
        await this.historiqueService.create({
            employe: contrat.employe,
            type_evenement: TypeEvenement.CONTRAT_FIN,
            description: `Fin du contrat ${contrat.type} pour le poste ${contrat.poste} (${dto.motif_terminaison})`,
            details: { contrat, date_fin: dateFin, motif_terminaison: dto.motif_terminaison },
            auteur,
        });
        return contrat;
    }

    async findTerminaisons(motif?: MotifTerminaison, annee?: number): Promise<Contrat[]> {
        try {
            const query: any = { est_actif: false, motif_terminaison: { $exists: true, $ne: null } };
            if (motif) {
                query.motif_terminaison = motif;
            }
            if (annee) {
                const debut = new Date(annee, 0, 1);
                const fin = new Date(annee + 1, 0, 1);
                query.date_fin = { $gte: debut, $lt: fin };
            }
            return await this.contratModel
                .find(query)
                .sort({ date_fin: -1, motif_terminaison: 1 })
                .populate('employe')
                .populate('poste');
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findByEmploye(employeId: string): Promise<Contrat[]> {
        try {
            return await this.contratModel.find({ employe: employeId }).sort({ date_debut: -1 });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findActiveByEmploye(employeId: string): Promise<Contrat> {
        try {
            return await this.contratModel.findOne({ employe: employeId, est_actif: true }).populate('categorie').populate('poste');
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findActiveByEmployes(employeIds: string[]): Promise<Map<string, Contrat>> {
        try {
            const contrats = await this.contratModel
                .find({ employe: { $in: employeIds }, est_actif: true })
                .populate('categorie')
                .populate('poste');
            const map = new Map<string, Contrat>();
            for (const c of contrats) {
                const empId = (c.employe as any)?._id?.toString() ?? c.employe?.toString();
                if (empId && !map.has(empId)) {
                    map.set(empId, c);
                }
            }
            return map;
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findByType(type: TypeContrat): Promise<Contrat[]> {
        try {
            return await this.contratModel.find({ type, est_actif: true }).sort({ date_debut: -1 });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findFirstContratByEmploye(employeId: string): Promise<Contrat | null> {
        try {
            return await this.contratModel.findOne({ employe: employeId, type: { $ne: TypeContrat.TEMPORAIRE } }).sort({ date_debut: 1 });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async deleteByEmploye(employeId: string): Promise<number> {
        try {
            return (await this.contratModel.deleteMany({ employe: employeId })).deletedCount;
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }
}
