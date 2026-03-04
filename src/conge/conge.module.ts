import { Module, forwardRef } from '@nestjs/common';
import { CongeService } from './conge.service';
import { CongeController } from './conge.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Conge, CongeSchema } from './entities/conge.entity';
import { WorkflowModule } from 'src/workflow/workflow.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([{
      name: Conge.name,
      useFactory: () => {
        const schema = CongeSchema;
        schema.plugin(require('mongoose-autopopulate'));
        return schema;
      }
    }]),
    forwardRef(() => WorkflowModule)
  ],
  controllers: [CongeController],
  providers: [CongeService],
  exports: [CongeService]
})
export class CongeModule {}
