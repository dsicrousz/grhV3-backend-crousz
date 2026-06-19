import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Employe } from "src/employe/entities/employe.entity";
import { LotCDD } from "src/lot-cdd/entities/lot-cdd.entity";

export type BulletinCDDDocument = HydratedDocument<BulletinCDD>;

@Schema({ timestamps: true })
export class BulletinCDD {
    _id?: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Employe.name, required: true, autopopulate: true })
    employe: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: LotCDD.name, required: true, autopopulate: { maxDepth: 2 } })
    lot: string;

    @Prop({ type: Object, required: true })
    lignes: object;

    @Prop({ type: Number, required: true })
    totalIm: number;

    @Prop({ type: Number, required: true })
    totalNI: number;

    @Prop({ type: Number, required: true })
    totalRet: number;

    @Prop({ type: Number, required: true })
    totalPP: number;

    @Prop({ type: Number, required: true })
    nap: number;

    @Prop({ type: String })
    url?: string;
}

export const BulletinCDDSchema = SchemaFactory.createForClass(BulletinCDD);
