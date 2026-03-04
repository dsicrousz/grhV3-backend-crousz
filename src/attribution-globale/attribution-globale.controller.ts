import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AttributionGlobaleService } from './attribution-globale.service';
import { CreateAttributionGlobaleDto } from './dto/create-attribution-globale.dto';
import { UpdateAttributionGlobaleDto } from './dto/update-attribution-globale.dto';
import { ExclusionSpecifiqueService } from 'src/exclusion-specifique/exclusion-specifique.service';
import { differenceBy } from 'lodash';

@Controller('attribution-globale')
export class AttributionGlobaleController {
  constructor(
    private readonly attributionGlobaleService: AttributionGlobaleService,
    private readonly exclusionSpecifiqueService: ExclusionSpecifiqueService,
    ) {}

  @Post()
  create(@Body() createAttributionGlobaleDto: CreateAttributionGlobaleDto) {
    return this.attributionGlobaleService.create(createAttributionGlobaleDto);
  }

  @Get()
  findAll() {
    return this.attributionGlobaleService.findAll();
  }

  @Get('byemploye/:id')
  async findByEmploye(@Param('id') id: string) {
   const [attG,excs] = await Promise.all([
    this.attributionGlobaleService.findAll(),
    this.exclusionSpecifiqueService.findByEmploye(id)
   ]);

   return  differenceBy(attG,excs,(v) => v.rubrique._id.toString());

  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attributionGlobaleService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAttributionGlobaleDto: UpdateAttributionGlobaleDto) {
    return this.attributionGlobaleService.update(id, updateAttributionGlobaleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attributionGlobaleService.remove(id);
  }
}
