import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SiteDocument = HydratedDocument<Site>;

@Schema({ timestamps: true })
export class Site {
    _id?: string;

    @Prop({ type: String, required: true })
    nom: string;

    @Prop({ type: String })
    adresse: string;

    @Prop({ type: String })
    ville: string;

    @Prop({ type: String })
    description: string;

    @Prop({ type: Boolean, default: true })
    est_actif: boolean;
}

export const SiteSchema = SchemaFactory.createForClass(Site);
