import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ParametreBulletinDocument = HydratedDocument<ParametreBulletin>;

@Schema({ timestamps: true })
export class ParametreBulletin {
    _id?: string;

    @Prop({ type: Number, required: true, unique: true })
    annee: number;

    @Prop({ type: String, required: true })
    couleur: string;
}

export const ParametreBulletinSchema = SchemaFactory.createForClass(ParametreBulletin);
