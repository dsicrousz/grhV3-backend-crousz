import { Controller, Get, Query } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { Roles } from 'src/common/guards';

@Controller('reporting')
@Roles('admin', 'rh', 'csa')
export class ReportingController {
    constructor(private readonly reportingService: ReportingService) {}

    // EFFECTIF TOTAL
    @Get('effectif/by-type-contrat')
    effectifByTypeContrat() {
        return this.reportingService.effectifByTypeContrat();
    }

    @Get('effectif/by-periode')
    effectifByPeriode(
        @Query('debut') debut: string,
        @Query('fin') fin: string,
    ) {
        return this.reportingService.effectifByPeriode(debut, fin);
    }

    @Get('effectif/by-age')
    effectifByAge() {
        return this.reportingService.effectifByAge();
    }

    @Get('effectif/by-annee-recrutement')
    effectifByAnneeRecrutement() {
        return this.reportingService.effectifByAnneeRecrutement();
    }

    // REPARTITION DES CONTRATS
    @Get('contrats/by-type')
    contratsByType() {
        return this.reportingService.contratsByType();
    }

    @Get('contrats/by-motif-rupture')
    contratsByMotifRupture() {
        return this.reportingService.contratsByMotifRupture();
    }

    @Get('contrats/by-annee')
    contratsByAnnee() {
        return this.reportingService.contratsByAnnee();
    }

    // MASSE SALARIALE
    @Get('masse-salariale/by-annee')
    masseSalarialeByAnnee() {
        return this.reportingService.masseSalarialeByAnnee();
    }

    @Get('masse-salariale/by-employe')
    masseSalarialeByEmploye(@Query('annee') annee?: string) {
        const anneeNum = annee ? parseInt(annee, 10) : undefined;
        return this.reportingService.masseSalarialeByEmploye(anneeNum);
    }

    @Get('masse-salariale/by-poste')
    masseSalarialeByPoste(@Query('annee') annee?: string) {
        const anneeNum = annee ? parseInt(annee, 10) : undefined;
        return this.reportingService.masseSalarialeByPoste(anneeNum);
    }

    @Get('masse-salariale/mensuelle')
    masseSalarialeMensuelle(
        @Query('anneeDebut') anneeDebut?: string,
        @Query('anneeFin') anneeFin?: string,
    ) {
        const debut = anneeDebut ? parseInt(anneeDebut, 10) : undefined;
        const fin = anneeFin ? parseInt(anneeFin, 10) : undefined;
        return this.reportingService.masseSalarialeMensuelle(debut, fin);
    }

    // TURNOVER & RETENTION
    @Get('turnover/by-annee')
    turnoverByAnnee(
        @Query('anneeDebut') anneeDebut?: string,
        @Query('anneeFin') anneeFin?: string,
    ) {
        const debut = anneeDebut ? parseInt(anneeDebut, 10) : undefined;
        const fin = anneeFin ? parseInt(anneeFin, 10) : undefined;
        return this.reportingService.turnoverByAnnee(debut, fin);
    }

    @Get('turnover/by-mois')
    turnoverByMois(@Query('annee') annee: string) {
        const anneeNum = annee ? parseInt(annee, 10) : new Date().getFullYear();
        return this.reportingService.turnoverByMois(anneeNum);
    }

    @Get('retention/by-cohorte')
    retentionByCohorte() {
        return this.reportingService.retentionByCohorte();
    }
}
