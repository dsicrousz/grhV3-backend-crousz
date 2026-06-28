import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type LotTemporaireDocument = HydratedDocument<LotTemporaire>;

export enum StateLotTemporaire {
    BROUILLON = 'BROUILLON',
    WAITING1 = 'SOUMIS',
    WAITING2 = 'EN COURS DE VALIDATION',
    VALIDE = 'VALIDE',
}

@Schema({ timestamps: true })
export class LotTemporaire {
    _id?: string;

    @Prop({ type: String, required: true })
    libelle: string;

    @Prop({ type: String, required: true })
    debut: string;

    @Prop({ type: String, required: true })
    fin: string;

    @Prop({ type: Number, required: true })
    mois: number;

    @Prop({ type: Number, required: true })
    annee: number;

    @Prop({ type: String, required: true, enum: StateLotTemporaire, default: StateLotTemporaire.BROUILLON })
    etat: StateLotTemporaire;

    @Prop({ type: Boolean, default: false })
    isPublished: boolean;

     @Prop({type:Boolean, default: false,required: true})
    isTransmitted:boolean;

    @Prop({ type: String })
    url: string;
}

export const LotTemporaireSchema = SchemaFactory.createForClass(LotTemporaire);
