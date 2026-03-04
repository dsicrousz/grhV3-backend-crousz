import { Injectable } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Document, DocumentDocument } from './entities/document.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class DocumentService extends AbstractModel<Document,CreateDocumentDto,UpdateDocumentDto>{
  constructor(@InjectModel(Document.name) private readonly documentModel: Model<DocumentDocument>){
   super(documentModel);
  }
}
