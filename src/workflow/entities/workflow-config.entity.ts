import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { NiveauApprobation, WorkflowType } from "./workflow-step.entity";

export type WorkflowConfigDocument = HydratedDocument<WorkflowConfig>;

@Schema({ timestamps: true })
export class WorkflowConfig {
    _id: string;

    @Prop({ type: String, enum: WorkflowType, required: true, unique: true })
    type_demande: WorkflowType;

    @Prop({ type: [String], enum: NiveauApprobation, required: true })
    niveaux_requis: NiveauApprobation[];

    @Prop({ type: Boolean, default: true })
    est_actif: boolean;

    @Prop({ type: String })
    description: string;
}

export const WorkflowConfigSchema = SchemaFactory.createForClass(WorkflowConfig);
