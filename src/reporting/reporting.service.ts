import { HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contrat, ContratDocument } from 'src/contrat/entities/contrat.entity';
import { Employe, EmployeDocument } from 'src/employe/entities/employe.entity';
import { Bulletin, BulletinDocument } from 'src/bulletin/entities/bulletin.entity';
import { Lot, LotDocument } from 'src/lot/entities/lot.entity';

export interface GroupCount {
    key: string;
    total: number;
}

export interface MasseSalariale {
    key: string;
    brut: number;
    net: number;
    chargesSalariales: number;
    chargesPatronales: number;
    effectif: number;
}

export interface TurnoverPoint {
    annee: number;
    mois?: number;
    embauches: number;
    departs: number;
    effectifDebut: number;
    effectifFin: number;
    effectifMoyen: number;
    tauxTurnover: number;
}

export interface CohorteRetention {
    anneeRecrutement: number;
    effectifInitial: number;
    encoreActifs: number;
    tauxRetention: number;
}

export interface MasseSalarialeMensuelle {
    annee: number;
    mois: number;
    key: string;
    brut: number;
    net: number;
    chargesSalariales: number;
    chargesPatronales: number;
    effectif: number;
}

@Injectable()
export class ReportingService {
    private readonly logger = new Logger(ReportingService.name);

    constructor(
        @InjectModel(Contrat.name) private readonly contratModel: Model<ContratDocument>,
        @InjectModel(Employe.name) private readonly employeModel: Model<EmployeDocument>,
        @InjectModel(Bulletin.name) private readonly bulletinModel: Model<BulletinDocument>,
        @InjectModel(Lot.name) private readonly lotModel: Model<LotDocument>,
    ) {}

    // =========================
    // EFFECTIF TOTAL
    // =========================

    async effectifByTypeContrat(): Promise<GroupCount[]> {
        try {
            const result = await this.contratModel.aggregate([
                { $match: { est_actif: true } },
                { $group: { _id: '$type', total: { $sum: 1 } } },
                { $project: { _id: 0, key: '$_id', total: 1 } },
                { $sort: { key: 1 } },
            ]);
            return result;
        } catch (error) {
            this.logger.error('effectifByTypeContrat failed', error);
            throw new HttpException(error.message, 500);
        }
    }

    async effectifByPeriode(debut: string, fin: string): Promise<{ debut: string; fin: string; total: number }> {
        try {
            const dDebut = new Date(debut);
            const dFin = new Date(fin);
            const total = await this.contratModel.countDocuments({
                date_debut: { $lte: dFin },
                $or: [
                    { date_fin: { $exists: false } },
                    { date_fin: null },
                    { date_fin: { $gte: dDebut } },
                ],
            });
            return { debut, fin, total };
        } catch (error) {
            this.logger.error('effectifByPeriode failed', error);
            throw new HttpException(error.message, 500);
        }
    }

    async effectifByAge(): Promise<GroupCount[]> {
        try {
            const employes = await this.employeModel
                .find({ is_actif: { $ne: 0 } })
                .select('date_de_naissance')
                .lean();
            const tranches: Record<string, number> = {
                '<25': 0,
                '25-34': 0,
                '35-44': 0,
                '45-54': 0,
                '55-64': 0,
                '65+': 0,
                'Inconnu': 0,
            };
            const today = new Date();
            for (const e of employes) {
                const d = e.date_de_naissance ? new Date(e.date_de_naissance) : null;
                if (!d || isNaN(d.getTime())) {
                    tranches['Inconnu']++;
                    continue;
                }
                const age = today.getFullYear() - d.getFullYear() -
                    (today < new Date(today.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
                if (age < 25) tranches['<25']++;
                else if (age < 35) tranches['25-34']++;
                else if (age < 45) tranches['35-44']++;
                else if (age < 55) tranches['45-54']++;
                else if (age < 65) tranches['55-64']++;
                else tranches['65+']++;
            }
            return Object.entries(tranches).map(([key, total]) => ({ key, total }));
        } catch (error) {
            this.logger.error('effectifByAge failed', error);
            throw new HttpException(error.message, 500);
        }
    }

    async effectifByAnneeRecrutement(): Promise<GroupCount[]> {
        try {
            const result = await this.contratModel.aggregate([
                { $match: { type: { $in: ['CDI', 'CDD'] } } },
                {
                    $sort: { employe: 1, date_debut: 1 },
                },
                {
                    $group: {
                        _id: '$employe',
                        date_debut: { $first: '$date_debut' },
                    },
                },
                {
                    $group: {
                        _id: { $year: '$date_debut' },
                        total: { $sum: 1 },
                    },
                },
                { $project: { _id: 0, key: { $toString: '$_id' }, total: 1 } },
                { $sort: { key: 1 } },
            ]);
            return result;
        } catch (error) {
            this.logger.error('effectifByAnneeRecrutement failed', error);
            throw new HttpException(error.message, 500);
        }
    }

    // =========================
    // REPARTITION DES CONTRATS
    // =========================

    async contratsByType(): Promise<GroupCount[]> {
        try {
            const result = await this.contratModel.aggregate([
                { $group: { _id: '$type', total: { $sum: 1 } } },
                { $project: { _id: 0, key: '$_id', total: 1 } },
                { $sort: { key: 1 } },
            ]);
            return result;
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async contratsByMotifRupture(): Promise<GroupCount[]> {
        try {
            const result = await this.contratModel.aggregate([
                { $match: { est_actif: false, motif_terminaison: { $exists: true, $ne: null } } },
                { $group: { _id: '$motif_terminaison', total: { $sum: 1 } } },
                { $project: { _id: 0, key: '$_id', total: 1 } },
                { $sort: { total: -1 } },
            ]);
            return result;
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    async contratsByAnnee(): Promise<GroupCount[]> {
        try {
            const result = await this.contratModel.aggregate([
                {
                    $group: {
                        _id: { $year: '$date_debut' },
                        total: { $sum: 1 },
                    },
                },
                { $project: { _id: 0, key: { $toString: '$_id' }, total: 1 } },
                { $sort: { key: 1 } },
            ]);
            return result;
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    // =========================
    // MASSE SALARIALE
    // =========================

    private async lotsByAnnee(annee?: number): Promise<string[]> {
        const query: any = {};
        if (annee) query.annee = annee;
        const lots = await this.lotModel.find(query).select('_id').lean();
        return lots.map((l) => String(l._id));
    }

    async masseSalarialeByAnnee(): Promise<MasseSalariale[]> {
        try {
            const result = await this.bulletinModel.aggregate([
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
                    $group: {
                        _id: '$lot.annee',
                        brut: { $sum: { $add: ['$totalIm', '$totalNI'] } },
                        net: { $sum: '$nap' },
                        chargesSalariales: { $sum: '$totalRet' },
                        chargesPatronales: { $sum: '$totalPP' },
                        effectif: { $addToSet: '$employe' },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        key: { $toString: '$_id' },
                        brut: 1,
                        net: 1,
                        chargesSalariales: 1,
                        chargesPatronales: 1,
                        effectif: { $size: '$effectif' },
                    },
                },
                { $sort: { key: 1 } },
            ]);
            return result;
        } catch (error) {
            this.logger.error('masseSalarialeByAnnee failed', error);
            throw new HttpException(error.message, 500);
        }
    }

    async masseSalarialeByEmploye(annee?: number): Promise<MasseSalariale[]> {
        try {
            const pipeline: any[] = [
                {
                    $lookup: {
                        from: 'lots',
                        localField: 'lot',
                        foreignField: '_id',
                        as: 'lot',
                    },
                },
                { $unwind: '$lot' },
            ];
            if (annee) {
                pipeline.push({ $match: { 'lot.annee': annee } });
            }
            pipeline.push(
                {
                    $group: {
                        _id: '$employe',
                        brut: { $sum: { $add: ['$totalIm', '$totalNI'] } },
                        net: { $sum: '$nap' },
                        chargesSalariales: { $sum: '$totalRet' },
                        chargesPatronales: { $sum: '$totalPP' },
                        effectif: { $sum: 1 },
                    },
                },
                {
                    $lookup: {
                        from: 'employes',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'employe',
                    },
                },
                { $unwind: { path: '$employe', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 0,
                        key: {
                            $concat: [
                                { $ifNull: ['$employe.prenom', ''] },
                                ' ',
                                { $ifNull: ['$employe.nom', ''] },
                            ],
                        },
                        employeId: '$employe._id',
                        brut: 1,
                        net: 1,
                        chargesSalariales: 1,
                        chargesPatronales: 1,
                        effectif: 1,
                    },
                },
                { $sort: { brut: -1 } },
            );
            return await this.bulletinModel.aggregate(pipeline);
        } catch (error) {
            this.logger.error('masseSalarialeByEmploye failed', error);
            throw new HttpException(error.message, 500);
        }
    }

    async masseSalarialeByPoste(annee?: number): Promise<MasseSalariale[]> {
        try {
            const pipeline: any[] = [
                {
                    $lookup: {
                        from: 'lots',
                        localField: 'lot',
                        foreignField: '_id',
                        as: 'lot',
                    },
                },
                { $unwind: '$lot' },
            ];
            if (annee) {
                pipeline.push({ $match: { 'lot.annee': annee } });
            }
            pipeline.push(
                {
                    $lookup: {
                        from: 'contrats',
                        let: { employeId: '$employe' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$employe', '$$employeId'] },
                                    est_actif: true,
                                },
                            },
                            { $limit: 1 },
                        ],
                        as: 'contrat',
                    },
                },
                { $unwind: { path: '$contrat', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'postes',
                        localField: 'contrat.poste',
                        foreignField: '_id',
                        as: 'poste',
                    },
                },
                { $unwind: { path: '$poste', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: { $ifNull: ['$poste.nom', 'NON AFFECTÉ'] },
                        brut: { $sum: { $add: ['$totalIm', '$totalNI'] } },
                        net: { $sum: '$nap' },
                        chargesSalariales: { $sum: '$totalRet' },
                        chargesPatronales: { $sum: '$totalPP' },
                        effectif: { $addToSet: '$employe' },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        key: '$_id',
                        brut: 1,
                        net: 1,
                        chargesSalariales: 1,
                        chargesPatronales: 1,
                        effectif: { $size: '$effectif' },
                    },
                },
                { $sort: { brut: -1 } },
            );
            return await this.bulletinModel.aggregate(pipeline);
        } catch (error) {
            this.logger.error('masseSalarialeByPoste failed', error);
            throw new HttpException(error.message, 500);
        }
    }

    // =========================
    // TURNOVER & RETENTION
    // =========================

    private async countEffectifAt(date: Date): Promise<number> {
        return this.contratModel.countDocuments({
            date_debut: { $lte: date },
            $or: [
                { date_fin: { $exists: false } },
                { date_fin: null },
                { date_fin: { $gte: date } },
            ],
        });
    }

    async turnoverByAnnee(anneeDebut?: number, anneeFin?: number): Promise<TurnoverPoint[]> {
        try {
            const maintenant = new Date();
            const debut = anneeDebut ?? maintenant.getFullYear() - 4;
            const fin = anneeFin ?? maintenant.getFullYear();
            const points: TurnoverPoint[] = [];
            for (let a = debut; a <= fin; a++) {
                const d0 = new Date(a, 0, 1);
                const d1 = new Date(a + 1, 0, 1);
                const [embauches, departs, effectifDebut, effectifFin] = await Promise.all([
                    this.contratModel.countDocuments({ date_debut: { $gte: d0, $lt: d1 } }),
                    this.contratModel.countDocuments({
                        est_actif: false,
                        date_fin: { $gte: d0, $lt: d1 },
                    }),
                    this.countEffectifAt(d0),
                    this.countEffectifAt(new Date(a, 11, 31)),
                ]);
                const effectifMoyen = (effectifDebut + effectifFin) / 2;
                const tauxTurnover = effectifMoyen > 0
                    ? Math.round((departs / effectifMoyen) * 10000) / 100
                    : 0;
                points.push({
                    annee: a,
                    embauches,
                    departs,
                    effectifDebut,
                    effectifFin,
                    effectifMoyen,
                    tauxTurnover,
                });
            }
            return points;
        } catch (error) {
            this.logger.error('turnoverByAnnee failed', error);
            throw new HttpException(error.message, 500);
        }
    }

    async turnoverByMois(annee: number): Promise<TurnoverPoint[]> {
        try {
            const points: TurnoverPoint[] = [];
            for (let m = 0; m < 12; m++) {
                const d0 = new Date(annee, m, 1);
                const d1 = new Date(annee, m + 1, 1);
                const [embauches, departs, effectifDebut, effectifFin] = await Promise.all([
                    this.contratModel.countDocuments({ date_debut: { $gte: d0, $lt: d1 } }),
                    this.contratModel.countDocuments({
                        est_actif: false,
                        date_fin: { $gte: d0, $lt: d1 },
                    }),
                    this.countEffectifAt(d0),
                    this.countEffectifAt(new Date(annee, m + 1, 0)),
                ]);
                const effectifMoyen = (effectifDebut + effectifFin) / 2;
                const tauxTurnover = effectifMoyen > 0
                    ? Math.round((departs / effectifMoyen) * 10000) / 100
                    : 0;
                points.push({
                    annee,
                    mois: m + 1,
                    embauches,
                    departs,
                    effectifDebut,
                    effectifFin,
                    effectifMoyen,
                    tauxTurnover,
                });
            }
            return points;
        } catch (error) {
            this.logger.error('turnoverByMois failed', error);
            throw new HttpException(error.message, 500);
        }
    }

    async retentionByCohorte(): Promise<CohorteRetention[]> {
        try {
            const cohortes = await this.contratModel.aggregate([
                { $match: { type: { $in: ['CDI', 'CDD'] } } },
                { $sort: { employe: 1, date_debut: 1 } },
                {
                    $group: {
                        _id: '$employe',
                        date_debut: { $first: '$date_debut' },
                    },
                },
                {
                    $group: {
                        _id: { $year: '$date_debut' },
                        employes: { $addToSet: '$_id' },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            const result: CohorteRetention[] = [];
            for (const c of cohortes) {
                const employes = c.employes as string[];
                const encoreActifs = await this.contratModel.countDocuments({
                    employe: { $in: employes },
                    est_actif: true,
                });
                const effectifInitial = employes.length;
                const tauxRetention = effectifInitial > 0
                    ? Math.round((encoreActifs / effectifInitial) * 10000) / 100
                    : 0;
                result.push({
                    anneeRecrutement: c._id,
                    effectifInitial,
                    encoreActifs,
                    tauxRetention,
                });
            }
            return result;
        } catch (error) {
            this.logger.error('retentionByCohorte failed', error);
            throw new HttpException(error.message, 500);
        }
    }

    // =========================
    // EVOLUTION MENSUELLE MASSE SALARIALE
    // =========================

    async masseSalarialeMensuelle(anneeDebut?: number, anneeFin?: number): Promise<MasseSalarialeMensuelle[]> {
        try {
            const match: any = {};
            if (anneeDebut || anneeFin) {
                match['lot.annee'] = {};
                if (anneeDebut) match['lot.annee'].$gte = anneeDebut;
                if (anneeFin) match['lot.annee'].$lte = anneeFin;
            }
            const pipeline: any[] = [
                {
                    $lookup: {
                        from: 'lots',
                        localField: 'lot',
                        foreignField: '_id',
                        as: 'lot',
                    },
                },
                { $unwind: '$lot' },
            ];
            if (Object.keys(match).length > 0) {
                pipeline.push({ $match: match });
            }
            pipeline.push(
                {
                    $group: {
                        _id: { annee: '$lot.annee', mois: '$lot.mois' },
                        brut: { $sum: { $add: ['$totalIm', '$totalNI'] } },
                        net: { $sum: '$nap' },
                        chargesSalariales: { $sum: '$totalRet' },
                        chargesPatronales: { $sum: '$totalPP' },
                        effectif: { $addToSet: '$employe' },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        annee: '$_id.annee',
                        mois: '$_id.mois',
                        key: {
                            $concat: [
                                { $toString: '$_id.annee' },
                                '-',
                                {
                                    $cond: [
                                        { $lt: ['$_id.mois', 10] },
                                        { $concat: ['0', { $toString: '$_id.mois' }] },
                                        { $toString: '$_id.mois' },
                                    ],
                                },
                            ],
                        },
                        brut: 1,
                        net: 1,
                        chargesSalariales: 1,
                        chargesPatronales: 1,
                        effectif: { $size: '$effectif' },
                    },
                },
                { $sort: { annee: 1, mois: 1 } },
            );
            return await this.bulletinModel.aggregate(pipeline);
        } catch (error) {
            this.logger.error('masseSalarialeMensuelle failed', error);
            throw new HttpException(error.message, 500);
        }
    }
}
