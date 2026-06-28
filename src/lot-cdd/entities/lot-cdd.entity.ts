import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { BulletinCDD } from "src/bulletin-cdd/entities/bulletin-cdd.entity";

export type LotCDDDocument = HydratedDocument<LotCDD>;

export enum StateLotCDD {
    BROUILLON = 'BROUILLON',
    WAITING1 = 'SOUMIS',
    WAITING2 = 'EN COURS DE VALIDATION',
    VALIDE = 'VALIDE',
}

@Schema({ timestamps: true })
export class LotCDD {
    _id: string;

    @Prop({ type: String, required: true })
    libelle: string;

    @Prop({ type: String, required: true })
    debut: string;

    @Prop({ type: String, required: true })
    fin: string;

    @Prop({ type: Number, required: true })
    annee: number;

    @Prop({ type: Number, required: true })
    mois: number;

    @Prop({ type: String, required: true, enum: StateLotCDD, default: StateLotCDD.BROUILLON })
    etat: StateLotCDD;

    @Prop({ type: Boolean, default: false, required: true })
    isPublished: boolean;


     @Prop({type:Boolean, default: false,required: true})
    isTransmitted:boolean;

    @Prop({ type: String })
    url: string;

    bulletins: BulletinCDD[];
}

export const LotCDDSchema = SchemaFactory.createForClass(LotCDD);
