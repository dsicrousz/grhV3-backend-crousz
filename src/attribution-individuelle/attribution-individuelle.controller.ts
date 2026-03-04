import { Controller, Get, Post, Body, Patch, Param, Delete} from '@nestjs/common';
import { AttributionIndividuelleService } from './attribution-individuelle.service';
import { CreateAttributionIndividuelleDto } from './dto/create-attribution-individuelle.dto';
import { UpdateAttributionIndividuelleDto } from './dto/update-attribution-individuelle.dto';

@Controller('attribution-individuelle')
export class AttributionIndividuelleController {
  constructor(private readonly attributionIndividuelleService: AttributionIndividuelleService) {}

  @Post()
  create(@Body() createAttributionIndividuelleDto: CreateAttributionIndividuelleDto) {
    return this.attributionIndividuelleService.create(createAttributionIndividuelleDto);
  }

  @Get()
  findAll() {
    return this.attributionIndividuelleService.findAll();
  }

  @Get('byemploye/:emp')
  findOneByEmploye(@Param('emp') emp: string) {
    return this.attributionIndividuelleService.findByEmploye(emp);
  }

  @Get('byrubrique/:ru')
  findOneByRubrique(@Param('ru') ru: string) {
    return this.attributionIndividuelleService.findByRubrique(ru);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attributionIndividuelleService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAttributionIndividuelleDto: UpdateAttributionIndividuelleDto) {
    return this.attributionIndividuelleService.update(id, updateAttributionIndividuelleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attributionIndividuelleService.remove(id);
  }
}
