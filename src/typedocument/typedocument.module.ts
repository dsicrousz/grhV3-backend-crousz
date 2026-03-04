import { Module } from '@nestjs/common';
import { TypedocumentService } from './typedocument.service';
import { TypedocumentController } from './typedocument.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Typedocument, TypedocumentSchema } from './entities/typedocument.entity';

@Module({
  imports:[MongooseModule.forFeature([{name: Typedocument.name,schema: TypedocumentSchema}])],
  controllers: [TypedocumentController],
  providers: [TypedocumentService],
})
export class TypedocumentModule {}
