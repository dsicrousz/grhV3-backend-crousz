import { PartialType } from '@nestjs/mapped-types';
import { CreateAttributionGlobaleDto } from './create-attribution-globale.dto';

export class UpdateAttributionGlobaleDto extends PartialType(CreateAttributionGlobaleDto) {}
