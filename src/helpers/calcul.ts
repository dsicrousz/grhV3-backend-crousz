import { intervalToDuration, parse } from "date-fns";
import { Bulletin } from "src/bulletin/entities/bulletin.entity";
import { TYPE_RUBRIQUE } from "src/rubrique/entities/rubrique.entity";

export class Calcul {
    public totalImposable = 0;
    public totalNomImposable = 0;
    public totalRetenue = 0;
    public totalPp = 0;
    public tppi = 0;
    public tppr = 0;
    public tppni = 0;

    getTotauxAnnuel = (bulletins: Bulletin[]) =>{
        let totalIm = 0;
        let totalNI = 0;
        let totalRet = 0;
        let totalPP = 0;
        let nap = 0;
       bulletins.forEach(b => {
        const ri = this.getTotalIm(b);
        const rni = this.getTotalNI(b);
        const rr = this.getTotalRet(b);
        totalIm += ri.total;
        totalNI += rni.total;
        totalRet += rr.total;
        totalPP += ri.totalpp + rni.totalpp + rr.totalpp;
       })
       nap = totalIm + totalNI  - totalRet;
       return {totalIm,totalNI,totalRet,totalPP,nap};
    }

    getTotalIm = (b: Bulletin) => {
        const imp = b.lignes['gains'].filter(g => g.rubrique.type === TYPE_RUBRIQUE.IMPOSABLE);
        return this.getTotaux(imp);
    }

    getTotalNI = (b: Bulletin) => {
        const noni = b.lignes['gains'].filter(g => g.rubrique.type === TYPE_RUBRIQUE.NON_IMPOSABLE);
        return this.getTotaux(noni);
    }
    getTotalRet = (b: Bulletin) => {
        const ret = b.lignes['retenues'].filter(g => g.rubrique.type === TYPE_RUBRIQUE.RETENUE);
        return this.getTotaux(ret);
    }

    getTotal = (bulletin: Bulletin) => {
        let totalIm = 0;
        let totalNI = 0;
        let totalRet = 0;
        let totalPP = 0;
        let nap = 0;
        const imp = bulletin.lignes['gains'].filter(g => g.rubrique.type === TYPE_RUBRIQUE.IMPOSABLE);
        const nonimp = bulletin.lignes['gains'].filter(g => g.rubrique.type === TYPE_RUBRIQUE.NON_IMPOSABLE);
        const ret = bulletin.lignes['retenues'].filter(g => g.rubrique.type === TYPE_RUBRIQUE.RETENUE);
        const tti = this.getTotaux(imp);
        const ttn = this.getTotaux(nonimp);
        const ttr = this.getTotaux(ret);
        totalIm += tti.total;
        totalNI += ttn.total;
        totalRet += ttr.total;
        totalPP = tti.totalpp + ttn.totalpp + ttr.totalpp;
        nap = totalIm + totalNI - totalRet;
        return {totalIm,totalNI,totalRet,totalPP,nap};

    }

    imposable = (gains) => {
        const arr = gains.filter(g => g.rubrique.type === TYPE_RUBRIQUE.IMPOSABLE);
        const {total,totalpp} = this.getTotaux(arr);
        this.totalImposable += total;
        this.totalPp += totalpp;
        this.tppi = totalpp;
        return arr;
    }
    
    nonimposable = (gains) => {
        const arr = gains.filter(g => g.rubrique.type === TYPE_RUBRIQUE.NON_IMPOSABLE);
        const {total,totalpp} = this.getTotaux(arr);
        this.totalNomImposable += total;
        this.totalPp += totalpp;
        this.tppni = totalpp;
        return arr;
    }
    
    retenues = (retenues) => {
        const arr = retenues.filter(g => g.rubrique.type === TYPE_RUBRIQUE.RETENUE);
        const {total,totalpp} = this.getTotaux(arr);
        this.totalRetenue += total;
        this.totalPp += totalpp;
        this.tppr = totalpp;
        return arr;
    }
  
  
    getAnciennete(recrutement: string){
      const rd = parse(recrutement,"yyyy-MM-dd",new Date());
      const diff = intervalToDuration({start: rd,end: Date.now()})
      return `${diff.years || 0} ans ${diff.months || 0} mois ${diff.days || 0} jours`;
    }

    getTotaux = (arr) => {
        const total = arr.reduce((acc,cur) => acc + cur.montant,0);
        const totalpp = arr.reduce((acc,cur) => cur.taux2 ? acc + Math.round(cur.taux2 * cur.base / 100): acc + 0,0);
        return {total,totalpp};
    }

    getIpReComCadre(bulletins: Bulletin[]){
        const lignes = [];
        bulletins.filter(bu => {
            bu.lignes['retenues'];
        }).forEach(b => {

        })
    }
}