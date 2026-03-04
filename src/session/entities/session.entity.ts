import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SessionDocument = HydratedDocument<Session>;

@Schema({timestamps: true})
export class Session {
    _id: string

    @Prop({type: String, required: true})
    nom: string;

    @Prop({type: String})
    description: string;

    @Prop({type: Boolean, required: true, default: true})
    est_active: boolean;

    @Prop({type: Date})
    date_debut: Date;

    @Prop({type: Date})
    date_fin: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);