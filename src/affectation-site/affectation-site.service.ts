import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractModel } from 'src/packe/abstractmodel';
import { AffectationSite, AffectationSiteDocument } from './entities/affectation-site.entity';
import { CreateAffectationSiteDto } from './dto/create-affectation-site.dto';
import { UpdateAffectationSiteDto } from './dto/update-affectation-site.dto';
import { HistoriqueService } from 'src/historique/historique.service';
import { TypeEvenement } from 'src/historique/entities/historique.entity';
import { getUserIdFromContext } from 'src/common/request-context';

@Injectable()
export class AffectationSiteService extends AbstractModel<AffectationSite, CreateAffectationSiteDto, UpdateAffectationSiteDto> {
    constructor(
        @InjectModel(AffectationSite.name) private readonly affectationSiteModel: Model<AffectationSiteDocument>,
        private readonly historiqueService: HistoriqueService,
    ) {
        super(affectationSiteModel);
    }

    async create(createDto: CreateAffectationSiteDto): Promise<AffectationSite> {
        const affectation = await super.create(createDto);
        const auteur = getUserIdFromContext();
        await this.historiqueService.create({
            employe: affectation.employe,
            type_evenement: TypeEvenement.AFFECTATION_SITE,
            description: `Nouvelle affectation à un site`,
            details: { affectation },
            auteur,
        });
        return affectation;
    }

    async update(id: string, updateDto: UpdateAffectationSiteDto): Promise<AffectationSite> {
        const affectationAvant = await this.findOne(id);
        const affectation = await super.update(id, updateDto);
        const auteur = getUserIdFromContext();
        await this.historiqueService.create({
            employe: affectation.employe,
            type_evenement: TypeEvenement.AFFECTATION_SITE,
            description: `Modification d'affectation à un site`,
            details: { avant: affectationAvant, apres: affectation },
            auteur,
        });
        return affectation;
    }

    async terminer(id: string): Promise<AffectationSite> {
        const affectation = await this.affectationSiteModel.findByIdAndUpdate(id, { est_active: false, date_fin: new Date() }, { returnDocument: 'after' });
        const auteur = getUserIdFromContext();
        await this.historiqueService.create({
            employe: affectation.employe,
            type_evenement: TypeEvenement.FIN_AFFECTATION_SITE,
            description: `Fin d'affectation au site`,
            details: { affectation, date_fin: new Date() },
            auteur,
        });
        return affectation;
    }

    async findByEmploye(employeId: string): Promise<AffectationSite[]> {
        try {
            return await this.affectationSiteModel.find({ employe: employeId }).sort({ date_debut: -1 });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async deleteByEmploye(employeId: string): Promise<number> {
        try {
            return (await this.affectationSiteModel.deleteMany({ employe: employeId })).deletedCount;
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findActiveByEmploye(employeId: string): Promise<AffectationSite> {
        try {
            return await this.affectationSiteModel.findOne({ employe: employeId, est_active: true });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findBySite(siteId: string): Promise<AffectationSite[]> {
        try {
            return await this.affectationSiteModel.find({ site: siteId, est_active: true });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findByDivision(divisionId: string): Promise<AffectationSite[]> {
        try {
            return await this.affectationSiteModel.find({ division: divisionId, est_active: true }).populate('employe').populate('site');
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async findByService(serviceId: string): Promise<AffectationSite[]> {
        try {
            return await this.affectationSiteModel.find({ service: serviceId, est_active: true }).populate('employe').populate('site');
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async countByDivision(): Promise<any[]> {
        try {
            return await this.affectationSiteModel.aggregate([
                { $match: { est_active: true, division: { $exists: true, $ne: null } } },
                {
                    $lookup: {
                        from: 'divisions',
                        localField: 'division',
                        foreignField: '_id',
                        as: 'divisionData'
                    }
                },
                { $unwind: '$divisionData' },
                {
                    $group: {
                        _id: '$division',
                        nom: { $first: '$divisionData.nom' },
                        count: { $sum: 1 }
                    }
                }
            ]);
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async countByService(): Promise<any[]> {
        try {
            return await this.affectationSiteModel.aggregate([
                { $match: { est_active: true, service: { $exists: true, $ne: null } } },
                {
                    $lookup: {
                        from: 'services',
                        localField: 'service',
                        foreignField: '_id',
                        as: 'serviceData'
                    }
                },
                { $unwind: '$serviceData' },
                {
                    $group: {
                        _id: '$service',
                        nom: { $first: '$serviceData.nom' },
                        count: { $sum: 1 }
                    }
                }
            ]);
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }
}
