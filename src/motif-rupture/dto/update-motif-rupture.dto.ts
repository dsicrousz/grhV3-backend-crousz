import { PartialType } from '@nestjs/mapped-types';
import { CreateMotifRuptureDto } from './create-motif-rupture.dto';

export class UpdateMotifRuptureDto extends PartialType(CreateMotifRuptureDto) {}
