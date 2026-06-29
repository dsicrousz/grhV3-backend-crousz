import { Body, Controller, Delete, Get, HttpException, Param, Patch, Post } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { round } from 'lodash';
import { evaluate } from 'mathjs';

import { LotCDDService } from './lot-cdd.service';
import { CreateLotCDDDto } from './dto/create-lot-cdd.dto';
import { UpdateLotCDDDto } from './dto/update-lot-cdd.dto';
import { LotCDD } from './entities/lot-cdd.entity';

import { BulletinCDDService } from 'src/bulletin-cdd/bulletin-cdd.service';
import { CreateBulletinCDDDto } from 'src/bulletin-cdd/dto/create-bulletin-cdd.dto';

import { EmployeService } from 'src/employe/employe.service';
import { AttributionGlobaleService } from 'src/attribution-globale/attribution-globale.service';
import { ImpotService } from 'src/impot/impot.service';
import { ContratService } from 'src/contrat/contrat.service';
import { StorageService } from 'src/storage/storage.service';

import { Employe } from 'src/employe/entities/employe.entity';
import { Impot } from 'src/impot/entities/impot.entity';
import { AttributionGlobale } from 'src/attribution-globale/entities/attribution-globale.entity';
import { Figuration } from 'src/figuration/entities/figuration.entity';
import { TYPE_RUBRIQUE } from 'src/rubrique/entities/rubrique.entity';
import { TypeContrat } from 'src/contrat/entities/contrat.entity';

import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';
import { Calcul } from 'src/helpers/calcul';

@Controller('lot-cdd')
@Roles(['admin', 'csa', 'rh', 'dsi'])
export class LotCDDController {
    constructor(
        private readonly lotService: LotCDDService,
        private readonly bulletinService: BulletinCDDService,
        private readonly employeService: EmployeService,
        private readonly impotService: ImpotService,
        private readonly attributionGlobaleService: AttributionGlobaleService,
        private readonly contratService: ContratService,
        private readonly storageService: StorageService,
        @InjectQueue('lot-cdd') private lotQueue: Queue,
    ) {}

    @Post()
    @UserHasPermission({ permission: { lot: ['create'] } })
    create(@Body() createLotDto: CreateLotCDDDto) {
        return this.lotService.createLot(createLotDto);
    }

    @Get()
    @UserHasPermission({ permission: { lot: ['list'] } })
    async findAll() {
        const lots = await this.lotService.findAll();
        return lots.map(lot => {
            if (lot?.url) {
                lot.url = this.storageService.getPublicUrl(lot.url);
            }
            return lot;
        });
    }

    @Get('transmis')
    @UserHasPermission({ permission: { lot: ['list'] } })
    async findAllTransmitted() {
        return this.lotService.findAllTransmitted();
    }

    @Get(':id/detail')
    @UserHasPermission({ permission: { lot: ['read'] } })
    async findOneWithBulletins(@Param('id') id: string) {
        const lot = await this.lotService.findOneWithBulletins(id);
        if (!lot) {
            throw new HttpException('Lot non trouvé', 404);
        }
        return lot;
    }

    @Get(':id')
    @UserHasPermission({ permission: { lot: ['read'] } })
    findOne(@Param('id') id: string) {
        return this.lotService.findOne(id);
    }

    @Patch(':id')
    @UserHasPermission({ permission: { lot: ['update'] } })
    update(@Param('id') id: string, @Body() updateLotDto: UpdateLotCDDDto) {
        return this.lotService.update(id, updateLotDto);
    }

    @Delete(':id')
    @UserHasPermission({ permission: { lot: ['delete'] } })
    async remove(@Param('id') id: string) {
        // Récupérer les bulletins pour avoir les URLs
        const bulletins = await this.bulletinService.findByLot(id);
        const bulletinUrls = bulletins.map(b => b.url).filter(Boolean);

        // Récupérer le lot pour son URL
        const lot = await this.lotService.findOne(id);
        const lotUrl = lot?.url;

        // Lancer le job de suppression asynchrone
        await this.lotQueue.add('deletelotcdd', {
            lotId: id,
            bulletinUrls,
            lotUrl,
        });

        // Supprimer le lot immédiatement
        return this.lotService.remove(id);
    }

    @Patch('submit/:id')
    async submit(@Param('id') id: string) {
        return this.lotService.submit(id);
    }

    @Patch('cancel-submit/:id')
    async cancelSubmit(@Param('id') id: string) {
        return this.lotService.cancelSubmit(id);
    }

    @Patch('set-waiting/:id')
    async encours(@Param('id') id: string) {
        return this.lotService.encours(id);
    }

    @Patch('cancel-waiting/:id')
    async cancelEncours(@Param('id') id: string) {
        return this.lotService.cancelEncours(id);
    }

    @Patch('validate/:id')
    @UserHasPermission({ permission: { lot: ['calculate'] } })
    async validate(@Param('id') id: string) {
        const lot = await this.lotService.validate(id);
        await this.generateBulletin(id);
        return lot;
    }

    @Patch('reject/:id')
    async cancelValidate(@Param('id') id: string) {
        const lot = await this.lotService.cancelValidate(id);
        await this.generateBulletin(id);
        return lot;
    }

    @Patch('transmit/:id')
    transmit(@Param('id') id: string) {
        return this.lotService.transmit(id);
    }

    @Patch('untransmit/:id')
    untransmit(@Param('id') id: string) {
        return this.lotService.untransmit(id);
    }

    @Get('getbulletins/:id')
    async findBulletin(@Param('id') id: string) {
        // Récupérer les bulletins de l'employé depuis la DB
        const bulletins = await this.bulletinService.findByEmploye(id);
        // Filtrer les bulletins publiés et retourner les URLs
        const files = bulletins
            .filter(b => b.url)
            .map(b => ({
                url: this.storageService.getPublicUrl(b.url),
                lot: b.lot,
                mois: (b as any).mois,
                annee: (b as any).annee,
            }));
        return files.sort((a: any, b: any) => `${b.annee}-${b.mois}`.localeCompare(`${a.annee}-${a.mois}`));
    }

    // -------------------- GÉNÉRATION DES BULLETINS CDD --------------------

    @Post('generate/:id')
    @UserHasPermission({ permission: { lot: ['calculate'] } })
    async generateBulletin(@Param('id') id: string) {
        const lot = await this.lotService.findOne(id);
        const employes = (await this.employeService.findAllAgregated()).filter(
            (emp) => emp.contrat_actif && emp.contrat_actif.type === TypeContrat.CDD,
        );
        const attG = await this.attributionGlobaleService.byTypeContrat(TypeContrat.CDD);
        const impots = await this.impotService.findAll();
        for (const emp of employes) {
            const bulletin: CreateBulletinCDDDto = {
                employe: emp._id.toString(),
                lignes: { gains: [], retenues: [] },
                lot: lot._id,
                totalIm: 0,
                totalNI: 0,
                totalRet: 0,
                totalPP: 0,
                nap: 0,
            };
            const salaireFixe = emp.contrat_actif?.salaire_fixe ?? 0;
            // Pour les CDD: uniquement le salaire fixe et les retenues attribuees
            const scopes = {
                CATEGORIE_VALEUR: salaireFixe,
                SALAIRE_FIXE: salaireFixe,
                IMPOT: 0,
                TRIMF: 0,
                BRUT: 0,
                IPRES: 0,
            };
            await this.processBulletin(emp, bulletin, scopes, attG, impots);
        }
        return this.finalizeLotBulletins(lot);
    }

    private async processBulletin(
        emp: Partial<Employe>,
        bulletin: CreateBulletinCDDDto,
        scopes: any,
        attG: AttributionGlobale[],
        impots: Impot[],
    ) {
        const calcul = new Calcul();
        await this.determinationGains(emp, scopes, bulletin, attG);
        await this.determinationRetenues(impots, emp, scopes, bulletin, attG);
        const { totalIm, totalNI, totalRet, totalPP, nap } = calcul.getTotal(bulletin as any);
        bulletin.totalIm = totalIm;
        bulletin.totalNI = totalNI;
        bulletin.totalRet = totalRet;
        bulletin.totalPP = totalPP;
        bulletin.nap = nap;
        await this.bulletinService.updateBulletin(emp._id, bulletin);
    }

    private async finalizeLotBulletins(lot: LotCDD) {
        const bulletinsCreated = await this.bulletinService.findByLot(lot._id);
        for (const b of bulletinsCreated) {
            const contratDoc = await this.contratService.findActiveByEmploye(
                (b.employe as any)._id?.toString() || b.employe.toString(),
            );
            const contrat = (contratDoc as any)?.toObject ? (contratDoc as any).toObject() : contratDoc;
            (b as any).contrat_actif = contrat;
            try {
                await this.lotQueue.add('generatebulletincdd', { bulletin: b, lot, contrat });
            } catch (error) {
                throw new HttpException(error.message, 500);
            }
        }
        // Generation du PDF global avec tous les bulletins
        try {
            await this.lotQueue.add('generateallcdd', { bulletins: bulletinsCreated, lot });
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
        return lot;
    }

    // -------------------- CALCUL GAINS / RETENUES (adapté du flow CDI) --------------------

    async determinationGains(
        emp: Partial<Employe>,
        scopes: any,
        bulletin: CreateBulletinCDDDto,
        attG: AttributionGlobale[],
    ) {
        // CDD: uniquement les attributions globales (pas d'exclusions, nominations, attributions individuelles)
        await this.attributionGlobales(scopes, bulletin, attG);
    }

    async determinationRetenues(
        impots: Impot[],
        emp: Partial<Employe>,
        scopes: any,
        bulletin: CreateBulletinCDDDto,
        attG: AttributionGlobale[],
    ) {
        // CDD: uniquement les attributions globales (pas d'exclusions)
        const retenues = attG.filter((v) => v.rubrique.type === TYPE_RUBRIQUE.RETENUE);
        const m = this.findImpot(impots, scopes.BRUT, emp['nombre_de_parts'] ?? 1);
        const t = this.findTrimf(impots, scopes.BRUT);

        scopes.IMPOT = m;
        scopes.TRIMF = t;

        retenues
            .sort((a, b) => a.rubrique.ordre - b.rubrique.ordre)
            .map((r) => {
                r.rubrique.regle_base = r.rubrique.regle_base.replaceAll('@', '');
                r.rubrique.regle_montant = r.rubrique.regle_montant.replaceAll('@', '');
                return r;
            })
            .forEach((r) => {
                try {
                    const b: Figuration = {
                        montant: r.valeur_par_defaut
                            ? r.valeur_par_defaut
                            : round(evaluate(r.rubrique.regle_montant, { ...scopes, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2 })),
                        base: r.valeur_par_defaut
                            ? r.valeur_par_defaut
                            : round(evaluate(r.rubrique.regle_base, { ...scopes, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2 })),
                        taux1: r.rubrique.taux1,
                        taux2: r.rubrique.taux2,
                        rubrique: {
                            _id: r.rubrique._id,
                            libelle: r.rubrique.libelle,
                            code: r.rubrique.code,
                            type: r.rubrique.type,
                            taux1: r.rubrique.taux1,
                            taux2: r.rubrique.taux2,
                        },
                    };
                    scopes[r.rubrique.formule] = b.montant;
                    if (r.rubrique.type === TYPE_RUBRIQUE.IMPOSABLE) scopes.BRUT += b.montant;
                    if (r.rubrique.add_to_ipres) scopes.IPRES += b.montant;
                    if (b.montant > 0) bulletin.lignes['retenues'].push(b);
                } catch (error) {
                    throw new HttpException(error.message, 500);
                }
            });
    }

    async attributionGlobales(
        scopes: any,
        bulletin: CreateBulletinCDDDto,
        attG: AttributionGlobale[],
    ) {
        // CDD: pas d'exclusions, on prend toutes les attributions globales de type gain
        const gains = attG.filter((v) => v.rubrique.type !== TYPE_RUBRIQUE.RETENUE);

        gains.sort((a, b) => a.rubrique.ordre - b.rubrique.ordre)
            .map((r) => {
                r.rubrique.regle_base = r.rubrique.regle_base.replaceAll('@', '');
                r.rubrique.regle_montant = r.rubrique.regle_montant.replaceAll('@', '');
                return r;
            })
            .forEach((r) => {
                const b: Figuration = {
                    montant: r.valeur_par_defaut
                        ? r.valeur_par_defaut
                        : round(evaluate(r.rubrique.regle_montant, { ...scopes, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2 })),
                    base: r.valeur_par_defaut
                        ? r.valeur_par_defaut
                        : round(evaluate(r.rubrique.regle_base, { ...scopes, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2 })),
                    taux1: r.rubrique.taux1,
                    taux2: r.rubrique.taux2,
                    rubrique: {
                        _id: r.rubrique._id,
                        libelle: r.rubrique.libelle,
                        code: r.rubrique.code,
                        type: r.rubrique.type,
                        taux1: r.rubrique.taux1,
                        taux2: r.rubrique.taux2,
                    },
                };
                scopes[r.rubrique.formule] = b.montant;
                if (r.rubrique.type === TYPE_RUBRIQUE.IMPOSABLE) scopes.BRUT += b.montant;
                if (r.rubrique.add_to_ipres) scopes.IPRES += b.montant;
                if (b.montant > 0) bulletin.lignes['gains'].push(b);
            });
    }

    // -------------------- HELPERS --------------------

    findOneImpotByVal(impots: Impot[], val: number): Impot {
        try {
            let v = val % 1000;
            if (v !== 0) {
                v = Math.floor(val / 1000) * 1000;
                return impots.find(({ vals }: Impot) => vals === v);
            }
            return impots.find(({ vals }: Impot) => vals === val);
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    findImpot(impots: Impot[], brut: number, parts: number) {
        const impot = this.findOneImpotByVal(impots, brut);
        let value = 0;
        if (impot) {
            if (parts === 1) value = impot.p1;
            else if (parts === 1.5) value = impot.p2;
            else if (parts === 2) value = impot.p3;
            else if (parts === 2.5) value = impot.p4;
            else if (parts === 3) value = impot.p5;
            else if (parts === 3.5) value = impot.p6;
            else if (parts === 4) value = impot.p7;
            else if (parts === 4.5) value = impot.p8;
            else if (parts === 5) value = impot.p9;
        }
        return value;
    }

    findTrimf(impots: Impot[], brut: number) {
        const impot = this.findOneImpotByVal(impots, brut);
        return impot ? impot.trimf : 0;
    }
}
