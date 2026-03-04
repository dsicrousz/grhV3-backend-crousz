import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AttributionFonctionnelleService } from './attribution-fonctionnelle.service';
import { CreateAttributionFonctionnelleDto } from './dto/create-attribution-fonctionnelle.dto';
import { UpdateAttributionFonctionnelleDto } from './dto/update-attribution-fonctionnelle.dto';
import { ExclusionSpecifiqueService } from 'src/exclusion-specifique/exclusion-specifique.service';
import { NominationService } from 'src/nomination/nomination.service';
import { differenceBy, flattenDeep } from 'lodash';

@Controller('attribution-fonctionnelle')
export class AttributionFonctionnelleController {
  constructor(
    private readonly attributionFonctionnelleService: AttributionFonctionnelleService,
    private readonly exclusionSpecifiqueService: ExclusionSpecifiqueService,
    private readonly nominationService: NominationService,
    ) {}

  @Post()
  create(@Body() createAttributionFonctionnelleDto: CreateAttributionFonctionnelleDto) {
    return this.attributionFonctionnelleService.create(createAttributionFonctionnelleDto);
  }

  @Get()
  findAll() {
    return this.attributionFonctionnelleService.findAll();
  }

  @Get('byemploye/:id')
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
  findOne(@Param('id') id: string) {
    return this.attributionFonctionnelleService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAttributionFonctionnelleDto: UpdateAttributionFonctionnelleDto) {
    return this.attributionFonctionnelleService.update(id, updateAttributionFonctionnelleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attributionFonctionnelleService.remove(id);
  }
}
