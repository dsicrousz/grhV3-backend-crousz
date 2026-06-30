import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, UseInterceptors, UploadedFiles, Headers } from '@nestjs/common';
import { PeriodLotStatisticsResponse } from 'src/bulletin/dto/period-lot-statistics.dto';
import { StorageService } from 'src/storage/storage.service';
import { LotService } from './lot.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { EmployeService } from 'src/employe/employe.service';
import { Figuration} from 'src/figuration/entities/figuration.entity';
import { AttributionGlobaleService } from 'src/attribution-globale/attribution-globale.service';
import { AttributionFonctionnelleService } from 'src/attribution-fonctionnelle/attribution-fonctionnelle.service';
import { ExclusionSpecifiqueService } from 'src/exclusion-specifique/exclusion-specifique.service';
import { differenceBy, flatten, round } from 'lodash';
import { AttributionGlobale } from 'src/attribution-globale/entities/attribution-globale.entity';
import { intervalToDuration, parse } from 'date-fns';
import { AttributionIndividuelleService } from 'src/attribution-individuelle/attribution-individuelle.service';
import { ExclusionSpecifique } from 'src/exclusion-specifique/entities/exclusion-specifique.entity';
import { AttributionIndividuelle } from 'src/attribution-individuelle/entities/attribution-individuelle.entity';
import { NominationService } from 'src/nomination/nomination.service';
import { Nomination } from 'src/nomination/entities/nomination.entity';
import { ImpotService } from 'src/impot/impot.service';
import { PdfMaker } from 'src/helpers/pdf.maker';
import { Calcul } from 'src/helpers/calcul';
import { Lot } from './entities/lot.entity';
import { evaluate } from 'mathjs';
import { TYPE_RUBRIQUE } from 'src/rubrique/entities/rubrique.entity';
import { BulletinService } from 'src/bulletin/bulletin.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateBulletinDto } from 'src/bulletin/dto/create-bulletin.dto';
import { Employe } from 'src/employe/entities/employe.entity';
import { Impot } from 'src/impot/entities/impot.entity';
import { ContratService } from 'src/contrat/contrat.service';
import { TypeContrat } from 'src/contrat/entities/contrat.entity';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';
import { readFile } from 'node:fs/promises';
import { Types } from 'mongoose';
// import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ParametreBulletinService } from 'src/parametre-bulletin/parametre-bulletin.service';

@Controller('lot')
@Roles(['admin', 'csa', 'rh', 'dsi'])
export class LotController {
  constructor(private readonly lotService: LotService,
    private readonly employeService: EmployeService,
    private readonly impotService: ImpotService,
    private readonly attributionGlobaleService: AttributionGlobaleService,
    private readonly attributionFonctionnelleService: AttributionFonctionnelleService,
    private readonly attributionIndividuelleService: AttributionIndividuelleService,
    private readonly exclusionSpecifiqueService: ExclusionSpecifiqueService,
    private readonly nominationService: NominationService,
    private readonly bulletinService: BulletinService,
    private readonly contratService: ContratService,
    private readonly pdf: PdfMaker,
    private readonly storageService: StorageService,
    private readonly parametreBulletinService: ParametreBulletinService,
    @InjectQueue('lot') private lotQueue: Queue
    ) {}

  @Post()
  @UserHasPermission({ permission: { lot: ['create'] } })
  create(@Body() createLotDto: CreateLotDto) {
    return this.lotService.createLot(createLotDto);
  }
 
  // @AllowAnonymous()
  @Post('import-legacy/lots')
  @UseInterceptors(AnyFilesInterceptor())
  async importLegacyLots(
    @Body() payload: any,
    @Query('filePath') filePath?: string,
    @Query('lotsFilePath') lotsFilePath?: string,
    @Headers('x-file-path') headerFilePath?: string,
    @UploadedFiles() files?: Array<Express.Multer.File>,
  ) {
    try {
      const mergedPayload = this.mergeLegacyImportPayload(
        payload,
        { filePath, lotsFilePath },
        headerFilePath,
      );
      const source = await this.resolveLegacyLotSource(mergedPayload, files);
      const normalizedLots = source.lots.map((lot) => this.normalizeLegacyDocument(lot));

      if (!normalizedLots.length) {
        return this.buildLegacyEmptyResponse('Aucun lot detecte dans la source legacy', mergedPayload, files);
      }

      const lots = this.deduplicateLegacyLots(normalizedLots).map((lot) => this.toLegacyLotDocument(lot));
      const lotResult = await this.lotService.upsertLegacyMany(lots);

      return {
        lots: {
          total: lots.length,
          ...lotResult,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  // @AllowAnonymous()
  @Post('import-legacy/bulletins')
  @UseInterceptors(AnyFilesInterceptor())
  async importLegacyBulletins(
    @Body() payload: any,
    @Query('filePath') filePath?: string,
    @Query('bulletinsFilePath') bulletinsFilePath?: string,
    @Query('lotsFilePath') lotsFilePath?: string,
    @Headers('x-file-path') headerFilePath?: string,
    @UploadedFiles() files?: Array<Express.Multer.File>,
  ) {
    try {
      const mergedPayload = this.mergeLegacyImportPayload(
        payload,
        { filePath, bulletinsFilePath, lotsFilePath },
        headerFilePath,
      );
      const source = await this.resolveLegacyBulletinSource(mergedPayload, files);
      const normalizedBulletins = source.bulletins.map((bulletin) => this.normalizeLegacyDocument(bulletin));
      const normalizedLots = source.lots.map((lot) => this.normalizeLegacyDocument(lot));

      if (!normalizedBulletins.length) {
        return this.buildLegacyEmptyResponse('Aucun bulletin detecte dans la source legacy', mergedPayload, files);
      }

      const lotIndex = new Map(
        this.deduplicateLegacyLots(normalizedLots).map((lot) => [
          this.toObjectId(lot._id, 'lot._id').toString(),
          lot,
        ]),
      );

      const bulletins = normalizedBulletins.map((bulletin) =>
        this.toLegacyBulletinDocument(
          bulletin,
          lotIndex.get((bulletin.lot?._id ?? bulletin.lot)?.toString()),
        ),
      );
      const bulletinResult = await this.bulletinService.upsertLegacyMany(bulletins);

      return {
        bulletins: {
          total: bulletins.length,
          ...bulletinResult,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  findOneImpotByVal(impots: Impot[],val: number): Impot {
      try {
        let v =  val % 1000;
            if(v !== 0) {
              v = Math.floor(val / 1000) * 1000; 
              return impots.find(({vals}:Impot) => vals === v)
            }else{
              return impots.find(({vals}:Impot) => vals === val)
            }
      } catch (error) {
        throw new HttpException(error.message,500);
      }
  }

  // @AllowAnonymous()
  @Post('regenerate-pdf/:id')
  async regeneratePdf(@Param('id') id: string) {
    try {
      const lot = await this.lotService.findOne(id);
      return this.finalizeLotBulletins(lot);
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  @Post('generate/:id')
  async generateBulletin(@Param('id') id: string) {
    try {
    const lot = await this.lotService.findOne(id);
    const employes = (await this.employeService.findAllAgregated()).filter((emp) => emp.is_actif).filter((emp) => emp.contrat_actif && emp.contrat_actif.type === TypeContrat.CDI);
    const attG = await this.attributionGlobaleService.byTypeContrat(TypeContrat.CDI);
    const impots = await this.impotService.findAll();
    for (const emp of employes) {
      const bulletin: CreateBulletinDto = { employe: emp._id.toString(), lignes: { gains: [], retenues: [] }, lot: lot._id, totalIm: 0, totalNI: 0, totalRet: 0, totalPP: 0, nap: 0 };
      const premierContrat = await this.contratService.findFirstContratByEmploye(emp._id.toString());
      const dateRecrutement = premierContrat?.date_debut ? new Date(premierContrat.date_debut).toISOString().split('T')[0] : null;
      const scopes = {
        CATEGORIE_VALEUR: emp.contrat_actif?.categorie?.valeur ?? 0,
        EMP_CLASSE: emp.contrat_actif?.categorie?.code?.toString().substring(0, 1) ?? '1',
        ENCIENNETE: dateRecrutement ? this.getAnciennete(dateRecrutement) : 0,
        EST_CADRE: Boolean(emp.contrat_actif?.categorie?.estCadre),
        IMPOT: 0,
        TRIMF: 0,
        BRUT: 0,
        IPRES: 0,
      };
      await this.processBulletin(emp, bulletin, scopes, attG, impots);
    }
    return this.finalizeLotBulletins(lot);
    } catch (error) {
      console.error('Error generating bulletins:', error);
      throw new HttpException(error.message, 500);
    }
  }

  private async processBulletin(emp: Partial<Employe>, bulletin: CreateBulletinDto, scopes: any, attG: AttributionGlobale[], impots: Impot[]) {
    const calcul = new Calcul();
    await this.determinationGains(emp, scopes, bulletin, attG);
    await this.determinationRetenues(impots, emp, scopes, bulletin, attG);
    const { totalIm, totalNI, totalRet, totalPP, nap } = calcul.getTotal(bulletin);
    bulletin.totalIm = totalIm;
    bulletin.totalNI = totalNI;
    bulletin.totalRet = totalRet;
    bulletin.totalPP = totalPP;
    bulletin.nap = nap;
    await this.bulletinService.updateBulletin(emp._id, bulletin);
  }

  private async finalizeLotBulletins(lot: Lot) {
    const bulletinsCreated = await this.bulletinService.findByLot(lot._id);
    const previousLots = await this.lotService.findByAnneeAndOldMois(lot.annee, lot.mois);

    // Ajouter contrat_actif aux bulletins pour makeAll et récupérer pour la queue
    for (const b of bulletinsCreated) {
      const currentEmpId = (b.employe as any)?._id?.toString() ?? (b.employe as any)?.toString();
      const contrat = await this.contratService.findActiveByEmploye(currentEmpId);
      (b as any).contrat_actif = contrat;
      const olds = [];
      previousLots.forEach(r => {
        olds.push(
          r?.bulletins?.filter(({ employe }: any) => {
            const prevEmpId = employe?._id?.toString() ?? employe?.toString();
            return prevEmpId === currentEmpId;
          }) ?? []
        );
      });
      try {
        await this.lotQueue.add('generatebulletin', { bulletin: b, olds: flatten(olds), lot, contrat });
      } catch (error) {
        throw new HttpException(error.message, 500);
      }
    }

    // generer le pdf du lot global (après chargement des contrats)
    let urlLot;
    try {
      const parametre = await this.parametreBulletinService.findByAnnee(lot.annee);
      const couleur = parametre?.couleur ?? '#fac66b';
      urlLot = await this.pdf.makeAll(bulletinsCreated, lot, previousLots, couleur);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new HttpException(error.message, 500);
    }
    return await this.lotService.update(lot._id, { url: urlLot });
  }

  async determinationGains(emp:Partial<Employe>,scopes: any,bulletin: CreateBulletinDto,attG:AttributionGlobale[]){
    const idemp = bulletin.employe;
    const [exclSpec,attrInd,nomActive] = await Promise.all(
      [this.exclusionSpecifiqueService.findByEmploye(idemp),
      this.attributionIndividuelleService.findByEmploye(idemp),
      this.nominationService.findActiveByEmploye(idemp)
    ]);
  
    await this.attributionGlobales(scopes,bulletin,attG,exclSpec);
    await this.attributionFonctionnelle(scopes,nomActive,bulletin,exclSpec);
    await this.attributionIndividuelle(emp,scopes,bulletin,attrInd);
  }

  async determinationRetenues(impots:Impot[],emp:Partial<Employe>,scopes:any,bulletin: CreateBulletinDto,attG:AttributionGlobale[]){
    const exclSpec = await this.exclusionSpecifiqueService.findByEmploye(bulletin.employe);
    const retenues = differenceBy(attG,exclSpec,(v) => v.rubrique._id.toString()).filter(v => v.rubrique.type === TYPE_RUBRIQUE.RETENUE);
    const contratActif = await this.contratService.findActiveByEmploye(emp._id.toString());
    const m =  this.findImpot(impots,scopes.BRUT,contratActif?.nombre_de_parts ?? emp['nombre_de_parts'] ?? 1);
    const t = this.findTrimf(impots,scopes.BRUT)
    
    scopes.IMPOT = m;
    scopes.TRIMF = t;
    retenues.sort((a,b) => a.rubrique.ordre - b.rubrique.ordre).map(r => {
      r.rubrique.regle_base = r.rubrique.regle_base.replaceAll('@','');
      r.rubrique.regle_montant = r.rubrique.regle_montant.replaceAll('@','');
      return r;
    }).forEach(r => {
      try {
         const b:Figuration = {
          montant: r.valeur_par_defaut ? r.valeur_par_defaut : round(evaluate(r.rubrique.regle_montant,{...scopes, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2})),
          base: r.valeur_par_defaut ? r.valeur_par_defaut : round(evaluate(r.rubrique.regle_base,{...scopes, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2})),
          taux1: r.rubrique.taux1,
          taux2: r.rubrique.taux2,
          rubrique: { _id: r.rubrique._id, libelle: r.rubrique.libelle, code: r.rubrique.code, type: r.rubrique.type, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2},
        };
        scopes[r.rubrique.formule] = b.montant;
        if(r.rubrique.type === TYPE_RUBRIQUE.IMPOSABLE){
          scopes.BRUT += b.montant;
        }
        if(r.rubrique.add_to_ipres){
          scopes.IPRES += b.montant;
        }
        if(b.montant >= 0){
          bulletin.lignes['retenues'].push(b);
        }
      } catch (error) {
        throw new HttpException(error.message,500);
      }
       
        
      })
    // RETENUES INDIVIDUELLES

    const attrInd = await this.attributionIndividuelleService.findByEmploye(bulletin.employe);
    const ri = attrInd.filter(a => a.rubrique.type === TYPE_RUBRIQUE.RETENUE);
    ri.sort((a,b) => a.rubrique.ordre - b.rubrique.ordre).map(r => {
      r.rubrique.regle_base = r.rubrique.regle_base.replaceAll('@','');
      r.rubrique.regle_montant = r.rubrique.regle_montant.replaceAll('@','');
      return r;
    }).forEach(r => {
        const b:Figuration = {
          montant: r.valeur_par_defaut ? r.valeur_par_defaut : round(evaluate(r.rubrique.regle_montant,{...scopes, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2})),
          base: r.valeur_par_defaut ? r.valeur_par_defaut : round(evaluate(r.rubrique.regle_base,{...scopes, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2})),
          taux1: r.rubrique.taux1,
          taux2: r.rubrique.taux2,
          rubrique: { _id: r.rubrique._id, libelle: r.rubrique.libelle, code: r.rubrique.code, type: r.rubrique.type, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2},
        };
        
        scopes[r.rubrique.formule] = b.montant;
        if(r.rubrique.type === TYPE_RUBRIQUE.IMPOSABLE){
          scopes.BRUT += b.montant;
        }
        if(r.rubrique.add_to_ipres){
          scopes.IPRES += b.montant;
        }
        if(b.montant >= 0){
          bulletin.lignes['retenues'].push(b);
        }
      })
  }

  async attributionGlobales(scopes: any,bulletin: CreateBulletinDto,attG:AttributionGlobale[],exclSpec: ExclusionSpecifique[]){
    const diff = differenceBy(attG,exclSpec,(v) => v.rubrique._id.toString()).filter(v => v.rubrique.type !== TYPE_RUBRIQUE.RETENUE);

      diff.sort((a,b) => a.rubrique.ordre - b.rubrique.ordre).map(r => {
      r.rubrique.regle_base = r.rubrique.regle_base.replaceAll('@','');
      r.rubrique.regle_montant = r.rubrique.regle_montant.replaceAll('@','');
      return r;
    }).forEach(r => {
        const b:Figuration = {
          montant: r.valeur_par_defaut ? r.valeur_par_defaut : round(evaluate(r.rubrique.regle_montant,{...scopes, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2})),
          base: r.valeur_par_defaut ? r.valeur_par_defaut : round(evaluate(r.rubrique.regle_base,{...scopes, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2})),
          taux1: r.rubrique.taux1,
          taux2: r.rubrique.taux2,
          rubrique: { _id: r.rubrique._id, libelle: r.rubrique.libelle, code: r.rubrique.code, type: r.rubrique.type, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2},
        };
        
        scopes[r.rubrique.formule] = b.montant;
        if(r.rubrique.type === TYPE_RUBRIQUE.IMPOSABLE){
          scopes.BRUT += b.montant;
        }
        if(r.rubrique.add_to_ipres){
          scopes.IPRES += b.montant;
        }
        if(b.montant >= 0){
          bulletin.lignes['gains'].push(b);
        }
      })
  }
  async attributionFonctionnelle(scopes:any,nomActive: Nomination[],bulletin:CreateBulletinDto,exclSpec: ExclusionSpecifique[]){
    await Promise.all(nomActive.map(async (n) =>{
        const attrFonc = (await this.attributionFonctionnelleService.findByFonction(n.fonction._id.toString()));
        const gains = differenceBy(attrFonc,exclSpec,(v) => v._id.toString()).filter(v => v.rubrique.type !== TYPE_RUBRIQUE.RETENUE);

        gains.sort((a,b) => a.rubrique.ordre - b.rubrique.ordre).map(r => {
      r.rubrique.regle_base = r.rubrique.regle_base.replaceAll('@','');
      r.rubrique.regle_montant = r.rubrique.regle_montant.replaceAll('@','');
      return r;
    }).forEach(r => {
        const b:Figuration = {
          montant: r.valeur_par_defaut ? r.valeur_par_defaut : round(evaluate(r.rubrique.regle_montant,{...scopes, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2})),
          base: r.valeur_par_defaut ? r.valeur_par_defaut : round(evaluate(r.rubrique.regle_base,{...scopes, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2})),
          taux1: r.rubrique.taux1,
          taux2: r.rubrique.taux2,
          rubrique: { _id: r.rubrique._id, libelle: r.rubrique.libelle, code: r.rubrique.code, type: r.rubrique.type, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2},
        };
        
        scopes[r.rubrique.formule] = b.montant;
        if(r.rubrique.type === TYPE_RUBRIQUE.IMPOSABLE){
          scopes.BRUT += b.montant;
        }
        if(r.rubrique.add_to_ipres){
          scopes.IPRES += b.montant;
        }
        if(b.montant >= 0){
          bulletin.lignes['gains'].push(b);
        }
      })
    }))
  }

  async attributionIndividuelle(emp:Partial<Employe>,scopes:any,bulletin: CreateBulletinDto,attrInd: AttributionIndividuelle[]){
    const gains =  attrInd.filter(a => a.rubrique.type !== TYPE_RUBRIQUE.RETENUE);

    gains.sort((a,b) => a.rubrique.ordre - b.rubrique.ordre).map(r => {
      r.rubrique.regle_base = r.rubrique.regle_base.replaceAll('@','');
      r.rubrique.regle_montant = r.rubrique.regle_montant.replaceAll('@','');
      return r;
    }).forEach(r => {
        const b:Figuration = {
          montant: r.valeur_par_defaut ? r.valeur_par_defaut : round(evaluate(r.rubrique.regle_montant,{...scopes, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2})),
          base: r.valeur_par_defaut ? r.valeur_par_defaut : round(evaluate(r.rubrique.regle_base,{...scopes, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2})),
          taux1: r.rubrique.taux1,
          taux2: r.rubrique.taux2,
          rubrique: { _id: r.rubrique._id, libelle: r.rubrique.libelle, code: r.rubrique.code, type: r.rubrique.type, taux1: r.rubrique.taux1, taux2: r.rubrique.taux2} ,
        };
        
        scopes[r.rubrique.formule] = b.montant;
        if(r.rubrique.type === TYPE_RUBRIQUE.IMPOSABLE){
          scopes.BRUT += b.montant;
        }
        if(r.rubrique.add_to_ipres){
          scopes.IPRES += b.montant;
        }
        if(b.montant >= 0){
          bulletin.lignes['gains'].push(b);
        }
      })
  }

  getAnciennete(recrutement: string){
    let rd:any;
    if(recrutement.includes('/')){
      rd = parse(recrutement,"yyyy/MM/dd",new Date());
    }else {
      rd = parse(recrutement,"yyyy-MM-dd",new Date());
    }
    const diff = intervalToDuration({start: rd,end: Date.now()}).years || 0;
    return diff;
  }

  findImpot(impots: Impot[],brut: number,parts: number){
    const impot = this.findOneImpotByVal(impots,brut);
    let value = 0;
    if(impot) {
     if(parts === 1){
      value = impot.p1;
     }
     else if(parts === 1.5){
      value = impot.p2;
     }
     else if(parts === 2){
      value = impot.p3;
     }
     else if(parts === 2.5){
      value = impot.p4;
      }
      else if(parts === 3){
        value = impot.p5;
        }
        else if(parts === 3.5){
          value = impot.p6;
          }
          else if(parts === 4){
            value = impot.p7;
            }
            else if(parts === 4.5){
              value = impot.p8;
              }
              else if(parts === 5){
                value = impot.p9;
                }
    }
    return value;
  }

  findTrimf(impots:Impot[],brut:number){
    const impot = this.findOneImpotByVal(impots,brut);
    return impot ? impot.trimf : 0;
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

  @Get('statistiques/periode')
  statistiquesParPeriode(
    @Query('moisDebut') moisDebut: string,
    @Query('anneeDebut') anneeDebut: string,
    @Query('moisFin') moisFin: string,
    @Query('anneeFin') anneeFin: string,
  ): Promise<PeriodLotStatisticsResponse> {
    return this.bulletinService.getLotStatisticsByPeriod(
      moisDebut ? parseInt(moisDebut, 10) : undefined,
      anneeDebut ? parseInt(anneeDebut, 10) : undefined,
      moisFin ? parseInt(moisFin, 10) : undefined,
      anneeFin ? parseInt(anneeFin, 10) : undefined,
    );
  }

  @Get('transmis')
  async findAllTransmitted() {
    return this.lotService.findAllTransmitted();
  }

  @Get(':id/detail')
  async findOneWithBulletins(@Param('id') id: string) {
    const lot = await this.lotService.findOneWithBulletins(id);
    if (!lot) {
      throw new HttpException('Lot non trouvé', 404);
    }
    return lot;
  }

  @Get(':id')
  @UserHasPermission({ permission: { lot: ['read'] } })
  async findOne(@Param('id') id: string) {
    return await this.lotService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { lot: ['update'] } })
  update(@Param('id') id: string, @Body() updateLotDto: UpdateLotDto) {
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
    await this.lotQueue.add('deletelot', {
      lotId: id,
      bulletinUrls,
      lotUrl,
    });

    // Supprimer le lot immédiatement (les fichiers seront supprimés par le job)
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

  @Patch('publish/:id')
  publish(@Param('id') id: string) {
    return this.lotService.publish(id);
  }

  @Patch('unpublish/:id')
  unpublish(@Param('id') id: string) {
    return this.lotService.unpublish(id);
  }

  @Patch('transmit/:id')
  transmit(@Param('id') id: string) {
    return this.lotService.transmit(id);
  }

  @Patch('untransmit/:id')
  untransmit(@Param('id') id: string) {
    return this.lotService.untransmit(id);
  }

  private async resolveLegacyImportSource(payload: any, files?: Array<Express.Multer.File>): Promise<{ lots: any[]; bulletins: any[] }> {
    const uploadedSource = this.extractLegacyFiles(files);
    if (uploadedSource) {
      return this.extractLegacyDocuments(uploadedSource);
    }

    if (payload?.filePath || payload?.lotsFilePath || payload?.bulletinsFilePath) {
      const lotsSource = payload?.lotsFilePath ?? payload?.filePath;
      const bulletinsSource = payload?.bulletinsFilePath;
      const lotsPayload = lotsSource ? JSON.parse(await readFile(lotsSource, 'utf-8')) : [];
      const bulletinsPayload = bulletinsSource ? JSON.parse(await readFile(bulletinsSource, 'utf-8')) : [];
      return this.extractLegacyDocuments({ lots: lotsPayload, bulletins: bulletinsPayload });
    }

    return this.extractLegacyDocuments(payload);
  }

  private async resolveLegacyLotSource(payload: any, files?: Array<Express.Multer.File>) {
    const source = await this.resolveLegacyImportSource(payload, files);
    return { lots: source.lots };
  }

  private async resolveLegacyBulletinSource(payload: any, files?: Array<Express.Multer.File>) {
    return this.resolveLegacyImportSource(payload, files);
  }

  private extractLegacyFiles(files?: Array<Express.Multer.File>) {
    if (!files?.length) {
      return null;
    }

    const readJsonFile = (file?: Express.Multer.File) => {
      if (!file?.buffer?.length) {
        return [];
      }
      return JSON.parse(file.buffer.toString('utf-8'));
    };

    const mainFile = files.find((file) => ['file', 'legacyFile', 'importFile'].includes(file.fieldname)) ?? files[0];
    const lotsFile = files.find((file) => ['lotsFile', 'lots'].includes(file.fieldname));
    const bulletinsFile = files.find((file) => ['bulletinsFile', 'bulletins'].includes(file.fieldname));

    if (lotsFile || bulletinsFile) {
      return {
        lots: lotsFile ? readJsonFile(lotsFile) : [],
        bulletins: bulletinsFile ? readJsonFile(bulletinsFile) : [],
      };
    }

    return readJsonFile(mainFile);
  }

  private buildLegacyEmptyResponse(message: string, payload: any, files?: Array<Express.Multer.File>) {
    return {
      debug: {
        message,
        keys: payload && typeof payload === 'object' ? Object.keys(payload) : [],
        filePath: payload?.filePath,
        lotsFilePath: payload?.lotsFilePath,
        bulletinsFilePath: payload?.bulletinsFilePath,
        uploadedFiles: files?.map((file) => ({ fieldname: file.fieldname, originalname: file.originalname })),
      },
    };
  }

  private mergeLegacyImportPayload(
    payload: any,
    query: { filePath?: string; lotsFilePath?: string; bulletinsFilePath?: string },
    headerFilePath?: string,
  ) {
    const safePayload = payload && typeof payload === 'object' ? payload : {};

    return {
      ...safePayload,
      filePath: this.normalizeImportString(safePayload.filePath) ?? this.normalizeImportString(query.filePath) ?? this.normalizeImportString(headerFilePath),
      lotsFilePath: this.normalizeImportString(safePayload.lotsFilePath) ?? this.normalizeImportString(query.lotsFilePath),
      bulletinsFilePath: this.normalizeImportString(safePayload.bulletinsFilePath) ?? this.normalizeImportString(query.bulletinsFilePath),
    };
  }

  private normalizeImportString(value: any) {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  private extractLegacyDocuments(payload: any): { lots: any[]; bulletins: any[] } {
    const rootEntries = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.lots)
        ? payload.lots
        : Array.isArray(payload?.registres)
          ? payload.registres
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

    const rawLots = rootEntries.filter((entry) =>
      entry &&
      typeof entry === 'object' &&
      (
        Array.isArray(entry?.bulletins) ||
        (entry?.debut && entry?.fin) ||
        (entry?._id && entry?.libelle && entry?.mois !== undefined && entry?.annee !== undefined)
      ),
    );

    const registres = rootEntries.filter((entry) => entry && typeof entry === 'object' && Array.isArray(entry?.bulletins));
    const rawBulletins = Array.isArray(payload?.bulletins) ? payload.bulletins : [];
    const embeddedBulletins = registres.flatMap((registre) => registre.bulletins ?? []);
    const nestedLots = embeddedBulletins
      .map((bulletin) => bulletin?.lot)
      .filter((lot) => lot && typeof lot === 'object');
    const lots = embeddedBulletins.length && nestedLots.length ? nestedLots : rawLots;

    return {
      lots,
      bulletins: rawBulletins.length ? rawBulletins : embeddedBulletins,
    };
  }

  private deduplicateLegacyLots(lots: any[]) {
    const lotMap = new Map<string, any>();
    lots.forEach((lot) => {
      const lotId = this.toObjectId(lot._id, 'lot._id').toString();
      if (!lotMap.has(lotId)) {
        lotMap.set(lotId, lot);
      }
    });
    return Array.from(lotMap.values());
  }

  private normalizeLegacyDocument(value: any): any {
    if (Array.isArray(value)) {
      return value.map((entry) => this.normalizeLegacyDocument(entry));
    }

    if (!value || typeof value !== 'object') {
      return value;
    }

    const keys = Object.keys(value);
    if (keys.length === 1 && keys[0] === '$oid') {
      return value.$oid;
    }
    if (keys.length === 1 && keys[0] === '$date') {
      return new Date(value.$date);
    }

    return keys.reduce((acc, key) => {
      acc[key] = this.normalizeLegacyDocument(value[key]);
      return acc;
    }, {});
  }

  private toLegacyLotDocument(lot: any) {
    const [annee, mois] = (lot.debut ?? '').split('-');
    const lotId = this.toObjectId(lot._id, 'lot._id');
    const lotMois = Number(lot.mois ?? mois);
    const lotAnnee = Number(lot.annee ?? annee);

    return {
      _id: lotId,
      libelle: lot.libelle,
      debut: lot.debut,
      fin: lot.fin,
      annee: lotAnnee,
      mois: lotMois,
      etat: lot.etat ?? 'BROUILLON',
      isPublished: Boolean(lot.isPublished),
      url: this.buildLegacyLotUrl(lotId.toString(), lotMois, lotAnnee),
      createdAt: lot.createdAt instanceof Date ? lot.createdAt : undefined,
      updatedAt: lot.updatedAt instanceof Date ? lot.updatedAt : undefined,
    };
  }

  private toLegacyBulletinDocument(bulletin: any, lot?: any) {
    const lotId = this.toObjectId(bulletin.lot?._id ?? bulletin.lot, 'bulletin.lot');
    const employeId = this.toObjectId(bulletin.employe?._id ?? bulletin.employe, 'bulletin.employe');
    const lotMois = Number(lot?.mois ?? bulletin.lot?.mois);
    const lotAnnee = Number(lot?.annee ?? bulletin.lot?.annee);
    const legacyBulletin = {
      _id: this.toObjectId(bulletin._id, 'bulletin._id'),
      employe: employeId,
      lot: lotId,
      lignes: {
        gains: this.normalizeLegacyLignes(bulletin.lignes?.gains),
        retenues: this.normalizeLegacyLignes(bulletin.lignes?.retenues),
      },
      totalIm: 0,
      totalNI: 0,
      totalRet: 0,
      totalPP: 0,
      nap: 0,
      url: this.buildLegacyBulletinUrl(lotId.toString(), employeId.toString(), lotMois, lotAnnee),
      createdAt: bulletin.createdAt instanceof Date ? bulletin.createdAt : undefined,
      updatedAt: bulletin.updatedAt instanceof Date ? bulletin.updatedAt : undefined,
    };

    const calcul = new Calcul();
    const { totalIm, totalNI, totalRet, totalPP, nap } = calcul.getTotal(legacyBulletin as any);
    legacyBulletin.totalIm = totalIm;
    legacyBulletin.totalNI = totalNI;
    legacyBulletin.totalRet = totalRet;
    legacyBulletin.totalPP = totalPP;
    legacyBulletin.nap = nap;

    return legacyBulletin;
  }

  private buildLegacyBulletinUrl(lotId: string, employeId: string, mois: number, annee: number) {
    if (!lotId || !employeId || !Number.isFinite(mois) || !Number.isFinite(annee)) {
      throw new Error('Impossible de construire l url du bulletin legacy');
    }

    return `bulletins/${lotId}-${employeId}-${mois}-${annee}.pdf`;
  }

  private buildLegacyLotUrl(lotId: string, mois: number, annee: number) {
    if (!lotId || !Number.isFinite(mois) || !Number.isFinite(annee)) {
      throw new Error('Impossible de construire l url du lot legacy');
    }

    return `bulletins/${lotId}-${mois}-${annee}.pdf`;
  }

  private normalizeLegacyLignes(lignes: any[] = []) {
    return lignes.map((ligne) => ({
      montant: Number(ligne?.montant ?? 0),
      base: Number(ligne?.base ?? 0),
      taux1: Number(ligne?.taux1 ?? 0),
      taux2: Number(ligne?.taux2 ?? 0),
      rubrique: ligne?.rubrique
        ? {
            _id: ligne.rubrique._id ? this.toObjectId(ligne.rubrique._id, 'bulletin.lignes.rubrique._id') : undefined,
            libelle: ligne.rubrique.libelle,
            code: ligne.rubrique.code,
            type: this.normalizeLegacyRubriqueType(ligne.rubrique),
            taux1: Number(ligne.rubrique.taux1 ?? 0),
            taux2: Number(ligne.rubrique.taux2 ?? 0),
          }
        : undefined,
    }));
  }

  private normalizeLegacyRubriqueType(rubrique: any) {
    if (rubrique?.type) {
      return rubrique.type;
    }

    const sectionName = rubrique?.section?.nom;
    if (sectionName === 'IMPOSABLE') {
      return TYPE_RUBRIQUE.IMPOSABLE;
    }
    if (sectionName === 'NON-IMPOSABLE') {
      return TYPE_RUBRIQUE.NON_IMPOSABLE;
    }
    if (sectionName === 'RETENUE') {
      return TYPE_RUBRIQUE.RETENUE;
    }

    return rubrique?.type;
  }

  private toObjectId(value: any, field: string): Types.ObjectId {
    if (value instanceof Types.ObjectId) {
      return value;
    }

    if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }

    throw new Error(`Champ invalide pour ${field}`);
  }


}
