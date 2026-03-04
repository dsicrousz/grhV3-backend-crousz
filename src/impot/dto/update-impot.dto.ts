import { PartialType } from '@nestjs/mapped-types';
import { CreateImpotDto } from './create-impot.dto';

export class UpdateImpotDto extends PartialType(CreateImpotDto) {}
