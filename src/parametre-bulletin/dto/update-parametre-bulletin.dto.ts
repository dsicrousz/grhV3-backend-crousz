import { PartialType } from '@nestjs/mapped-types';
import { CreateParametreBulletinDto } from './create-parametre-bulletin.dto';

export class UpdateParametreBulletinDto extends PartialType(CreateParametreBulletinDto) {}
