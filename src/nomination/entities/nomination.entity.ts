import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Type } from "class-transformer";
import { HydratedDocument, Types } from "mongoose";
import { Division } from "src/division/entities/division.entity";
import { Employe } from "src/employe/entities/employe.entity";
import { Fonction } from "src/fonction/entities/fonction.entity";
import { Service } from "src/service/entities/service.entity";

export type NominationDocument = HydratedDocument<Nomination>

@Schema({timestamps: true})
export class Nomination {
    @Prop({type: Date, required: true})
    date: string;

    @Prop({type: String})
    description: string;

    @Prop({type: Boolean, required: true, default: true})
    est_active: boolean;

    @Prop({type: Types.ObjectId,ref:Employe.name, required: true, autopopulate: true})
    employe: string;

    @Prop({type: Types.ObjectId,ref: Fonction.name, required: true, autopopulate: true})
    @Type(()=> Fonction)
    fonction: Fonction;

    @Prop({type: Types.ObjectId,ref: Division.name, required: true, autopopulate: true})
    @Type(() => Division)
    division: Division;

    @Prop({type: Types.ObjectId,ref:Service.name, autopopulate: true})
    @Type(() => Service)
    service: Service;
}

export const NominationSchema = SchemaFactory.createForClass(Nomination);