import { PartialType } from '@nestjs/mapped-types';
import { CreateBulletinTemporaireDto } from './create-bulletin-temporaire.dto';

export class UpdateBulletinTemporaireDto extends PartialType(CreateBulletinTemporaireDto) {}
