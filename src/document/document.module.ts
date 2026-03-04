import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Document, DocumentSchema } from './entities/document.entity';

@Module({
  imports:[MongooseModule.forFeature([{name: Document.name,schema: DocumentSchema}])],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
