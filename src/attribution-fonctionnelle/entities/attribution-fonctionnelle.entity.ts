import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Type } from "class-transformer";
import mongoose, { HydratedDocument } from "mongoose";
import { Fonction } from "src/fonction/entities/fonction.entity";
import { Rubrique } from "src/rubrique/entities/rubrique.entity";

export type AttributionFonctionnelleDocument = HydratedDocument<AttributionFonctionnelle>;

@Schema({timestamps: true})
export class AttributionFonctionnelle {
    _id: string;

    @Prop({type: mongoose.Schema.Types.ObjectId,ref: Fonction.name, required: true, autopopulate:true})
    fonction: string;

    @Prop({type: mongoose.Schema.Types.ObjectId,ref: Rubrique.name, required: true, autopopulate:true})
    @Type(() => Rubrique)
    rubrique: Rubrique;
    
    @Prop({type: Number})
    valeur_par_defaut: number;
}

export const AttributionFonctionnelleSchema = SchemaFactory.createForClass(AttributionFonctionnelle).index({'fonction': 1, 'rubrique': 1}, {unique: true});