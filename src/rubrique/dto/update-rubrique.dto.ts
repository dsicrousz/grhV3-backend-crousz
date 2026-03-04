import { PartialType } from '@nestjs/mapped-types';
import { CreateRubriqueDto } from './create-rubrique.dto';

export class UpdateRubriqueDto extends PartialType(CreateRubriqueDto) {}
