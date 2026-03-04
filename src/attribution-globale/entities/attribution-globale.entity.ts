import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument} from "mongoose";
import { Rubrique } from "src/rubrique/entities/rubrique.entity";

export type AttributionGlobaleDocument = HydratedDocument<AttributionGlobale>;

@Schema({timestamps: true})
export class AttributionGlobale {
    
    _id: string;

    @Prop({type: mongoose.Schema.Types.ObjectId,ref: Rubrique.name, required: true, autopopulate: {maxDepth:2},unique: true})
    rubrique: Rubrique;

    @Prop({type: Number})
    valeur_par_defaut: number;
}

export const AttributionGlobaleSchema = SchemaFactory.createForClass(AttributionGlobale);