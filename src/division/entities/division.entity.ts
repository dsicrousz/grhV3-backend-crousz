import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type DivisionDocument = HydratedDocument<Division>;

@Schema({timestamps: true})
export class Division {
    @Prop({type: String, required: true})
    nom: string;

    @Prop({type: Types.ObjectId,ref: Division.name})
    parent: string;

    @Prop({type: Boolean, default: true})
    is_active: boolean;
}

export const DivisionSchema = SchemaFactory.createForClass(Division);


