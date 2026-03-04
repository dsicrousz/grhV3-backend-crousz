import { Injectable } from '@nestjs/common';
import { CreateTypedocumentDto } from './dto/create-typedocument.dto';
import { UpdateTypedocumentDto } from './dto/update-typedocument.dto';
import { AbstractModel } from 'src/packe/abstractmodel';
import { Typedocument, TypedocumentDocument } from './entities/typedocument.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class TypedocumentService extends AbstractModel<Typedocument,CreateTypedocumentDto,UpdateTypedocumentDto>{
  constructor(@InjectModel(Typedocument.name) private readonly typedocumentModel: Model<TypedocumentDocument>){
    super(typedocumentModel);
  }
}
