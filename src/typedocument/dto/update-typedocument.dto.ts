import { PartialType } from '@nestjs/mapped-types';
import { CreateTypedocumentDto } from './create-typedocument.dto';

export class UpdateTypedocumentDto extends PartialType(CreateTypedocumentDto) {}
