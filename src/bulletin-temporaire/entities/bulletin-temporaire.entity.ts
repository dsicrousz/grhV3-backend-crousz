import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { LotTemporaire } from "src/lot-temporaire/entities/lot-temporaire.entity";
export type BulletinTemporaireDocument = HydratedDocument<BulletinTemporaire>;

@Schema({ timestamps: true })
export class BulletinTemporaire {
    _id?: string;

    @Prop({ type: Types.ObjectId, required: true })
    employe: string;

    @Prop({ type: Types.ObjectId, ref: LotTemporaire.name, required: true })
    lot: string;

    @Prop({ type: Number, default: 0 })
    nap: number;

}

export const BulletinTemporaireSchema = SchemaFactory.createForClass(BulletinTemporaire);
