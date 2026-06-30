import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

export type EmployeDocument = Employe & Document;

@Schema({timestamps: true})
export class Employe {
    
    _id:string;

    @Prop({type:String, required: true})
    prenom: string;

    @Prop({type:String, required: true})
    nom: string;

    @Prop({type: String, default: uuidv4, index: true})
    code: string;

    @Prop({type:String, required: true})
    telephone: string;

    @Prop({type:String, required: true})
    adresse: string;

    @Prop({type:String, required: true})
    nationalite: string;

    @Prop({type:String, required: true, index: true})
    nci: string;

    @Prop({type:String, required: true})
    genre: string;

    @Prop({type:String, required: true})
    civilite: string;

    @Prop({type:String, required: true})
    date_de_naissance: string;

    @Prop({type:String, required: true})
    lieu_de_naissance: string;

    @Prop({type:String})
    profile: string;

    @Prop({type:Number, required: true, default: true, index: true})
    is_actif: number;
}


export const  EmployeSchema = SchemaFactory.createForClass(Employe);