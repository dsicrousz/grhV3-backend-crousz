import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type PosteDocument = HydratedDocument<Poste>;

@Schema({ timestamps: true })
export class Poste {
    _id: string

    @Prop({ type: String, required: true, unique: true })
    nom: string;
}

export const PosteSchema = SchemaFactory.createForClass(Poste);
