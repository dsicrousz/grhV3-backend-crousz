import { PartialType } from '@nestjs/mapped-types';
import { CreateLotTemporaireDto } from './create-lot-temporaire.dto';

export class UpdateLotTemporaireDto extends PartialType(CreateLotTemporaireDto) {}
