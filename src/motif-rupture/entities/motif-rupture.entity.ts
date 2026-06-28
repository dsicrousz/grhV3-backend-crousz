import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MotifRuptureDocument = HydratedDocument<MotifRupture>;

@Schema({ timestamps: true })
export class MotifRupture {
    _id?: string;

    @Prop({ type: String, required: true })
    libelle: string;

    @Prop({ type: String })
    description?: string;
}

export const MotifRuptureSchema = SchemaFactory.createForClass(MotifRupture);
