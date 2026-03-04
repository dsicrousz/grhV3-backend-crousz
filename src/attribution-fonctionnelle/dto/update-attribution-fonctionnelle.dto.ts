import { PartialType } from '@nestjs/mapped-types';
import { CreateAttributionFonctionnelleDto } from './create-attribution-fonctionnelle.dto';

export class UpdateAttributionFonctionnelleDto extends PartialType(CreateAttributionFonctionnelleDto) {}
