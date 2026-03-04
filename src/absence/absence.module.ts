import { Module, forwardRef } from '@nestjs/common';
import { AbsenceService } from './absence.service';
import { AbsenceController } from './absence.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Absence, AbsenceSchema } from './entities/absence.entity';
import { WorkflowModule } from 'src/workflow/workflow.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([{
      name: Absence.name,
      useFactory: () => {
        const schema = AbsenceSchema;
        schema.plugin(require('mongoose-autopopulate'));
        return schema;
      }
    }]),
    forwardRef(() => WorkflowModule)
  ],
  controllers: [AbsenceController],
  providers: [AbsenceService],
  exports: [AbsenceService]
})
export class AbsenceModule {}
