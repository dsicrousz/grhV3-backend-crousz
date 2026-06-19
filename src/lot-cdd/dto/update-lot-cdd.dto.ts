import { PartialType } from '@nestjs/mapped-types';
import { CreateLotCDDDto } from './create-lot-cdd.dto';

export class UpdateLotCDDDto extends PartialType(CreateLotCDDDto) {}
