import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, Types } from "mongoose";
import { Categorie } from "src/categorie/entities/categorie.entity";
import { v4 as uuidv4 } from 'uuid';
import { TypeEmploye } from "../dto/create-employe.dto";

export type EmployeDocument = Employe & Document;

@Schema({timestamps: true})
export class Employe {
    
    _id:string;

    @Prop({type:String, required: true})
    prenom: string;

    @Prop({type:String, required: true})
    nom: string;

    @Prop({type: String, default: uuidv4})
    code: string;

    @Prop({type: String, default: '123456'})
    password: string;

    @Prop({type:String})
    qualification: string;

    @Prop({type:String, required: true})
    date_de_recrutement: string;

    @Prop({type:String, required: true})
    telephone: string;

    @Prop({type:String, required: true})
    adresse: string;

    @Prop({type:String, required: true})
    poste: string;

    @Prop({type:String, required: true})
    nationalite: string;

    @Prop({type:String, required: true})
    nci: string;

    @Prop({type:String})
    npp: string;

    @Prop({type:String})
    matricule_de_solde: string;

    @Prop({type:String, required: true})
    genre: string;

    @Prop({type:String, required: true})
    civilite: string;

    @Prop({type:Number})
    nombre_de_parts: number;

    @Prop({type:Number})
    mensualite: number;

    @Prop({type:String, required: true})
    date_de_naissance: string;

    @Prop({type:String})
    date_de_fin_de_contrat: string;

    @Prop({type:String, required: true})
    lieu_de_naissance: string;

    @Prop({type:String})
    profile: string;

    @Prop({type: Types.ObjectId,ref: Categorie.name,autopopulate: true})
    categorie: Categorie;

    @Prop({type:Number, required: true, default: true})
    is_actif: number;

    @Prop({type:String,enum:TypeEmploye,default:TypeEmploye.CDD, required: true})
    type: string;
}


export const  EmployeSchema = SchemaFactory.createForClass(Employe);