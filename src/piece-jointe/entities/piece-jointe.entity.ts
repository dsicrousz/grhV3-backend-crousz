import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Employe } from "src/employe/entities/employe.entity";

export type PieceJointeDocument = HydratedDocument<PieceJointe>;

export enum TypePieceJointe {
    CONTRAT = 'contrat',
    DIPLOME = 'diplome',
    CV = 'cv',
    PIECE_IDENTITE = 'piece_identite',
    CERTIFICAT_TRAVAIL = 'certificat_travail',
    ATTESTATION = 'attestation',
    FICHE_POSTE = 'fiche_poste',
    EVALUATION = 'evaluation',
    FORMATION = 'formation',
    MEDICAL = 'medical',
    AUTRE = 'autre'
}

@Schema({ timestamps: true })
export class PieceJointe {
    _id: string;

    @Prop({ type: String, required: true })
    nom: string;

    @Prop({ type: String, required: true })
    nom_fichier: string;

    @Prop({ type: String, required: true })
    url: string;

    @Prop({ type: String, required: true })
    mimetype: string;

    @Prop({ type: Number, required: true })
    taille: number;

    @Prop({ type: String, enum: TypePieceJointe, required: true })
    type: TypePieceJointe;

    @Prop({ type: String })
    description: string;

    @Prop({ type: Date })
    date_document: Date;

    @Prop({ type: Date })
    date_expiration: Date;

    @Prop({ type: Boolean, default: true })
    est_actif: boolean;

    @Prop({ type: Types.ObjectId, ref: Employe.name, required: true, autopopulate: true })
    employe: Employe;

    @Prop({ type: String })
    ajoute_par: string;
}

export const PieceJointeSchema = SchemaFactory.createForClass(PieceJointe);
