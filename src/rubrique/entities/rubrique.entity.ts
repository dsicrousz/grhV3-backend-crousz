import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export enum TYPE_RUBRIQUE {
    IMPOSABLE = 'IMPOSABLE',
    NON_IMPOSABLE = 'NON_IMPOSABLE',
    RETENUE = 'RETENUE'
}

export type RubriqueDocument = HydratedDocument<Rubrique>;

@Schema({timestamps: true})
export class Rubrique {

_id:string;

@Prop({type: String,required: true})
libelle:string;

@Prop({type: Number,required: true,unique:true})
code:number;

@Prop({type: String, required: true,enum:TYPE_RUBRIQUE})
type: String;

@Prop({type: Number,required: true,default:0})
taux1:number;

@Prop({type: Number,required: true,default:0})
taux2:number;

@Prop({type: Number,required: true,default:0})
ordre:number;

@Prop({type: String,required:true})
regle_montant:string;

@Prop({type: String,required:true})
formule:string;

@Prop({type: String,required:true})
regle_base:string;

@Prop({type: Boolean,required:true,default:false})
add_to_brut:boolean;

@Prop({type: Boolean,required:true,default:false})
add_to_ipres:boolean;
}
export const RubriqueSchema = SchemaFactory.createForClass(Rubrique);