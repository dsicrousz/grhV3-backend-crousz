import { Rubrique } from "src/rubrique/entities/rubrique.entity";

export class Figuration {
   
    montant: number

    taux1: number

    taux2: number

    base: number

    rubrique: Partial<Rubrique>;
}
