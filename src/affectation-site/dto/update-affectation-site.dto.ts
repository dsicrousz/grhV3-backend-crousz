import { PartialType } from '@nestjs/mapped-types';
import { CreateAffectationSiteDto } from './create-affectation-site.dto';

export class UpdateAffectationSiteDto extends PartialType(CreateAffectationSiteDto) {}
