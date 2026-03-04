import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Employe } from "src/employe/entities/employe.entity";

export type AbsenceDocument = HydratedDocument<Absence>;

export enum StatutDemande {
    EN_ATTENTE = 'en_attente',
    EN_COURS_VALIDATION = 'en_cours_validation',
    APPROUVEE = 'approuvee',
    REJETEE = 'rejetee',
    ANNULEE = 'annulee'
}

export enum TypeAbsence {
    MALADIE = 'maladie',
    PERSONNEL = 'personnel',
    FAMILIAL = 'familial',
    AUTRE = 'autre'
}

@Schema({ timestamps: true })
export class Absence {
    _id: string;

    @Prop({ type: Date, required: true })
    date_debut: Date;

    @Prop({ type: Date, required: true })
    date_fin: Date;

    @Prop({ type: String, enum: TypeAbsence, required: true })
    type: TypeAbsence;

    @Prop({ type: String })
    motif: string;

    @Prop({ type: String, enum: StatutDemande, default: StatutDemande.EN_ATTENTE })
    statut: StatutDemande;

    @Prop({ type: String })
    commentaire_validation: string;

    @Prop({ type: Date })
    date_validation: Date;

    @Prop({ type: String })
    valide_par: string;

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

export const AbsenceSchema = SchemaFactory.createForClass(Absence);
