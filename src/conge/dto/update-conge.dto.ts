import { PartialType } from '@nestjs/mapped-types';
import { CreateCongeDto } from './create-conge.dto';

export class UpdateCongeDto extends PartialType(CreateCongeDto) {}
