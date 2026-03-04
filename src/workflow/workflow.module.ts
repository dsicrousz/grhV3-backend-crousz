import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { WorkflowStep, WorkflowStepSchema } from './entities/workflow-step.entity';
import { WorkflowConfig, WorkflowConfigSchema } from './entities/workflow-config.entity';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: WorkflowStep.name, schema: WorkflowStepSchema },
            { name: WorkflowConfig.name, schema: WorkflowConfigSchema }
        ])
    ],
    controllers: [WorkflowController],
    providers: [WorkflowService],
    exports: [WorkflowService]
})
export class WorkflowModule {}
