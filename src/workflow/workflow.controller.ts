import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowConfigDto, ProcessWorkflowDto } from './dto/create-workflow-step.dto';
import { NiveauApprobation, WorkflowType } from './entities/workflow-step.entity';

@Controller('workflow')
export class WorkflowController {
    constructor(private readonly workflowService: WorkflowService) {}

    @Post('config')
    createConfig(@Body() dto: CreateWorkflowConfigDto) {
        return this.workflowService.createConfig(dto);
    }

    @Get('config')
    getAllConfigs() {
        return this.workflowService.getAllConfigs();
    }

    @Get('config/:type')
    getConfig(@Param('type') type: WorkflowType) {
        return this.workflowService.getConfig(type);
    }

    @Patch('config/:id')
    updateConfig(@Param('id') id: string, @Body() dto: Partial<CreateWorkflowConfigDto>) {
        return this.workflowService.updateConfig(id, dto);
    }

    @Post('initialize/:demandeId')
    initializeWorkflow(
        @Param('demandeId') demandeId: string,
        @Body('type') type: WorkflowType
    ) {
        return this.workflowService.initializeWorkflow(demandeId, type);
    }

    @Get('status/:demandeId')
    getWorkflowStatus(@Param('demandeId') demandeId: string) {
        return this.workflowService.getWorkflowStatus(demandeId);
    }

    @Get('steps/:demandeId')
    getWorkflowSteps(@Param('demandeId') demandeId: string) {
        return this.workflowService.getWorkflowSteps(demandeId);
    }

    @Post('process/:demandeId')
    processStep(
        @Param('demandeId') demandeId: string,
        @Body() dto: ProcessWorkflowDto
    ) {
        return this.workflowService.processStep(demandeId, dto);
    }

    @Post('cancel/:demandeId')
    cancelWorkflow(
        @Param('demandeId') demandeId: string,
        @Body() body: { userId: string; userName: string; commentaire?: string }
    ) {
        return this.workflowService.cancelWorkflow(demandeId, body.userId, body.userName, body.commentaire);
    }

    @Get('pending/:niveau')
    getPendingByNiveau(
        @Param('niveau') niveau: NiveauApprobation,
        @Query('type') type?: WorkflowType
    ) {
        return this.workflowService.getPendingByNiveau(niveau, type);
    }

    @Get('history/validateur/:validateurId')
    getHistoryByValidateur(@Param('validateurId') validateurId: string) {
        return this.workflowService.getHistoryByValidateur(validateurId);
    }

    @Delete(':demandeId')
    deleteWorkflow(@Param('demandeId') demandeId: string) {
        return this.workflowService.deleteWorkflow(demandeId);
    }
}
