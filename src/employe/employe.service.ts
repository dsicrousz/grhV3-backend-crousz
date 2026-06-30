import { Injectable, HttpException, UnauthorizedException, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { UpdateEmployeDto } from './dto/update-employe.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Employe, EmployeDocument } from './entities/employe.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HistoriqueService } from 'src/historique/historique.service';
import { TypeEvenement } from 'src/historique/entities/historique.entity';
import { getUserIdFromContext } from 'src/common/request-context';
import { ContratService } from 'src/contrat/contrat.service';
import { NominationService } from 'src/nomination/nomination.service';
import { BulletinService } from 'src/bulletin/bulletin.service';
import { BulletinCDDService } from 'src/bulletin-cdd/bulletin-cdd.service';
import { BulletinTemporaireService } from 'src/bulletin-temporaire/bulletin-temporaire.service';
import { AffectationSiteService } from 'src/affectation-site/affectation-site.service';
import { AttributionIndividuelleService } from 'src/attribution-individuelle/attribution-individuelle.service';
import { ExclusionSpecifiqueService } from 'src/exclusion-specifique/exclusion-specifique.service';
import { AbsenceService } from 'src/absence/absence.service';
import { CongeService } from 'src/conge/conge.service';
import { PieceJointeService } from 'src/piece-jointe/piece-jointe.service';

@Injectable()
export class EmployeService extends AbstractModel<Employe, CreateEmployeDto, UpdateEmployeDto> {
  constructor(
    @InjectModel(Employe.name) private readonly employeModel: Model<EmployeDocument>,
    private readonly historiqueService: HistoriqueService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly contratService: ContratService,
    private readonly nominationService: NominationService,
    private readonly bulletinService: BulletinService,
    private readonly bulletinCDDService: BulletinCDDService,
    private readonly bulletinTemporaireService: BulletinTemporaireService,
    private readonly affectationSiteService: AffectationSiteService,
    private readonly attributionIndividuelleService: AttributionIndividuelleService,
    private readonly exclusionSpecifiqueService: ExclusionSpecifiqueService,
    private readonly absenceService: AbsenceService,
    private readonly congeService: CongeService,
    private readonly pieceJointeService: PieceJointeService,
  ) {
    super(employeModel);
  }

  async create(createDto: CreateEmployeDto): Promise<Employe> {
    const employe = await super.create(createDto);
    await this.cacheManager.del('employes_all_agregated'); // Invalider le cache
    const auteur = getUserIdFromContext();
    await this.historiqueService.create({
      employe: employe._id,
      type_evenement: TypeEvenement.AUTRE,
      description: `Création du profil employé ${employe.prenom} ${employe.nom}`,
      details: { employe },
      auteur,
    });
    return employe;
  }


  async findOne(id: string): Promise<Employe & { contrat_actif?: any }> {
    const result = await this.employeModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id)
        },
      },
      {
        $addFields: {
          _idstring: {
            $toString: '$_id',
          },
        },
      },
      {
        $lookup: {
          from: 'contrats',
          localField: '_idstring',
          foreignField: 'employe',
          pipeline: [
            { $match: { est_actif: true } },
            { $sort: { date_debut: -1 } },
            { $limit: 1 },
            {
              $addFields: {
                categorieObjId: { $toObjectId: '$categorie' },
              },
            },
            {
              $lookup: {
                from: 'categories',
                localField: 'categorieObjId',
                foreignField: '_id',
                as: 'categorie',
              },
            },
            { $unwind: { path: '$categorie', preserveNullAndEmptyArrays: true } },
            {
              $addFields: {
                posteObjId: { $toObjectId: '$poste' },
              },
            },
            {
              $lookup: {
                from: 'postes',
                localField: 'posteObjId',
                foreignField: '_id',
                as: 'poste',
              },
            },
            { $unwind: { path: '$poste', preserveNullAndEmptyArrays: true } },
          ],
          as: 'contrat_actif',
        },
      },
      { $unwind: { path: '$contrat_actif', preserveNullAndEmptyArrays: true } },
    ]);
    return result[0];
  }

  async update(id: string, updateDto: UpdateEmployeDto): Promise<Employe> {
    const employeAvant = await this.findOne(id);
    const employe = await super.update(id, updateDto);
    const auteur = getUserIdFromContext();
    await this.historiqueService.create({
      employe: id,
      type_evenement: TypeEvenement.MODIFICATION_PROFIL,
      description: `Modification du profil employé`,
      details: { avant: employeAvant, apres: employe },
      auteur,
    });
    return employe;
  }

  async toggleState(id: string, dto: { is_actif: boolean }): Promise<Employe> {
    const employe = await this.employeModel.findByIdAndUpdate(id, dto, { returnDocument: 'after' });
    const typeEvenement = dto.is_actif ? TypeEvenement.ACTIVATION : TypeEvenement.DESACTIVATION;
    const description = dto.is_actif ? 'Activation du compte employé' : 'Désactivation du compte employé';
    const auteur = getUserIdFromContext();
    await this.historiqueService.create({
      employe: id,
      type_evenement: typeEvenement,
      description,
      details: { is_actif: dto.is_actif },
      auteur,
    });
    return employe;
  }

  async findByCode(code: string): Promise<Employe> {
    try {
      return await this.employeModel.findOne({ code });
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async findAllAgregated(): Promise<(Employe & { contrat_actif?: any })[]> {
    try {
      const cacheKey = 'employes_all_agregated';
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached as (Employe & { contrat_actif?: any })[];
      }

      const result = await this.employeModel.aggregate([
        {
          $addFields: {
            _idstring: {
              $toString: '$_id',
            },
          },
        },
        {
          $lookup: {
            from: 'contrats',
            localField: '_idstring',
            foreignField: 'employe',
            pipeline: [
              { $match: { est_actif: true } },
              { $sort: { date_debut: -1 } },
              { $limit: 1 },
              {
                $addFields: {
                  categorieObjId: { $toObjectId: '$categorie' },
                },
              },
              {
                $lookup: {
                  from: 'categories',
                  localField: 'categorieObjId',
                  foreignField: '_id',
                  as: 'categorie',
                },
              },
              { $unwind: { path: '$categorie', preserveNullAndEmptyArrays: true } },
              {
                $addFields: {
                  posteObjId: { $toObjectId: '$poste' },
                },
              },
              {
                $lookup: {
                  from: 'postes',
                  localField: 'posteObjId',
                  foreignField: '_id',
                  as: 'poste',
                },
              },
              { $unwind: { path: '$poste', preserveNullAndEmptyArrays: true } },
            ],
            as: 'contrat_actif',
          },
        },
        { $unwind: { path: '$contrat_actif', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'affectationsites',
            localField: '_idstring',
            foreignField: 'employe',
            pipeline: [
              { $match: { est_active: true } },
              { $sort: { date_debut: -1 } },
              { $limit: 1 },
              {
                $addFields: {
                  siteObjId: { $toObjectId: '$site' },
                  divisionObjId: { $toObjectId: '$division' },
                  serviceObjId: { $toObjectId: '$service' },
                },
              },
              {
                $lookup: {
                  from: 'sites',
                  localField: 'siteObjId',
                  foreignField: '_id',
                  as: 'site',
                },
              },
              { $unwind: { path: '$site', preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: 'divisions',
                  localField: 'divisionObjId',
                  foreignField: '_id',
                  as: 'division',
                },
              },
              { $unwind: { path: '$division', preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: 'services',
                  localField: 'serviceObjId',
                  foreignField: '_id',
                  as: 'service',
                },
              },
              { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
            ],
            as: 'affectation_site',
          },
        },
        { $unwind: { path: '$affectation_site', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'nominations',
            localField: '_idstring',
            foreignField: 'employe',
            pipeline: [
              { $match: { est_active: true } },
              {
                $addFields: {
                  ofonction: { $toObjectId: '$fonction' },
                  odivision: { $toObjectId: '$division' },
                  oservice: { $toObjectId: '$service' },
                },
              },
              {
                $lookup: {
                  from: 'fonctions',
                  localField: 'ofonction',
                  foreignField: '_id',
                  as: 'fonction',
                },
              },
              { $unwind: '$fonction' },
              {
                $lookup: {
                  from: 'divisions',
                  localField: 'odivision',
                  foreignField: '_id',
                  as: 'division',
                },
              },
              { $unwind: '$division' },
              {
                $lookup: {
                  from: 'services',
                  localField: 'oservice',
                  foreignField: '_id',
                  as: 'service',
                },
              },
              { $unwind: '$service' },
            ],
            as: 'nominations',
          },
        },
      ]);

      await this.cacheManager.set(cacheKey, result, 300); // 5 minutes TTL
      return result;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async findAll(): Promise<(Employe & { contrat_actif?: any })[]> {
    try {
      const result = await this.employeModel.aggregate([
        {
          $addFields: {
            _idstring: { $toString: '$_id' },
          },
        },
        {
          $lookup: {
            from: 'contrats',
            localField: '_idstring',
            foreignField: 'employe',
            pipeline: [
              { $match: { est_actif: true } },
              { $sort: { date_debut: -1 } },
              { $limit: 1 },
              {
                $addFields: {
                  categorieObjId: { $toObjectId: '$categorie' },
                },
              },
              {
                $lookup: {
                  from: 'categories',
                  localField: 'categorieObjId',
                  foreignField: '_id',
                  as: 'categorie',
                },
              },
              { $unwind: { path: '$categorie', preserveNullAndEmptyArrays: true } },
              {
                $addFields: {
                  posteObjId: { $toObjectId: '$poste' },
                },
              },
              {
                $lookup: {
                  from: 'postes',
                  localField: 'posteObjId',
                  foreignField: '_id',
                  as: 'poste',
                },
              },
              { $unwind: { path: '$poste', preserveNullAndEmptyArrays: true } },
            ],
            as: 'contrat_actif',
          },
        },
        { $unwind: { path: '$contrat_actif', preserveNullAndEmptyArrays: true } },
        { $sort: { createdAt: -1 } },
      ]);
      return result;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async findAllByPointage(): Promise<Employe[]> {
    try {
      return await this.employeModel.find({ is_actif: 1 }, { prenom: 1, nom: 1, code: 1 });
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async findActive(): Promise<Employe[]> {
    try {
      return await this.employeModel.find({ is_actif: 1 });
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async findByMat(mat: string): Promise<Employe> {
    try {
      return await this.employeModel.findOne({ nci: mat });
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async remove(id: string): Promise<Employe> {
    try {
      await Promise.all([
        this.contratService.deleteByEmploye(id),
        this.nominationService.deleteByEmploye(id),
        this.bulletinService.deleteByEmploye(id),
        this.bulletinCDDService.deleteByEmploye(id),
        this.bulletinTemporaireService.deleteByEmploye(id),
        this.affectationSiteService.deleteByEmploye(id),
        this.attributionIndividuelleService.deleteByEmploye(id),
        this.exclusionSpecifiqueService.deleteByEmploye(id),
        this.absenceService.deleteByEmploye(id),
        this.congeService.deleteByEmploye(id),
        this.pieceJointeService.deleteByEmploye(id),
        this.historiqueService.deleteByEmploye(id),
      ]);
      await this.cacheManager.del('employes_all_agregated');
      return await super.remove(id);
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}
