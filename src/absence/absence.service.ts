import { HttpException, Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import { ValidateAbsenceDto } from './dto/validate-absence.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Absence, AbsenceDocument, StatutDemande } from './entities/absence.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkflowService, WorkflowStatus } from 'src/workflow/workflow.service';
import { WorkflowType, WorkflowAction } from 'src/workflow/entities/workflow-step.entity';

@Injectable()
export class AbsenceService extends AbstractModel<Absence, CreateAbsenceDto, UpdateAbsenceDto> {
  private readonly logger = new Logger(AbsenceService.name);

  constructor(
    @InjectModel(Absence.name) private readonly absenceModel: Model<AbsenceDocument>,
    @Inject(forwardRef(() => WorkflowService)) private readonly workflowService: WorkflowService
  ) {
    super(absenceModel);
  }

  async findByEmploye(employeId: string): Promise<Absence[]> {
    try {
      return this.absenceModel.find({ employe: employeId } as any).sort({ createdAt: -1 });
    } catch (error) {
      this.logger.error(`Erreur lors de la recherche des absences pour l'employé ${employeId}`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async findByStatut(statut: StatutDemande): Promise<Absence[]> {
    try {
      return this.absenceModel.find({ statut }).sort({ createdAt: -1 });
    } catch (error) {
      this.logger.error(`Erreur lors de la recherche des absences par statut ${statut}`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async findPendingRequests(): Promise<Absence[]> {
    try {
      return this.absenceModel.find({ statut: StatutDemande.EN_ATTENTE }).sort({ createdAt: -1 });
    } catch (error) {
      this.logger.error('Erreur lors de la recherche des demandes en attente', error);
      throw new HttpException(error.message, 500);
    }
  }

  async validateAbsence(id: string, validateDto: ValidateAbsenceDto): Promise<Absence> {
    try {
      const updateData = {
        statut: validateDto.statut,
        commentaire_validation: validateDto.commentaire_validation,
        valide_par: validateDto.valide_par,
        date_validation: new Date()
      };
      return this.absenceModel.findByIdAndUpdate(id, updateData, { new: true });
    } catch (error) {
      this.logger.error(`Erreur lors de la validation de l'absence ${id}`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async rejectAbsence(id: string): Promise<Absence> {
    try {
      return this.absenceModel.findByIdAndUpdate(id, { statut: StatutDemande.REJETEE });
    } catch (error) {
      this.logger.error(`Erreur lors de la validation de l'absence ${id}`, error);
      throw new HttpException(error.message, 500);
    }
  }


  async findByEmployeAndPeriod(employeId: string, dateDebut: Date, dateFin: Date): Promise<Absence[]> {
    try {
      return this.absenceModel.find({
        employe: employeId,
        $or: [
          { date_debut: { $gte: dateDebut, $lte: dateFin } },
          { date_fin: { $gte: dateDebut, $lte: dateFin } },
          { date_debut: { $lte: dateDebut }, date_fin: { $gte: dateFin } }
        ]
      } as any).sort({ date_debut: 1 });
    } catch (error) {
      this.logger.error(`Erreur lors de la recherche des absences par période`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async getStatsByEmploye(employeId: string): Promise<{ total: number; approuvees: number; rejetees: number; enAttente: number }> {
    try {
      const absences = await this.absenceModel.find({ employe: employeId } as any);
      return {
        total: absences.length,
        approuvees: absences.filter(a => a.statut === StatutDemande.APPROUVEE).length,
        rejetees: absences.filter(a => a.statut === StatutDemande.REJETEE).length,
        enAttente: absences.filter(a => a.statut === StatutDemande.EN_ATTENTE).length
      };
    } catch (error) {
      this.logger.error(`Erreur lors du calcul des statistiques pour l'employé ${employeId}`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async createWithWorkflow(createAbsenceDto: CreateAbsenceDto): Promise<{ absence: Absence; workflow: WorkflowStatus }> {
    try {
      const absence = await this.create({
        ...createAbsenceDto,
        statut: StatutDemande.EN_ATTENTE
      } as any);

      const steps = await this.workflowService.initializeWorkflow(absence._id.toString(), WorkflowType.ABSENCE);
      
      await this.absenceModel.findByIdAndUpdate(absence._id, {
        workflow_initialise: true,
        etape_courante: 1,
        total_etapes: steps.length,
        niveau_courant: steps[0]?.niveau,
        statut: StatutDemande.EN_COURS_VALIDATION
      });

      const workflowStatus = await this.workflowService.getWorkflowStatus(absence._id.toString());
      const updatedAbsence = await this.findOne(absence._id.toString());

      return { absence: updatedAbsence, workflow: workflowStatus };
    } catch (error) {
      this.logger.error('Erreur lors de la création de l\'absence avec workflow', error);
      throw new HttpException(error.message, 500);
    }
  }

  async processWorkflowStep(absenceId: string, action: WorkflowAction, validateurId: string, validateurNom: string, commentaire?: string): Promise<{ absence: Absence; workflow: WorkflowStatus }> {
    try {
      const workflowStatus = await this.workflowService.processStep(absenceId, {
        action,
        validateur_id: validateurId,
        validateur_nom: validateurNom,
        commentaire
      });

      let newStatut: StatutDemande;
      if (workflowStatus.statut_global === 'approuve') {
        newStatut = StatutDemande.APPROUVEE;
      } else if (workflowStatus.statut_global === 'rejete') {
        newStatut = StatutDemande.REJETEE;
      } else if (workflowStatus.statut_global === 'annule') {
        newStatut = StatutDemande.ANNULEE;
      } else {
        newStatut = StatutDemande.EN_COURS_VALIDATION;
      }

      await this.absenceModel.findByIdAndUpdate(absenceId, {
        statut: newStatut,
        etape_courante: workflowStatus.etape_courante,
        niveau_courant: workflowStatus.niveau_courant,
        ...(newStatut !== StatutDemande.EN_COURS_VALIDATION && {
          date_validation: new Date(),
          valide_par: validateurNom,
          commentaire_validation: commentaire
        })
      });

      const updatedAbsence = await this.findOne(absenceId);
      return { absence: updatedAbsence, workflow: workflowStatus };
    } catch (error) {
      this.logger.error(`Erreur lors du traitement de l'étape workflow pour l'absence ${absenceId}`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async cancelAbsence(absenceId: string, userId: string, userName: string, commentaire?: string): Promise<{ absence: Absence; workflow: WorkflowStatus }> {
    try {
      const workflowStatus = await this.workflowService.cancelWorkflow(absenceId, userId, userName, commentaire);

      await this.absenceModel.findByIdAndUpdate(absenceId, {
        statut: StatutDemande.ANNULEE,
        date_validation: new Date(),
        valide_par: userName,
        commentaire_validation: commentaire || 'Demande annulée'
      });

      const updatedAbsence = await this.findOne(absenceId);
      return { absence: updatedAbsence, workflow: workflowStatus };
    } catch (error) {
      this.logger.error(`Erreur lors de l'annulation de l'absence ${absenceId}`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async getAbsenceWithWorkflow(absenceId: string): Promise<{ absence: Absence; workflow: WorkflowStatus | null }> {
    try {
      const absence = await this.findOne(absenceId);
      let workflow: WorkflowStatus | null = null;
      
      if (absence.workflow_initialise) {
        workflow = await this.workflowService.getWorkflowStatus(absenceId);
      }

      return { absence, workflow };
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération de l'absence avec workflow ${absenceId}`, error);
      throw new HttpException(error.message, 500);
    }
  }

  async findPendingByNiveau(niveau: string): Promise<Absence[]> {
    try {
      return this.absenceModel.find({
        statut: StatutDemande.EN_COURS_VALIDATION,
        niveau_courant: niveau
      }).sort({ createdAt: 1 });
    } catch (error) {
      this.logger.error(`Erreur lors de la recherche des absences en attente pour le niveau ${niveau}`, error);
      throw new HttpException(error.message, 500);
    }
  }
}
