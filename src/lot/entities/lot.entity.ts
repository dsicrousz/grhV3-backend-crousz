import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Bulletin } from "src/bulletin/entities/bulletin.entity";

export type LotDocument = HydratedDocument<Lot>

export enum StateLot {
    BROUILLON = 'BROUILLON',
    WAITING1 = 'SOUMIS',
    WAITING2 = 'EN COURS DE VALIDATION',
    VALIDE = 'VALIDE',
}

@Schema({timestamps: true})
export class Lot {
    _id: string;

    @Prop({type: String,required: true})
    libelle: string;

    @Prop({type: String,required: true})
    debut:string;

    @Prop({type: String,required: true})
    fin: string;

    @Prop({type: Number,required: true})
    annee: number;

    @Prop({type:Number,required: true})
    mois:number;

    @Prop({type: String,required: true,enum:StateLot,default:StateLot.BROUILLON})
    etat: StateLot;

    @Prop({type:Boolean, default: false,required: true})
    isPublished:boolean;

    @Prop({type:String})
    url:string;

    bulletins: Bulletin[];
}

export const LotSchema = SchemaFactory.createForClass(Lot);