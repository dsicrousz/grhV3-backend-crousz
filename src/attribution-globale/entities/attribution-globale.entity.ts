import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument} from "mongoose";
import { Rubrique } from "src/rubrique/entities/rubrique.entity";
import { TypeContrat } from "src/contrat/entities/contrat.entity";

export type AttributionGlobaleDocument = HydratedDocument<AttributionGlobale>;

@Schema({timestamps: true})
export class AttributionGlobale {

    _id: string;

    @Prop({type: mongoose.Schema.Types.ObjectId,ref: Rubrique.name, required: true, autopopulate: {maxDepth:2}})
    rubrique: Rubrique;

    @Prop({type: Number})
    valeur_par_defaut: number;

    @Prop({type: String, enum: TypeContrat, required: true})
    type_contrat: TypeContrat;
}

export const AttributionGlobaleSchema = SchemaFactory.createForClass(AttributionGlobale).index({ rubrique: 1, type_contrat: 1 }, { unique: true });