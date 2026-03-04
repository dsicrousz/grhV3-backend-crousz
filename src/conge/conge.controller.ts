import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CongeService } from './conge.service';
import { CreateCongeDto } from './dto/create-conge.dto';
import { UpdateCongeDto } from './dto/update-conge.dto';
import { ValidateCongeDto } from './dto/validate-conge.dto';
import { StatutDemandeConge } from './entities/conge.entity';
import { WorkflowAction } from 'src/workflow/entities/workflow-step.entity';

@Controller('conge')
export class CongeController {
  constructor(private readonly congeService: CongeService) {}

  @Post()
  create(@Body() createCongeDto: CreateCongeDto) {
    return this.congeService.create(createCongeDto);
  }

  @Get()
  findAll() {
    return this.congeService.findAll();
  }

  @Get('pending')
  findPendingRequests() {
    return this.congeService.findPendingRequests();
  }

  @Get('statut/:statut')
  findByStatut(@Param('statut') statut: StatutDemandeConge) {
    return this.congeService.findByStatut(statut);
  }

  @Get('employe/:employeId')
  findByEmploye(@Param('employeId') employeId: string) {
    return this.congeService.findByEmploye(employeId);
  }

  @Get('employe/:employeId/stats')
  getStatsByEmploye(@Param('employeId') employeId: string) {
    return this.congeService.getStatsByEmploye(employeId);
  }

  @Get('employe/:employeId/solde')
  getSoldeConges(
    @Param('employeId') employeId: string,
    @Query('annee') annee?: string,
    @Query('quota') quota?: string
  ) {
    const currentYear = new Date().getFullYear();
    return this.congeService.getSoldeConges(
      employeId,
      annee ? parseInt(annee) : currentYear,
      quota ? parseInt(quota) : 30
    );
  }

  @Get('employe/:employeId/period')
  findByEmployeAndPeriod(
    @Param('employeId') employeId: string,
    @Query('dateDebut') dateDebut: string,
    @Query('dateFin') dateFin: string
  ) {
    return this.congeService.findByEmployeAndPeriod(
      employeId,
      new Date(dateDebut),
      new Date(dateFin)
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.congeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCongeDto: UpdateCongeDto) {
    return this.congeService.update(id, updateCongeDto);
  }

  @Patch(':id/validate')
  validateConge(@Param('id') id: string, @Body() validateCongeDto: ValidateCongeDto) {
    return this.congeService.validateConge(id, validateCongeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.congeService.remove(id);
  }

  @Post('workflow')
  createWithWorkflow(@Body() createCongeDto: CreateCongeDto) {
    return this.congeService.createWithWorkflow(createCongeDto);
  }

  @Get(':id/workflow')
  getCongeWithWorkflow(@Param('id') id: string) {
    return this.congeService.getCongeWithWorkflow(id);
  }

  @Post(':id/workflow/process')
  processWorkflowStep(
    @Param('id') id: string,
    @Body() body: { action: WorkflowAction; validateurId: string; validateurNom: string; commentaire?: string }
  ) {
    return this.congeService.processWorkflowStep(id, body.action, body.validateurId, body.validateurNom, body.commentaire);
  }

  @Post(':id/workflow/cancel')
  cancelConge(
    @Param('id') id: string,
    @Body() body: { userId: string; userName: string; commentaire?: string }
  ) {
    return this.congeService.cancelConge(id, body.userId, body.userName, body.commentaire);
  }

  @Get('workflow/pending/:niveau')
  findPendingByNiveau(@Param('niveau') niveau: string) {
    return this.congeService.findPendingByNiveau(niveau);
  }
}
