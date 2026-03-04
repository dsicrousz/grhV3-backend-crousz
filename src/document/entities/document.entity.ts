import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Typedocument } from "src/typedocument/entities/typedocument.entity";

export type DocumentDocument = HydratedDocument<Document>

@Schema({timestamps: true})
export class Document {
    @Prop({type: String, required: true})
    url: string;

    @Prop({type: Types.ObjectId, ref:Typedocument.name, required: true})
    type: string;

    @Prop({type: String, required: true})
    nom: string;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);