import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ImpotDocument = HydratedDocument<Impot>;

@Schema({timestamps: true})
export class Impot {

    @Prop({type: Number, required: true})
    vals: number;

    @Prop({type: Number, required: true})
    trimf: number;

    @Prop({type: Number, required: true})
    p1: number;

    @Prop({type: Number, required: true})
    p2: number;

    @Prop({type: Number, required: true})
    p3: number;

    @Prop({type: Number, required: true})
    p4: number;

    @Prop({type: Number, required: true})
    p5: number;

    @Prop({type: Number, required: true})
    p6: number;

    @Prop({type: Number, required: true})
    p7: number;

    @Prop({type: Number, required: true})
    p8: number;

    @Prop({type: Number, required: true})
    p9: number;

}

export const ImpotSchema = SchemaFactory.createForClass(Impot);
