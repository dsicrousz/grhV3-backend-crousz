import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Employe } from "src/employe/entities/employe.entity";
import { Rubrique } from "src/rubrique/entities/rubrique.entity";

export type AttributionIndividuelleDocument = HydratedDocument<AttributionIndividuelle>;

@Schema({timestamps: true})
export class AttributionIndividuelle {
    @Prop({type: mongoose.Schema.Types.ObjectId,ref: Employe.name,required: true,autopopulate:true})
    employe: Employe;

    @Prop({type: mongoose.Schema.Types.ObjectId,ref: Rubrique.name,required: true,autopopulate: {maxDepth: 2}})
    rubrique: Rubrique;
    
    @Prop({type: Number})
    valeur_par_defaut: number;
}

export const AttributionIndividuelleSchema = SchemaFactory.createForClass(AttributionIndividuelle).index({'employe': 1, 'rubrique': 1}, {unique: true});;