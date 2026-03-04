import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type TypedocumentDocument = HydratedDocument<Typedocument>

@Schema({timestamps: true})
export class Typedocument {
    _id: string

    @Prop({type: String, required: true})
    nom: string;
}

export const TypedocumentSchema = SchemaFactory.createForClass(Typedocument);
