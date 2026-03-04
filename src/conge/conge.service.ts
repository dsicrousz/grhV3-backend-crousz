import { HttpException, Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { CreateCongeDto } from './dto/create-conge.dto';
import { UpdateCongeDto } from './dto/update-conge.dto';
import { ValidateCongeDto } from './dto/validate-conge.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Conge, CongeDocument, StatutDemandeConge } from './entities/conge.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkflowService, WorkflowStatus } from 'src/workflow/workflow.service';
import { WorkflowType, WorkflowAction } from 'src/workflow/entities/workflow-step.entity';

@Injectable()
export class CongeService extends AbstractModel<Conge, CreateCongeDto, UpdateCongeDto> {
  private readonly logger = new Logger(CongeService.name);

  constructor(
    @InjectModel(Conge.name) private readonly congeModel: Model<CongeDocument>,
    @Inject(forwardRef(() => WorkflowService)) private readonly workflowService: WorkflowService
  ) {
    super(congeModel);
  }

  async findByEmploye(employeId: string): Promise<Conge[]> {
    try {
      return this.congeModel.find({ employe: employeId } as any).sort({ createdAt: -1 });
    } catch (error) {
      this.logger.error(`Erreur lors de la recherche des congés pour l'employé ${employeId}`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async findByStatut(statut: StatutDemandeConge): Promise<Conge[]> {
    try {
      return this.congeModel.find({ statut }).sort({ createdAt: -1 });
    } catch (error) {
      this.logger.error(`Erreur lors de la recherche des congés par statut ${statut}`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async findPendingRequests(): Promise<Conge[]> {
    try {
      return this.congeModel.find({ statut: StatutDemandeConge.EN_ATTENTE }).sort({ createdAt: -1 });
    } catch (error) {
      this.logger.error('Erreur lors de la recherche des demandes de congé en attente', error);
      throw new HttpException(error.message, 500);
    }
  }

  async validateConge(id: string, validateDto: ValidateCongeDto): Promise<Conge> {
    try {
      const updateData = {
        statut: validateDto.statut,
        commentaire_validation: validateDto.commentaire_validation,
        valide_par: validateDto.valide_par,
        date_validation: new Date()
      };
      return this.congeModel.findByIdAndUpdate(id, updateData, { new: true });
    } catch (error) {
      this.logger.error(`Erreur lors de la validation du congé ${id}`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async findByEmployeAndPeriod(employeId: string, dateDebut: Date, dateFin: Date): Promise<Conge[]> {
    try {
      return this.congeModel.find({
        employe: employeId,
        $or: [
          { date_debut: { $gte: dateDebut, $lte: dateFin } },
          { date_fin: { $gte: dateDebut, $lte: dateFin } },
          { date_debut: { $lte: dateDebut }, date_fin: { $gte: dateFin } }
        ]
      } as any).sort({ date_debut: 1 });
    } catch (error) {
      this.logger.error(`Erreur lors de la recherche des congés par période`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async getStatsByEmploye(employeId: string): Promise<{ total: number; totalJours: number; approuvees: number; rejetees: number; enAttente: number }> {
    try {
      const conges = await this.congeModel.find({ employe: employeId } as any);
      const approuves = conges.filter(c => c.statut === StatutDemandeConge.APPROUVEE);
      return {
        total: conges.length,
        totalJours: approuves.reduce((sum, c) => sum + c.nombre_jours, 0),
        approuvees: approuves.length,
        rejetees: conges.filter(c => c.statut === StatutDemandeConge.REJETEE).length,
        enAttente: conges.filter(c => c.statut === StatutDemandeConge.EN_ATTENTE).length
      };
    } catch (error) {
      this.logger.error(`Erreur lors du calcul des statistiques pour l'employé ${employeId}`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async getSoldeConges(employeId: string, annee: number, quotaAnnuel: number = 30): Promise<{ quota: number; utilises: number; restants: number }> {
    try {
      const startOfYear = new Date(annee, 0, 1);
      const endOfYear = new Date(annee, 11, 31);
      
      const congesApprouves = await this.congeModel.find({
        employe: employeId,
        statut: StatutDemandeConge.APPROUVEE,
        date_debut: { $gte: startOfYear, $lte: endOfYear }
      } as any);

      const joursUtilises = congesApprouves.reduce((sum, c) => sum + c.nombre_jours, 0);
      
      return {
        quota: quotaAnnuel,
        utilises: joursUtilises,
        restants: quotaAnnuel - joursUtilises
      };
    } catch (error) {
      this.logger.error(`Erreur lors du calcul du solde de congés pour l'employé ${employeId}`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async createWithWorkflow(createCongeDto: CreateCongeDto): Promise<{ conge: Conge; workflow: WorkflowStatus }> {
    try {
      const conge = await this.create({
        ...createCongeDto,
        date_demande: new Date(),
        statut: StatutDemandeConge.EN_ATTENTE
      } as any);

      const steps = await this.workflowService.initializeWorkflow(conge._id.toString(), WorkflowType.CONGE);
      
      await this.congeModel.findByIdAndUpdate(conge._id, {
        workflow_initialise: true,
        etape_courante: 1,
        total_etapes: steps.length,
        niveau_courant: steps[0]?.niveau,
        statut: StatutDemandeConge.EN_COURS_VALIDATION
      });

      const workflowStatus = await this.workflowService.getWorkflowStatus(conge._id.toString());
      const updatedConge = await this.findOne(conge._id.toString());

      return { conge: updatedConge, workflow: workflowStatus };
    } catch (error) {
      this.logger.error('Erreur lors de la création du congé avec workflow', error);
      throw new HttpException(error.message, 500);
    }
  }

  async processWorkflowStep(congeId: string, action: WorkflowAction, validateurId: string, validateurNom: string, commentaire?: string): Promise<{ conge: Conge; workflow: WorkflowStatus }> {
    try {
      const workflowStatus = await this.workflowService.processStep(congeId, {
        action,
        validateur_id: validateurId,
        validateur_nom: validateurNom,
        commentaire
      });

      let newStatut: StatutDemandeConge;
      if (workflowStatus.statut_global === 'approuve') {
        newStatut = StatutDemandeConge.APPROUVEE;
      } else if (workflowStatus.statut_global === 'rejete') {
        newStatut = StatutDemandeConge.REJETEE;
      } else if (workflowStatus.statut_global === 'annule') {
        newStatut = StatutDemandeConge.ANNULEE;
      } else {
        newStatut = StatutDemandeConge.EN_COURS_VALIDATION;
      }

      await this.congeModel.findByIdAndUpdate(congeId, {
        statut: newStatut,
        etape_courante: workflowStatus.etape_courante,
        niveau_courant: workflowStatus.niveau_courant,
        ...(newStatut !== StatutDemandeConge.EN_COURS_VALIDATION && {
          date_validation: new Date(),
          valide_par: validateurNom,
          commentaire_validation: commentaire
        })
      });

      const updatedConge = await this.findOne(congeId);
      return { conge: updatedConge, workflow: workflowStatus };
    } catch (error) {
      this.logger.error(`Erreur lors du traitement de l'étape workflow pour le congé ${congeId}`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async cancelConge(congeId: string, userId: string, userName: string, commentaire?: string): Promise<{ conge: Conge; workflow: WorkflowStatus }> {
    try {
      const workflowStatus = await this.workflowService.cancelWorkflow(congeId, userId, userName, commentaire);

      await this.congeModel.findByIdAndUpdate(congeId, {
        statut: StatutDemandeConge.ANNULEE,
        date_validation: new Date(),
        valide_par: userName,
        commentaire_validation: commentaire || 'Demande annulée'
      });

      const updatedConge = await this.findOne(congeId);
      return { conge: updatedConge, workflow: workflowStatus };
    } catch (error) {
      this.logger.error(`Erreur lors de l'annulation du congé ${congeId}`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async getCongeWithWorkflow(congeId: string): Promise<{ conge: Conge; workflow: WorkflowStatus | null }> {
    try {
      const conge = await this.findOne(congeId);
      let workflow: WorkflowStatus | null = null;
      
      if (conge.workflow_initialise) {
        workflow = await this.workflowService.getWorkflowStatus(congeId);
      }

      return { conge, workflow };
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du congé avec workflow ${congeId}`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async findPendingByNiveau(niveau: string): Promise<Conge[]> {
    try {
      return this.congeModel.find({
        statut: StatutDemandeConge.EN_COURS_VALIDATION,
        niveau_courant: niveau
      }).sort({ createdAt: 1 });
    } catch (error) {
      this.logger.error(`Erreur lors de la recherche des congés en attente pour le niveau ${niveau}`, error);
      throw new HttpException(error.message, 500);
    }
  }
}
