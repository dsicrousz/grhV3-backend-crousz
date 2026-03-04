import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString } from "class-validator";
import { NiveauApprobation, WorkflowAction, WorkflowType } from "../entities/workflow-step.entity";

export class CreateWorkflowStepDto {
    @IsMongoId()
    demande_id: string;

    @IsEnum(WorkflowType)
    type_demande: WorkflowType;

    @IsNumber()
    ordre: number;

    @IsEnum(NiveauApprobation)
    niveau: NiveauApprobation;

    @IsOptional()
    @IsEnum(WorkflowAction)
    action?: WorkflowAction;

    @IsOptional()
    @IsString()
    validateur_id?: string;

    @IsOptional()
    @IsString()
    validateur_nom?: string;

    @IsOptional()
    @IsString()
    commentaire?: string;
}

export class ProcessWorkflowDto {
    @IsEnum(WorkflowAction)
    action: WorkflowAction;

    @IsString()
    validateur_id: string;

    @IsString()
    validateur_nom: string;

    @IsOptional()
    @IsString()
    commentaire?: string;
}

export class CreateWorkflowConfigDto {
    @IsEnum(WorkflowType)
    type_demande: WorkflowType;

    @IsEnum(NiveauApprobation, { each: true })
    niveaux_requis: NiveauApprobation[];

    @IsOptional()
    @IsString()
    description?: string;
}
