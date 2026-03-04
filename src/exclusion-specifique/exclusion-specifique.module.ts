import { Module } from '@nestjs/common';
import { ExclusionSpecifiqueService } from './exclusion-specifique.service';
import { ExclusionSpecifiqueController } from './exclusion-specifique.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ExclusionSpecifique, ExclusionSpecifiqueSchema } from './entities/exclusion-specifique.entity';

@Module({
  imports:[MongooseModule.forFeatureAsync([{name: ExclusionSpecifique.name,useFactory:() =>{
    const schema =  ExclusionSpecifiqueSchema;
    schema.plugin(require('mongoose-autopopulate'));
    return schema;
  }}])],
  controllers: [ExclusionSpecifiqueController],
  providers: [ExclusionSpecifiqueService],
  exports:[ExclusionSpecifiqueService]
})
export class ExclusionSpecifiqueModule {}
