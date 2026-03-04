import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AbsenceService } from './absence.service';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import { ValidateAbsenceDto } from './dto/validate-absence.dto';
import { StatutDemande } from './entities/absence.entity';
import { WorkflowAction } from 'src/workflow/entities/workflow-step.entity';

@Controller('absence')
export class AbsenceController {
  constructor(private readonly absenceService: AbsenceService) {}

  @Post()
  create(@Body() createAbsenceDto: CreateAbsenceDto) {
    return this.absenceService.create(createAbsenceDto);
  }

  @Get()
  findAll() {
    return this.absenceService.findAll();
  }

  @Get('pending')
  findPendingRequests() {
    return this.absenceService.findPendingRequests();
  }

  @Get('statut/:statut')
  findByStatut(@Param('statut') statut: StatutDemande) {
    return this.absenceService.findByStatut(statut);
  }

  @Get('employe/:employeId')
  findByEmploye(@Param('employeId') employeId: string) {
    return this.absenceService.findByEmploye(employeId);
  }

  @Get('employe/:employeId/stats')
  getStatsByEmploye(@Param('employeId') employeId: string) {
    return this.absenceService.getStatsByEmploye(employeId);
  }

  @Get('employe/:employeId/period')
  findByEmployeAndPeriod(
    @Param('employeId') employeId: string,
    @Query('dateDebut') dateDebut: string,
    @Query('dateFin') dateFin: string
  ) {
    return this.absenceService.findByEmployeAndPeriod(
      employeId,
      new Date(dateDebut),
      new Date(dateFin)
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.absenceService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAbsenceDto: UpdateAbsenceDto) {
    return this.absenceService.update(id, updateAbsenceDto);
  }

  @Patch(':id/validate')
  validateAbsence(@Param('id') id: string, @Body() validateAbsenceDto: ValidateAbsenceDto) {
    return this.absenceService.validateAbsence(id, validateAbsenceDto);
  }

  @Patch(':id/reject')
  rejectAbsence(@Param('id') id: string) {
    return this.absenceService.rejectAbsence(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.absenceService.remove(id);
  }

  @Post('workflow')
  createWithWorkflow(@Body() createAbsenceDto: CreateAbsenceDto) {
    return this.absenceService.createWithWorkflow(createAbsenceDto);
  }

  @Get(':id/workflow')
  getAbsenceWithWorkflow(@Param('id') id: string) {
    return this.absenceService.getAbsenceWithWorkflow(id);
  }

  @Post(':id/workflow/process')
  processWorkflowStep(
    @Param('id') id: string,
    @Body() body: { action: WorkflowAction; validateurId: string; validateurNom: string; commentaire?: string }
  ) {
    return this.absenceService.processWorkflowStep(id, body.action, body.validateurId, body.validateurNom, body.commentaire);
  }

  @Post(':id/workflow/cancel')
  cancelAbsence(
    @Param('id') id: string,
    @Body() body: { userId: string; userName: string; commentaire?: string }
  ) {
    return this.absenceService.cancelAbsence(id, body.userId, body.userName, body.commentaire);
  }

  @Get('workflow/pending/:niveau')
  findPendingByNiveau(@Param('niveau') niveau: string) {
    return this.absenceService.findPendingByNiveau(niveau);
  }
}
