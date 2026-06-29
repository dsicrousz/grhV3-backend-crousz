import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ExclusionSpecifiqueService } from './exclusion-specifique.service';
import { CreateExclusionSpecifiqueDto } from './dto/create-exclusion-specifique.dto';
import { UpdateExclusionSpecifiqueDto } from './dto/update-exclusion-specifique.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('exclusion-specifique')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class ExclusionSpecifiqueController {
  constructor(private readonly exclusionSpecifiqueService: ExclusionSpecifiqueService) {}

  @Post()
  @UserHasPermission({ permission: { exclusion: ['create'] } })
  create(@Body() createExclusionSpecifiqueDto: CreateExclusionSpecifiqueDto) {
    return this.exclusionSpecifiqueService.create(createExclusionSpecifiqueDto);
  }

  @Get()
  @UserHasPermission({ permission: { exclusion: ['list'] } })
  findAll() {
    return this.exclusionSpecifiqueService.findAll();
  }

  @Get('byemploye/:emp')
  @UserHasPermission({ permission: { exclusion: ['read'] } })
  findByEmploye(@Param('emp') emp: string) {
    return this.exclusionSpecifiqueService.findByEmploye(emp);
  }

  @Get('byrubrique/:ru')
  @UserHasPermission({ permission: { exclusion: ['read'] } })
  findOneByRubrique(@Param('ru') ru: string) {
    return this.exclusionSpecifiqueService.findByRubrique(ru);
  }

  @Get(':id')
  @UserHasPermission({ permission: { exclusion: ['read'] } })
  findOne(@Param('id') id: string) {
    return this.exclusionSpecifiqueService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { exclusion: ['update'] } })
  update(@Param('id') id: string, @Body() updateExclusionSpecifiqueDto: UpdateExclusionSpecifiqueDto) {
    return this.exclusionSpecifiqueService.update(id, updateExclusionSpecifiqueDto);
  }

  @Delete(':id')
  @UserHasPermission({ permission: { exclusion: ['delete'] } })
  remove(@Param('id') id: string) {
    return this.exclusionSpecifiqueService.remove(id);
  }
}
