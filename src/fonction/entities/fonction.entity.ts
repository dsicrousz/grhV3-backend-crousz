import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type FonctionDocument = HydratedDocument<Fonction>;

@Schema({timestamps: true})
export class Fonction {
    _id: string

    @Prop({type: String, required: true, unique: true})
    nom: string;
}

export const FonctionSchema = SchemaFactory.createForClass(Fonction);
