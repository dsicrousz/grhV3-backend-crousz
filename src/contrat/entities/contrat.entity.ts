import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Categorie } from "src/categorie/entities/categorie.entity";
import { Employe } from "src/employe/entities/employe.entity";
import { Poste } from "src/poste/entities/poste.entity";

export type ContratDocument = HydratedDocument<Contrat>;

export enum TypeContrat {
    CDI = 'CDI',
    CDD = 'CDD',
    TEMPORAIRE = 'TEMPORAIRE',
}

export enum MotifTerminaison {
    DEMISSION = 'DEMISSION',
    LICENCIEMENT_ABUSIF = 'LICENCIEMENT_ABUSIF',
    LICENCIEMENT_ECONOMIQUE = 'LICENCIEMENT_ECONOMIQUE',
    LICENCIEMENT_DISCIPLINAIRE = 'LICENCIEMENT_DISCIPLINAIRE',
    RETRAITE = 'RETRAITE',
    DECES = 'DECES',
    FIN_CDD = 'FIN_CDD',
    RUPTURE_CONVENTIONNELLE = 'RUPTURE_CONVENTIONNELLE',
    AUTRE = 'AUTRE',
}

@Schema({ timestamps: true })
export class Contrat {
    _id?: string;

    @Prop({ type: String, enum: TypeContrat, required: true })
    type: TypeContrat;

    @Prop({ type: Date, required: true })
    date_debut: Date;

    @Prop({ type: Date })
    date_fin: Date;

    @Prop({ type: Types.ObjectId, ref: Poste.name, required: true, autopopulate: true })
    poste: Poste;

    @Prop({ type: Number })
    salaire_fixe: number;

    @Prop({ type: String })
    description: string;

    @Prop({ type: Boolean, default: true })
    est_actif: boolean;

    @Prop({ type: Types.ObjectId, ref: Categorie.name, autopopulate: true })
    categorie: Categorie;

    @Prop({ type: String })
    matricule_de_solde: string;

    @Prop({ type: Number, default: 0 })
    nombre_de_parts: number;

    @Prop({ type: String, enum: MotifTerminaison })
    motif_terminaison: MotifTerminaison;

    @Prop({ type: Types.ObjectId, ref: Employe.name, required: true, autopopulate: true, index: true })
    employe: string;
}

export const ContratSchema = SchemaFactory.createForClass(Contrat);
