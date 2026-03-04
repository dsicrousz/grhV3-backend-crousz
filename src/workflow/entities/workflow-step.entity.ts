import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type WorkflowStepDocument = HydratedDocument<WorkflowStep>;

export enum WorkflowAction {
    APPROUVE = 'approuve',
    REJETE = 'rejete',
    EN_ATTENTE = 'en_attente',
    ANNULE = 'annule'
}

export enum WorkflowType {
    CONGE = 'conge',
    ABSENCE = 'absence'
}

export enum NiveauApprobation {
    CHEF_SERVICE = 'chef_service',
    CHEF_DIVISION = 'chef_division',
    DRH = 'drh',
    DIRECTEUR = 'directeur'
}

@Schema({ timestamps: true })
export class WorkflowStep {
    _id: string;

    @Prop({ type: String, required: true })
    demande_id: string;

    @Prop({ type: String, enum: WorkflowType, required: true })
    type_demande: WorkflowType;

    @Prop({ type: Number, required: true })
    ordre: number;

    @Prop({ type: String, enum: NiveauApprobation, required: true })
    niveau: NiveauApprobation;

    @Prop({ type: String, enum: WorkflowAction, default: WorkflowAction.EN_ATTENTE })
    action: WorkflowAction;

    @Prop({ type: String })
    validateur_id: string;

    @Prop({ type: String })
    validateur_nom: string;

    @Prop({ type: String })
    commentaire: string;

    @Prop({ type: Date })
    date_action: Date;

    @Prop({ type: Boolean, default: false })
    est_actif: boolean;
}

export const WorkflowStepSchema = SchemaFactory.createForClass(WorkflowStep);
