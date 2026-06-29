import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RubriqueService } from './rubrique.service';
import { CreateRubriqueDto } from './dto/create-rubrique.dto';
import { UpdateRubriqueDto } from './dto/update-rubrique.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('rubrique')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class RubriqueController {
  constructor(private readonly rubriqueService: RubriqueService) {}

  @Post()
  @UserHasPermission({ permission: { rubrique: ['create'] } })
  create(@Body() createRubriqueDto: CreateRubriqueDto) {
    return this.rubriqueService.create(createRubriqueDto);
  }

  @Get()
  @UserHasPermission({ permission: { rubrique: ['list'] } })
  findAll() {
    return this.rubriqueService.findAll();
  }

  @Get(':id')
  @UserHasPermission({ permission: { rubrique: ['read'] } })
  findOne(@Param('id') id: string) {
    return this.rubriqueService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { rubrique: ['update'] } })
  update(@Param('id') id: string, @Body() updateRubriqueDto: UpdateRubriqueDto) {
    return this.rubriqueService.update(id, updateRubriqueDto);
  }

  @Delete(':id')
  @UserHasPermission({ permission: { rubrique: ['delete'] } })
  remove(@Param('id') id: string) {
    return this.rubriqueService.remove(id);
  }
}
