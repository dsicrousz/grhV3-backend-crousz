import { Injectable } from '@nestjs/common';
import { CreateBulletinDto } from './dto/create-bulletin.dto';
import { UpdateBulletinDto } from './dto/update-bulletin.dto';
import { PeriodLotStatisticsResponse } from './dto/period-lot-statistics.dto';
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

  async deleteByEmploye(employeId: string): Promise<number> {
    try {
      return (await this.bulletinModel.deleteMany({ employe: employeId })).deletedCount;
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
      return await this.bulletinModel.aggregate([
        { $match: { employe: new Types.ObjectId(id) } },
        { $lookup: { from: 'lots', localField: 'lot', foreignField: '_id', as: 'lot' } },
        { $unwind: '$lot' },
        { $sort: { 'lot.annee': -1, 'lot.mois': -1 } },
      ]);
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async upsertLegacyMany(
    bulletins: Array<{
      _id: Types.ObjectId;
      employe: Types.ObjectId;
      lot: Types.ObjectId;
      lignes: object;
      totalIm: number;
      totalNI: number;
      totalRet: number;
      totalPP: number;
      nap: number;
      url?: string;
      createdAt?: Date;
      updatedAt?: Date;
    }>
  ) {
    try {
      if (!bulletins.length) {
        return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
      }

      const result = await this.bulletinModel.collection.bulkWrite(
        bulletins.map((bulletin) => ({
          replaceOne: {
            filter: { _id: bulletin._id },
            replacement: bulletin,
            upsert: true,
          },
        })),
        { ordered: false },
      );

      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount,
      };
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async getLotStatisticsByPeriod(
    moisDebut?: number,
    anneeDebut?: number,
    moisFin?: number,
    anneeFin?: number,
  ): Promise<PeriodLotStatisticsResponse> {
    try {
      this.validatePeriodBoundary(moisDebut, anneeDebut, 'debut');
      this.validatePeriodBoundary(moisFin, anneeFin, 'fin');

      const startKey = this.toMonthKey(anneeDebut!, moisDebut!);
      const endKey = this.toMonthKey(anneeFin!, moisFin!);

      if (startKey > endKey) {
        throw new HttpException('La periode de debut doit etre inferieure ou egale a la periode de fin', 400);
      }

      const bulletins = await this.bulletinModel.aggregate([
        {
          $lookup: {
            from: 'lots',
            localField: 'lot',
            foreignField: '_id',
            as: 'lot',
          },
        },
        { $unwind: '$lot' },
        {
          $addFields: {
            periodeKey: { $add: [{ $multiply: ['$lot.annee', 100] }, '$lot.mois'] },
          },
        },
        {
          $match: {
            periodeKey: {
              $gte: startKey,
              $lte: endKey,
            },
          },
        },
        {
          $project: {
            _id: 1,
            employe: 1,
            totalIm: 1,
            totalNI: 1,
            totalRet: 1,
            totalPP: 1,
            nap: 1,
            lignes: 1,
            lot: {
              _id: '$lot._id',
              libelle: '$lot.libelle',
              mois: '$lot.mois',
              annee: '$lot.annee',
              etat: '$lot.etat',
            },
          },
        },
      ]);

      const lotsMap = new Map<string, any>();
      const monthsMap = new Map<string, any>();
      const rubriquesMap = new Map<string, any>();
      const employeIds = new Set<string>();

      let totalIm = 0;
      let totalNI = 0;
      let totalRet = 0;
      let totalPP = 0;
      let net = 0;

      for (const bulletin of bulletins) {
        const lotId = bulletin.lot._id.toString();
        const monthKey = this.toMonthString(bulletin.lot.annee, bulletin.lot.mois);
        const employeId = bulletin.employe?.toString?.() ?? String(bulletin.employe);
        const brut = this.toNumber(bulletin.totalIm) + this.toNumber(bulletin.totalNI);

        employeIds.add(employeId);

        totalIm += this.toNumber(bulletin.totalIm);
        totalNI += this.toNumber(bulletin.totalNI);
        totalRet += this.toNumber(bulletin.totalRet);
        totalPP += this.toNumber(bulletin.totalPP);
        net += this.toNumber(bulletin.nap);

        if (!lotsMap.has(lotId)) {
          lotsMap.set(lotId, {
            lotId,
            libelle: bulletin.lot.libelle,
            mois: bulletin.lot.mois,
            annee: bulletin.lot.annee,
            etat: bulletin.lot.etat,
            bulletinCount: 0,
            brut: 0,
            net: 0,
            totalIm: 0,
            totalNI: 0,
            totalRet: 0,
            totalPP: 0,
            employes: new Set<string>(),
            rubriques: new Map<string, any>(),
          });
        }

        const lotStats = lotsMap.get(lotId);
        lotStats.bulletinCount += 1;
        lotStats.brut += brut;
        lotStats.net += this.toNumber(bulletin.nap);
        lotStats.totalIm += this.toNumber(bulletin.totalIm);
        lotStats.totalNI += this.toNumber(bulletin.totalNI);
        lotStats.totalRet += this.toNumber(bulletin.totalRet);
        lotStats.totalPP += this.toNumber(bulletin.totalPP);
        lotStats.employes.add(employeId);

        if (!monthsMap.has(monthKey)) {
          monthsMap.set(monthKey, {
            key: monthKey,
            mois: bulletin.lot.mois,
            annee: bulletin.lot.annee,
            bulletinCount: 0,
            brut: 0,
            net: 0,
            totalIm: 0,
            totalNI: 0,
            totalRet: 0,
            totalPP: 0,
            lots: new Set<string>(),
            employes: new Set<string>(),
          });
        }

        const monthStats = monthsMap.get(monthKey);
        monthStats.bulletinCount += 1;
        monthStats.brut += brut;
        monthStats.net += this.toNumber(bulletin.nap);
        monthStats.totalIm += this.toNumber(bulletin.totalIm);
        monthStats.totalNI += this.toNumber(bulletin.totalNI);
        monthStats.totalRet += this.toNumber(bulletin.totalRet);
        monthStats.totalPP += this.toNumber(bulletin.totalPP);
        monthStats.lots.add(lotId);
        monthStats.employes.add(employeId);

        const lignes = [
          ...(Array.isArray(bulletin.lignes?.gains) ? bulletin.lignes.gains : []),
          ...(Array.isArray(bulletin.lignes?.retenues) ? bulletin.lignes.retenues : []),
        ];

        for (const ligne of lignes) {
          const rubriqueId = ligne?.rubrique?._id?.toString?.() ?? ligne?.rubrique?._id ?? null;
          const rubriqueKey = rubriqueId ?? `rubrique:${ligne?.rubrique?.code ?? ligne?.rubrique?.libelle ?? 'inconnue'}`;
          const rubriqueEntry = this.ensureRubriqueAccumulator(
            rubriquesMap,
            rubriqueKey,
            rubriqueId,
            ligne,
          );
          const lotRubriqueEntry = this.ensureRubriqueAccumulator(
            lotStats.rubriques,
            rubriqueKey,
            rubriqueId,
            ligne,
          );

          this.accumulateRubrique(rubriqueEntry, ligne);
          this.accumulateRubrique(lotRubriqueEntry, ligne);
        }
      }

      const lots = Array.from(lotsMap.values())
        .map((lotStats) => ({
          lotId: lotStats.lotId,
          libelle: lotStats.libelle,
          mois: lotStats.mois,
          annee: lotStats.annee,
          etat: lotStats.etat,
          bulletinCount: lotStats.bulletinCount,
          effectif: lotStats.employes.size,
          brut: this.roundValue(lotStats.brut),
          net: this.roundValue(lotStats.net),
          totalIm: this.roundValue(lotStats.totalIm),
          totalNI: this.roundValue(lotStats.totalNI),
          totalRet: this.roundValue(lotStats.totalRet),
          totalPP: this.roundValue(lotStats.totalPP),
          rubriques: this.finalizeRubriques(lotStats.rubriques),
        }))
        .sort((a, b) => this.toMonthKey(a.annee, a.mois) - this.toMonthKey(b.annee, b.mois));

      const evolutionMensuelle = Array.from(monthsMap.values())
        .map((monthStats) => ({
          key: monthStats.key,
          mois: monthStats.mois,
          annee: monthStats.annee,
          lotCount: monthStats.lots.size,
          bulletinCount: monthStats.bulletinCount,
          effectif: monthStats.employes.size,
          brut: this.roundValue(monthStats.brut),
          net: this.roundValue(monthStats.net),
          totalIm: this.roundValue(monthStats.totalIm),
          totalNI: this.roundValue(monthStats.totalNI),
          totalRet: this.roundValue(monthStats.totalRet),
          totalPP: this.roundValue(monthStats.totalPP),
        }))
        .sort((a, b) => this.toMonthKey(a.annee, a.mois) - this.toMonthKey(b.annee, b.mois));

      return {
        periode: {
          debut: {
            mois: moisDebut!,
            annee: anneeDebut!,
            key: this.toMonthString(anneeDebut!, moisDebut!),
          },
          fin: {
            mois: moisFin!,
            annee: anneeFin!,
            key: this.toMonthString(anneeFin!, moisFin!),
          },
          lotsCount: lots.length,
          bulletinsCount: bulletins.length,
        },
        totaux: {
          brut: this.roundValue(totalIm + totalNI),
          net: this.roundValue(net),
          totalIm: this.roundValue(totalIm),
          totalNI: this.roundValue(totalNI),
          totalRet: this.roundValue(totalRet),
          totalPP: this.roundValue(totalPP),
          effectif: employeIds.size,
        },
        evolutionMensuelle,
        rubriques: this.finalizeRubriques(rubriquesMap),
        lots,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status ?? 500);
    }
  }

  private validatePeriodBoundary(mois?: number, annee?: number, label?: string) {
    if (!Number.isInteger(mois) || !Number.isInteger(annee)) {
      throw new HttpException(`Les parametres mois${label === 'debut' ? 'Debut' : 'Fin'} et annee${label === 'debut' ? 'Debut' : 'Fin'} sont obligatoires`, 400);
    }

    if ((mois as number) < 1 || (mois as number) > 12) {
      throw new HttpException(`Le mois ${label} doit etre compris entre 1 et 12`, 400);
    }
  }

  private ensureRubriqueAccumulator(
    map: Map<string, any>,
    key: string,
    rubriqueId: string | null,
    ligne: any,
  ) {
    if (!map.has(key)) {
      map.set(key, {
        rubriqueId,
        code: ligne?.rubrique?.code ?? null,
        libelle: ligne?.rubrique?.libelle ?? 'Rubrique inconnue',
        type: ligne?.rubrique?.type ?? null,
        occurrences: 0,
        totalMontant: 0,
        totalBase: 0,
        totalTaux1: 0,
        totalTaux2: 0,
      });
    }

    return map.get(key);
  }

  private accumulateRubrique(target: any, ligne: any) {
    target.occurrences += 1;
    target.totalMontant += this.toNumber(ligne?.montant);
    target.totalBase += this.toNumber(ligne?.base);
    target.totalTaux1 += this.toNumber(ligne?.taux1);
    target.totalTaux2 += this.toNumber(ligne?.taux2);
  }

  private finalizeRubriques(map: Map<string, any>): any[] {
    return Array.from(map.values())
      .map((rubrique) => ({
        rubriqueId: rubrique.rubriqueId,
        code: rubrique.code,
        libelle: rubrique.libelle,
        type: rubrique.type,
        occurrences: rubrique.occurrences,
        totalMontant: this.roundValue(rubrique.totalMontant),
        totalBase: this.roundValue(rubrique.totalBase),
        totalTaux1: this.roundValue(rubrique.totalTaux1),
        totalTaux2: this.roundValue(rubrique.totalTaux2),
        moyenneMontant: this.roundValue(rubrique.occurrences ? rubrique.totalMontant / rubrique.occurrences : 0),
        moyenneBase: this.roundValue(rubrique.occurrences ? rubrique.totalBase / rubrique.occurrences : 0),
      }))
      .sort((a, b) => b.totalMontant - a.totalMontant);
  }

  private toMonthKey(annee: number, mois: number) {
    return (annee * 100) + mois;
  }

  private toMonthString(annee: number, mois: number) {
    return `${annee}-${`${mois}`.padStart(2, '0')}`;
  }

  private toNumber(value: unknown) {
    const num = Number(value ?? 0);
    return Number.isFinite(num) ? num : 0;
  }

  private roundValue(value: number) {
    return Math.round(value * 100) / 100;
  }
}
