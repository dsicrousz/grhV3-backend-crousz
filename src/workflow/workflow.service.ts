import { HttpException, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkflowStep, WorkflowStepDocument, WorkflowAction, WorkflowType, NiveauApprobation } from './entities/workflow-step.entity';
import { WorkflowConfig, WorkflowConfigDocument } from './entities/workflow-config.entity';
import { CreateWorkflowStepDto, ProcessWorkflowDto, CreateWorkflowConfigDto } from './dto/create-workflow-step.dto';

export interface WorkflowStatus {
    demande_id: string;
    type_demande: WorkflowType;
    statut_global: 'en_attente' | 'approuve' | 'rejete' | 'annule';
    etape_courante: number;
    total_etapes: number;
    niveau_courant: NiveauApprobation | null;
    etapes: WorkflowStep[];
}

@Injectable()
export class WorkflowService {
    private readonly logger = new Logger(WorkflowService.name);

    constructor(
        @InjectModel(WorkflowStep.name) private readonly workflowStepModel: Model<WorkflowStepDocument>,
        @InjectModel(WorkflowConfig.name) private readonly workflowConfigModel: Model<WorkflowConfigDocument>
    ) {}

    async createConfig(dto: CreateWorkflowConfigDto): Promise<WorkflowConfig> {
        try {
            const config = new this.workflowConfigModel({ ...dto, est_actif: true });
            return config.save();
        } catch (error) {
            this.logger.error('Erreur lors de la création de la configuration workflow', error);
            throw new HttpException(error.message, 500);
        }
    }

    async getConfig(type: WorkflowType): Promise<WorkflowConfig> {
        try {
            const config = await this.workflowConfigModel.findOne({ type_demande: type, est_actif: true });
            if (!config) {
                throw new NotFoundException(`Configuration workflow non trouvée pour ${type}`);
            }
            return config;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error('Erreur lors de la récupération de la configuration workflow', error);
            throw new HttpException(error.message, 500);
        }
    }

    async getAllConfigs(): Promise<WorkflowConfig[]> {
        try {
            return this.workflowConfigModel.find({ est_actif: true });
        } catch (error) {
            this.logger.error('Erreur lors de la récupération des configurations workflow', error);
            throw new HttpException(error.message, 500);
        }
    }

    async updateConfig(id: string, dto: Partial<CreateWorkflowConfigDto>): Promise<WorkflowConfig> {
        try {
            return this.workflowConfigModel.findByIdAndUpdate(id, dto, { new: true });
        } catch (error) {
            this.logger.error('Erreur lors de la mise à jour de la configuration workflow', error);
            throw new HttpException(error.message, 500);
        }
    }

    async initializeWorkflow(demandeId: string, type: WorkflowType): Promise<WorkflowStep[]> {
        try {
            const config = await this.getConfig(type);
            const steps: WorkflowStep[] = [];

            for (let i = 0; i < config.niveaux_requis.length; i++) {
                const stepDto: CreateWorkflowStepDto = {
                    demande_id: demandeId,
                    type_demande: type,
                    ordre: i + 1,
                    niveau: config.niveaux_requis[i],
                    action: WorkflowAction.EN_ATTENTE
                };

                const step = new this.workflowStepModel({
                    ...stepDto,
                    est_actif: i === 0
                });
                const savedStep = await step.save();
                steps.push(savedStep);
            }

            return steps;
        } catch (error) {
            this.logger.error(`Erreur lors de l'initialisation du workflow pour ${demandeId}`, error);
            throw new HttpException(error.message, 500);
        }
    }

    async getWorkflowSteps(demandeId: string): Promise<WorkflowStep[]> {
        try {
            return this.workflowStepModel.find({ demande_id: demandeId }).sort({ ordre: 1 });
        } catch (error) {
            this.logger.error(`Erreur lors de la récupération des étapes workflow pour ${demandeId}`, error);
            throw new HttpException(error.message, 500);
        }
    }

    async getWorkflowStatus(demandeId: string): Promise<WorkflowStatus> {
        try {
            const steps = await this.getWorkflowSteps(demandeId);
            
            if (steps.length === 0) {
                throw new NotFoundException(`Workflow non trouvé pour la demande ${demandeId}`);
            }

            const rejectedStep = steps.find(s => s.action === WorkflowAction.REJETE);
            const cancelledStep = steps.find(s => s.action === WorkflowAction.ANNULE);
            const allApproved = steps.every(s => s.action === WorkflowAction.APPROUVE);
            const currentStep = steps.find(s => s.est_actif);

            let statut_global: 'en_attente' | 'approuve' | 'rejete' | 'annule';
            if (cancelledStep) {
                statut_global = 'annule';
            } else if (rejectedStep) {
                statut_global = 'rejete';
            } else if (allApproved) {
                statut_global = 'approuve';
            } else {
                statut_global = 'en_attente';
            }

            return {
                demande_id: demandeId,
                type_demande: steps[0].type_demande,
                statut_global,
                etape_courante: currentStep?.ordre || steps.length,
                total_etapes: steps.length,
                niveau_courant: currentStep?.niveau || null,
                etapes: steps
            };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            this.logger.error(`Erreur lors de la récupération du statut workflow pour ${demandeId}`, error);
            throw new HttpException(error.message, 500);
        }
    }

    async processStep(demandeId: string, dto: ProcessWorkflowDto): Promise<WorkflowStatus> {
        try {
            const steps = await this.getWorkflowSteps(demandeId);
            const currentStep = steps.find(s => s.est_actif);

            if (!currentStep) {
                throw new BadRequestException('Aucune étape active trouvée pour cette demande');
            }

            currentStep.action = dto.action;
            currentStep.validateur_id = dto.validateur_id;
            currentStep.validateur_nom = dto.validateur_nom;
            currentStep.commentaire = dto.commentaire;
            currentStep.date_action = new Date();
            currentStep.est_actif = false;

            await this.workflowStepModel.findByIdAndUpdate(currentStep._id, currentStep);

            if (dto.action === WorkflowAction.APPROUVE) {
                const nextStep = steps.find(s => s.ordre === currentStep.ordre + 1);
                if (nextStep) {
                    await this.workflowStepModel.findByIdAndUpdate(nextStep._id, { est_actif: true });
                }
            }

            return this.getWorkflowStatus(demandeId);
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            this.logger.error(`Erreur lors du traitement de l'étape workflow pour ${demandeId}`, error);
            throw new HttpException(error.message, 500);
        }
    }

    async cancelWorkflow(demandeId: string, userId: string, userName: string, commentaire?: string): Promise<WorkflowStatus> {
        try {
            const steps = await this.getWorkflowSteps(demandeId);
            const currentStep = steps.find(s => s.est_actif);

            if (currentStep) {
                await this.workflowStepModel.findByIdAndUpdate(currentStep._id, {
                    action: WorkflowAction.ANNULE,
                    validateur_id: userId,
                    validateur_nom: userName,
                    commentaire: commentaire || 'Demande annulée',
                    date_action: new Date(),
                    est_actif: false
                });
            }

            return this.getWorkflowStatus(demandeId);
        } catch (error) {
            this.logger.error(`Erreur lors de l'annulation du workflow pour ${demandeId}`, error);
            throw new HttpException(error.message, 500);
        }
    }

    async getPendingByNiveau(niveau: NiveauApprobation, type?: WorkflowType): Promise<WorkflowStep[]> {
        try {
            const filter: any = {
                niveau,
                est_actif: true,
                action: WorkflowAction.EN_ATTENTE
            };
            if (type) {
                filter.type_demande = type;
            }
            return this.workflowStepModel.find(filter).sort({ createdAt: 1 });
        } catch (error) {
            this.logger.error(`Erreur lors de la récupération des demandes en attente pour ${niveau}`, error);
            throw new HttpException(error.message, 500);
        }
    }

    async getHistoryByValidateur(validateurId: string): Promise<WorkflowStep[]> {
        try {
            return this.workflowStepModel.find({ 
                validateur_id: validateurId,
                action: { $ne: WorkflowAction.EN_ATTENTE }
            }).sort({ date_action: -1 });
        } catch (error) {
            this.logger.error(`Erreur lors de la récupération de l'historique pour ${validateurId}`, error);
            throw new HttpException(error.message, 500);
        }
    }

    async deleteWorkflow(demandeId: string): Promise<void> {
        try {
            await this.workflowStepModel.deleteMany({ demande_id: demandeId });
        } catch (error) {
            this.logger.error(`Erreur lors de la suppression du workflow pour ${demandeId}`, error);
            throw new HttpException(error.message, 500);
        }
    }
}
