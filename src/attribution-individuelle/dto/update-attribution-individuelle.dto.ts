import { PartialType } from '@nestjs/mapped-types';
import { CreateAttributionIndividuelleDto } from './create-attribution-individuelle.dto';

export class UpdateAttributionIndividuelleDto extends PartialType(CreateAttributionIndividuelleDto) {}
