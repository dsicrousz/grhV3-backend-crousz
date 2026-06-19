import { PartialType } from '@nestjs/mapped-types';
import { CreateBulletinCDDDto } from './create-bulletin-cdd.dto';

export class UpdateBulletinCDDDto extends PartialType(CreateBulletinCDDDto) {}
