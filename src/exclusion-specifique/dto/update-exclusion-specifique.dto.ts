import { PartialType } from '@nestjs/mapped-types';
import { CreateExclusionSpecifiqueDto } from './create-exclusion-specifique.dto';

export class UpdateExclusionSpecifiqueDto extends PartialType(CreateExclusionSpecifiqueDto) {}
