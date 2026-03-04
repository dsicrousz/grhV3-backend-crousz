import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Employe } from "src/employe/entities/employe.entity";
import { Lot } from "src/lot/entities/lot.entity";

export type BulletinDocument = HydratedDocument<Bulletin>

@Schema({timestamps: true})
export class Bulletin {

    _id?: string;

    @Prop({type: mongoose.Schema.Types.ObjectId,ref: Employe.name,required: true,autopopulate: true})
    employe: string

    @Prop({type: mongoose.Schema.Types.ObjectId,ref: Lot.name,required: true,autopopulate: {maxDepth: 2}})
    lot: string

    @Prop({type: Object, required: true})
    lignes: object

    @Prop({type: Number, required: true})
    totalIm: number

    @Prop({type: Number, required: true})
    totalNI: number

    @Prop({type: Number, required: true})
    totalRet: number

    @Prop({type: Number, required: true})
    totalPP: number

    @Prop({type: Number, required: true})
    nap: number

    @Prop({type: String})
    url?: string
}

export const bulletinSchema = SchemaFactory.createForClass(Bulletin);
