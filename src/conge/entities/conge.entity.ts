import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Employe } from "src/employe/entities/employe.entity";

export type CongeDocument = HydratedDocument<Conge>;

export enum StatutDemandeConge {
    EN_ATTENTE = 'en_attente',
    EN_COURS_VALIDATION = 'en_cours_validation',
    APPROUVEE = 'approuvee',
    REJETEE = 'rejetee',
    ANNULEE = 'annulee'
}

export enum TypeConge {
    ANNUEL = 'annuel',
    MALADIE = 'maladie',
    MATERNITE = 'maternite',
    PATERNITE = 'paternite',
    SANS_SOLDE = 'sans_solde',
    EXCEPTIONNEL = 'exceptionnel',
    FORMATION = 'formation',
    AUTRE = 'autre'
}

@Schema({ timestamps: true })
export class Conge {
    _id: string;

    @Prop({ type: Date, required: true })
    date_debut: Date;

    @Prop({ type: Date, required: true })
    date_fin: Date;

    @Prop({ type: Number, required: true })
    nombre_jours: number;

    @Prop({ type: String, enum: TypeConge, required: true })
    type: TypeConge;

    @Prop({ type: String })
    motif: string;

    @Prop({ type: String, enum: StatutDemandeConge, default: StatutDemandeConge.EN_ATTENTE })
    statut: StatutDemandeConge;

    @Prop({ type: String })
    commentaire_validation: string;

    @Prop({ type: Date })
    date_validation: Date;

    @Prop({ type: String })
    valide_par: string;

    @Prop({ type: Date })
    date_demande: Date;

    @Prop({ type: Types.ObjectId, ref: Employe.name, required: true, autopopulate: true })
    employe: Employe;

    @Prop({ type: Boolean, default: false })
    workflow_initialise: boolean;

    @Prop({ type: Number, default: 0 })
    etape_courante: number;

    @Prop({ type: Number, default: 0 })
    total_etapes: number;

    @Prop({ type: String })
    niveau_courant: string;
}

export const CongeSchema = SchemaFactory.createForClass(Conge);
