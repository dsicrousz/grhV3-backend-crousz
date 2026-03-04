import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpException, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { LotService } from './lot.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { EmployeService } from 'src/employe/employe.service';
import { Figuration} from 'src/figuration/entities/figuration.entity';
import { Bulletin } from 'src/bulletin/entities/bulletin.entity';
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
import { PdfMaker } from './helpers/pdf.maker';
import { glob } from 'glob';
import { unlinkSync} from 'fs';
import { Lot } from './entities/lot.entity';
import { Calcul } from './helpers/calcul';
import { evaluate } from 'mathjs';
import { TYPE_RUBRIQUE } from 'src/rubrique/entities/rubrique.entity';
import { BulletinService } from 'src/bulletin/bulletin.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateBulletinDto } from 'src/bulletin/dto/create-bulletin.dto';
import { Employe } from 'src/employe/entities/employe.entity';
import { Impot } from 'src/impot/entities/impot.entity';


@Controller('lot')
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
    @InjectQueue('lot') private lotQueue: Queue
    ) {}

  @Post()
  create(@Body() createLotDto: CreateLotDto) {
    return this.lotService.createLot(createLotDto);
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

  @Post('generate/:id')
  async generateBulletin(@Param('id') id: string) {
    const pdf = new PdfMaker();
    const lot = await this.lotService.findOne(id);
    const employes = await this.employeService.findActive();
    const attG = await this.attributionGlobaleService.findAll();
    const impots = await this.impotService.findAll();
    const bulletins: Bulletin[] =[];
    for (let emp of employes){
      const calcul = new Calcul();
       let bulletin:CreateBulletinDto = {employe: emp._id.toString(),lignes:{gains:[],retenues:[]},lot:lot._id,totalIm:0,totalNI:0,totalRet:0,totalPP:0,nap:0};
       const scopes = {
        CATEGORIE_VALEUR: emp.categorie.valeur,
        EMP_CLASSE: emp.categorie.code.toString().substring(0,1),
        ENCIENNETE: this.getAnciennete(emp.date_de_recrutement),
        EST_CADRE: Boolean(emp.categorie.estCadre),
        IMPOT:0,
        TRIMF:0,
        BRUT:0,
        IPRES:0,
      }
       await this.determinationGains(emp,scopes,bulletin,attG);
       await this.determinationRetenues(impots,emp,scopes,bulletin,attG);
       const {totalIm,totalNI,totalRet,totalPP,nap} = calcul.getTotal(bulletin);
       bulletin.totalIm = totalIm;
       bulletin.totalNI = totalNI;
       bulletin.totalRet = totalRet;
       bulletin.totalPP = totalPP;
       bulletin.nap = nap;
       await this.bulletinService.updateBulletin(emp._id,bulletin);
       bulletins.push(bulletin);
  }
  const bulletinsCreated =  await this.bulletinService.findByLot(id);
  const previousLots = await this.lotService.findByAnneeAndOldMois(lot.annee,lot.mois);
  for (let b of bulletinsCreated) {
    const olds = [];  
    previousLots.forEach(r => {
      olds.push(r?.bulletins?.filter(({employe}:any) => employe.toString() === b.employe.toString()) ?? [])
    })
    try {
     await this.lotQueue.add('generatebulletin', {bulletin:b,olds:flatten(olds),lot });
    } catch (error) {
    throw new HttpException(error.message,500);
  }
  }
  let urlLot;
  try {
     urlLot = pdf.makeAll(bulletinsCreated,lot,previousLots);
  } catch (error) {
    throw  new HttpException(error.message,500);
  }
  return await this.lotService.update(lot._id,{url:urlLot});
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
    const m =  this.findImpot(impots,scopes.BRUT,emp.nombre_de_parts);
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
        if(b.montant > 0){
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
        if(b.montant > 0){
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
        if(b.montant > 0){
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
        if(b.montant > 0){
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
        if(b.montant > 0){
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
    const lotValide = await this.lotService.findAllValide();
    let files = [];
    await Promise.all(lotValide.map(async (l:Lot) => {  
      if(l.isPublished) {
         const fils = await glob(`uploads/bulletins/${l._id.toString()}-${id}-*.pdf`);
         files = [...files, ...fils];
         return fils;
      }
    }))
    return files.sort((a:string,b:string) => b.split(id)[1].localeCompare(a.split(id)[1]));
  }

  // @Get('annuel/:annee')
  // async getBulletins(@Param('annee') annee: string) {
  //   try {
  //     const employes = await this.employeService.findAllCdi();
      
  //     // Tableau pour stocker les résultats
  //     const result = [];
      
  //     // Créer une structure de données pour organiser les NAP par employé et par mois
  //     const employeNapData = {};
      
  //     // Initialiser la structure de données pour chaque employé
  //     for (const employe of employes) {
  //       employeNapData[employe._id.toString()] = {
  //         employe: {
  //           _id: employe._id,
  //           nom: employe.nom,
  //           prenom: employe.prenom,
  //           categorie: employe.categorie.code,
  //           matricule: employe.matricule_de_solde
  //         },
  //         naps: Array(12).fill({totalIm:0,totalRet:0,totalNI:0,nap:0,totalPP:0}) // Initialiser un tableau de 12 mois avec des valeurs à 0
  //       };
  //     }
      
  //     // Parcourir les registres pour remplir les NAP
  //     for (const registre of registres) {
  //       const moisIndex = registre.mois - 1; // Convertir en index 0-11
        
  //       for (const bulletin of registre.bulletins) {
  //         const employeId = bulletin.employe._id.toString();
          
  //         // Vérifier si l'employé existe dans notre structure
  //         if (employeNapData[employeId]) {
  //           const calcul = new Calcul();
  //           const { totalIm, totalRet, totalNI,nap,totalPP } = calcul.getTotal(bulletin);           
  //           // Mettre à jour le NAP pour cet employé et ce mois
  //           employeNapData[employeId].naps[moisIndex] = {totalIm, totalRet, totalNI,nap,totalPP};
  //         }
  //       }
  //     }
      
  //     // Convertir la structure de données en tableau de résultats
  //     for (const employeId in employeNapData) {
  //       result.push(employeNapData[employeId]);
  //     }
      
  //     return result;
  //   } catch (error) {
  //     throw new HttpException(
  //       `Erreur lors de la récupération des bulletins: ${error.message}`,
  //       HttpStatus.INTERNAL_SERVER_ERROR
  //     );
  //   }
  // }


  @Get()
  findAll() {
    return this.lotService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lotService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLotDto: UpdateLotDto) {
    return this.lotService.update(id, updateLotDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const lot = await this.lotService.remove(id);
    await this.bulletinService.deleteMany(id);
    const files = await  glob(`uploads/bulletins/${id}-*.pdf`);
    files.forEach(f => unlinkSync(`${f}`));
    return lot;
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


}
