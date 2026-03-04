import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RubriqueService } from './rubrique.service';
import { CreateRubriqueDto } from './dto/create-rubrique.dto';
import { UpdateRubriqueDto } from './dto/update-rubrique.dto';

@Controller('rubrique')
export class RubriqueController {
  constructor(private readonly rubriqueService: RubriqueService) {}

  @Post()
  create(@Body() createRubriqueDto: CreateRubriqueDto) {
    return this.rubriqueService.create(createRubriqueDto);
  }

  @Get()
  findAll() {
    return this.rubriqueService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rubriqueService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRubriqueDto: UpdateRubriqueDto) {
    return this.rubriqueService.update(id, updateRubriqueDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rubriqueService.remove(id);
  }
}
