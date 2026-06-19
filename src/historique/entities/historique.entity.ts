import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Employe } from "src/employe/entities/employe.entity";

export type HistoriqueDocument = HydratedDocument<Historique>;

export enum TypeEvenement {
    CONTRAT_CREATION = 'CONTRAT_CREATION',
    CONTRAT_MODIFICATION = 'CONTRAT_MODIFICATION',
    CONTRAT_FIN = 'CONTRAT_FIN',
    AFFECTATION_SITE = 'AFFECTATION_SITE',
    FIN_AFFECTATION_SITE = 'FIN_AFFECTATION_SITE',
    NOMINATION = 'NOMINATION',
    FIN_NOMINATION = 'FIN_NOMINATION',
    MODIFICATION_PROFIL = 'MODIFICATION_PROFIL',
    ACTIVATION = 'ACTIVATION',
    DESACTIVATION = 'DESACTIVATION',
    AUTRE = 'AUTRE',
}

@Schema({ timestamps: true })
export class Historique {
    _id?: string;

    @Prop({ type: Types.ObjectId, ref: Employe.name, required: true, index: true })
    employe: string;

    @Prop({ type: String, enum: TypeEvenement, required: true })
    type_evenement: TypeEvenement;

    @Prop({ type: String, required: true })
    description: string;

    @Prop({ type: Object })
    details: Record<string, any>;

    @Prop({ type: String })
    auteur: string;
}

export const HistoriqueSchema = SchemaFactory.createForClass(Historique);
