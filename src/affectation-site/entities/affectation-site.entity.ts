import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Employe } from "src/employe/entities/employe.entity";
import { Site } from "src/site/entities/site.entity";
import { Division } from "src/division/entities/division.entity";
import { Service } from "src/service/entities/service.entity";

export type AffectationSiteDocument = HydratedDocument<AffectationSite>;

@Schema({ timestamps: true })
export class AffectationSite {
    _id?: string;

    @Prop({ type: Types.ObjectId, ref: Employe.name, required: true, autopopulate: true })
    employe: string;

    @Prop({ type: Types.ObjectId, ref: Site.name, required: true, autopopulate: true })
    site: string;

    @Prop({ type: Types.ObjectId, ref: Division.name, autopopulate: true })
    division: string;

    @Prop({ type: Types.ObjectId, ref: Service.name, autopopulate: true })
    service: string;

    @Prop({ type: Date, required: true })
    date_debut: Date;

    @Prop({ type: Date })
    date_fin: Date;

    @Prop({ type: String })
    description: string;

    @Prop({ type: Boolean, default: true })
    est_active: boolean;
}

export const AffectationSiteSchema = SchemaFactory.createForClass(AffectationSite);
