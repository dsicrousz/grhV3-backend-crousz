import { TYPE_RUBRIQUE } from 'src/rubrique/entities/rubrique.entity';

export interface PeriodLotStatisticsRubrique {
  rubriqueId: string | null;
  code: string | null;
  libelle: string;
  type: TYPE_RUBRIQUE | string | null;
  occurrences: number;
  totalMontant: number;
  totalBase: number;
  totalTaux1: number;
  totalTaux2: number;
  moyenneMontant: number;
  moyenneBase: number;
}

export interface PeriodLotStatisticsLot {
  lotId: string;
  libelle: string;
  mois: number;
  annee: number;
  etat: string;
  bulletinCount: number;
  effectif: number;
  brut: number;
  net: number;
  totalIm: number;
  totalNI: number;
  totalRet: number;
  totalPP: number;
  rubriques: PeriodLotStatisticsRubrique[];
}

export interface PeriodLotStatisticsMonth {
  key: string;
  mois: number;
  annee: number;
  lotCount: number;
  bulletinCount: number;
  effectif: number;
  brut: number;
  net: number;
  totalIm: number;
  totalNI: number;
  totalRet: number;
  totalPP: number;
}

export interface PeriodLotStatisticsResponse {
  periode: {
    debut: { mois: number; annee: number; key: string };
    fin: { mois: number; annee: number; key: string };
    lotsCount: number;
    bulletinsCount: number;
  };
  totaux: {
    brut: number;
    net: number;
    totalIm: number;
    totalNI: number;
    totalRet: number;
    totalPP: number;
    effectif: number;
  };
  evolutionMensuelle: PeriodLotStatisticsMonth[];
  rubriques: PeriodLotStatisticsRubrique[];
  lots: PeriodLotStatisticsLot[];
}
