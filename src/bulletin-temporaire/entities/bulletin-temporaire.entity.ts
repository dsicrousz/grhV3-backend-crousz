import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Figuration } from "src/figuration/entities/figuration.entity";

export type BulletinTemporaireDocument = HydratedDocument<BulletinTemporaire>;

@Schema({ timestamps: true })
export class BulletinTemporaire {
    _id?: string;

    @Prop({ type: Types.ObjectId, required: true })
    employe: string;

    @Prop({ type: Types.ObjectId, required: true })
    lot: string;

    @Prop({
        type: {
            gains: [{ type: Object }],
            retenues: [{ type: Object }],
        },
        default: { gains: [], retenues: [] },
    })
    lignes: { gains: Figuration[]; retenues: Figuration[] };

    @Prop({ type: Number, default: 0 })
    totalIm: number;

    @Prop({ type: Number, default: 0 })
    totalNI: number;

    @Prop({ type: Number, default: 0 })
    totalRet: number;

    @Prop({ type: Number, default: 0 })
    totalPP: number;

    @Prop({ type: Number, default: 0 })
    nap: number;

    @Prop({ type: String })
    url: string;
}

export const BulletinTemporaireSchema = SchemaFactory.createForClass(BulletinTemporaire);
