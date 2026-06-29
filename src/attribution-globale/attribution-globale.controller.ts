import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AttributionGlobaleService } from './attribution-globale.service';
import { CreateAttributionGlobaleDto } from './dto/create-attribution-globale.dto';
import { UpdateAttributionGlobaleDto } from './dto/update-attribution-globale.dto';
import { ExclusionSpecifiqueService } from 'src/exclusion-specifique/exclusion-specifique.service';
import { differenceBy } from 'lodash';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('attribution-globale')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class AttributionGlobaleController {
  constructor(
    private readonly attributionGlobaleService: AttributionGlobaleService,
    private readonly exclusionSpecifiqueService: ExclusionSpecifiqueService,
    ) {}

  @Post()
  @UserHasPermission({ permission: { attribution: ['create'] } })
  create(@Body() createAttributionGlobaleDto: CreateAttributionGlobaleDto) {
    return this.attributionGlobaleService.create(createAttributionGlobaleDto);
  }

  @Get()
  @UserHasPermission({ permission: { attribution: ['list'] } })
  findAll() {
    return this.attributionGlobaleService.findAll();
  }

  @Get('byemploye/:id')
  @UserHasPermission({ permission: { attribution: ['read'] } })
  async findByEmploye(@Param('id') id: string) {
   const [attG,excs] = await Promise.all([
    this.attributionGlobaleService.findAll(),
    this.exclusionSpecifiqueService.findByEmploye(id)
   ]);

   return  differenceBy(attG,excs,(v) => v.rubrique._id.toString());

  }

  @Get(':id')
  @UserHasPermission({ permission: { attribution: ['read'] } })
  findOne(@Param('id') id: string) {
    return this.attributionGlobaleService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { attribution: ['update'] } })
  update(@Param('id') id: string, @Body() updateAttributionGlobaleDto: UpdateAttributionGlobaleDto) {
    return this.attributionGlobaleService.update(id, updateAttributionGlobaleDto);
  }

  @Delete(':id')
  @UserHasPermission({ permission: { attribution: ['delete'] } })
  remove(@Param('id') id: string) {
    return this.attributionGlobaleService.remove(id);
  }
}
