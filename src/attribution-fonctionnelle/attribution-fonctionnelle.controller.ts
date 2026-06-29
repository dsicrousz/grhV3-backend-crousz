import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AttributionFonctionnelleService } from './attribution-fonctionnelle.service';
import { CreateAttributionFonctionnelleDto } from './dto/create-attribution-fonctionnelle.dto';
import { UpdateAttributionFonctionnelleDto } from './dto/update-attribution-fonctionnelle.dto';
import { ExclusionSpecifiqueService } from 'src/exclusion-specifique/exclusion-specifique.service';
import { NominationService } from 'src/nomination/nomination.service';
import { differenceBy, flattenDeep } from 'lodash';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('attribution-fonctionnelle')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class AttributionFonctionnelleController {
  constructor(
    private readonly attributionFonctionnelleService: AttributionFonctionnelleService,
    private readonly exclusionSpecifiqueService: ExclusionSpecifiqueService,
    private readonly nominationService: NominationService,
    ) {}

  @Post()
  @UserHasPermission({ permission: { attribution: ['create'] } })
  create(@Body() createAttributionFonctionnelleDto: CreateAttributionFonctionnelleDto) {
    return this.attributionFonctionnelleService.create(createAttributionFonctionnelleDto);
  }

  @Get()
  @UserHasPermission({ permission: { attribution: ['list'] } })
  findAll() {
    return this.attributionFonctionnelleService.findAll();
  }

  @Get('byemploye/:id')
  @UserHasPermission({ permission: { attribution: ['read'] } })
  async findByEmploye(@Param('id') id: string) {
   const [nomactive,excs] = await Promise.all([
    this.nominationService.findActiveByEmploye(id),
    this.exclusionSpecifiqueService.findByEmploye(id)
   ]);
   const att =  Promise.all(flattenDeep(nomactive.map(async (n) => {
    const attF = await this.attributionFonctionnelleService.findByFonction(n.fonction._id.toString());
    return differenceBy(attF,excs,(v) => v.rubrique._id);
   })));
   return att;
   
  }

  @Get(':id')
  @UserHasPermission({ permission: { attribution: ['read'] } })
  findOne(@Param('id') id: string) {
    return this.attributionFonctionnelleService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { attribution: ['update'] } })
  update(@Param('id') id: string, @Body() updateAttributionFonctionnelleDto: UpdateAttributionFonctionnelleDto) {
    return this.attributionFonctionnelleService.update(id, updateAttributionFonctionnelleDto);
  }

  @Delete(':id')
  @UserHasPermission({ permission: { attribution: ['delete'] } })
  remove(@Param('id') id: string) {
    return this.attributionFonctionnelleService.remove(id);
  }
}
