import { Controller, Get, Post, Body, Patch, Param, Delete} from '@nestjs/common';
import { AttributionIndividuelleService } from './attribution-individuelle.service';
import { CreateAttributionIndividuelleDto } from './dto/create-attribution-individuelle.dto';
import { UpdateAttributionIndividuelleDto } from './dto/update-attribution-individuelle.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('attribution-individuelle')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class AttributionIndividuelleController {
  constructor(private readonly attributionIndividuelleService: AttributionIndividuelleService) {}

  @Post()
  @UserHasPermission({ permission: { attribution: ['create'] } })
  create(@Body() createAttributionIndividuelleDto: CreateAttributionIndividuelleDto) {
    return this.attributionIndividuelleService.create(createAttributionIndividuelleDto);
  }

  @Get()
  @UserHasPermission({ permission: { attribution: ['list'] } })
  findAll() {
    return this.attributionIndividuelleService.findAll();
  }

  @Get('byemploye/:emp')
  @UserHasPermission({ permission: { attribution: ['read'] } })
  findOneByEmploye(@Param('emp') emp: string) {
    return this.attributionIndividuelleService.findByEmploye(emp);
  }

  @Get('byrubrique/:ru')
  @UserHasPermission({ permission: { attribution: ['read'] } })
  findOneByRubrique(@Param('ru') ru: string) {
    return this.attributionIndividuelleService.findByRubrique(ru);
  }

  @Get(':id')
  @UserHasPermission({ permission: { attribution: ['read'] } })
  findOne(@Param('id') id: string) {
    return this.attributionIndividuelleService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { attribution: ['update'] } })
  update(@Param('id') id: string, @Body() updateAttributionIndividuelleDto: UpdateAttributionIndividuelleDto) {
    return this.attributionIndividuelleService.update(id, updateAttributionIndividuelleDto);
  }

  @Delete(':id')
  @UserHasPermission({ permission: { attribution: ['delete'] } })
  remove(@Param('id') id: string) {
    return this.attributionIndividuelleService.remove(id);
  }
}
