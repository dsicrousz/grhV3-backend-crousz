import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ExclusionSpecifiqueService } from './exclusion-specifique.service';
import { CreateExclusionSpecifiqueDto } from './dto/create-exclusion-specifique.dto';
import { UpdateExclusionSpecifiqueDto } from './dto/update-exclusion-specifique.dto';

@Controller('exclusion-specifique')
export class ExclusionSpecifiqueController {
  constructor(private readonly exclusionSpecifiqueService: ExclusionSpecifiqueService) {}

  @Post()
  create(@Body() createExclusionSpecifiqueDto: CreateExclusionSpecifiqueDto) {
    return this.exclusionSpecifiqueService.create(createExclusionSpecifiqueDto);
  }

  @Get()
  findAll() {
    return this.exclusionSpecifiqueService.findAll();
  }

  @Get('byemploye/:emp')
  findByEmploye(@Param('emp') emp: string) {
    return this.exclusionSpecifiqueService.findByEmploye(emp);
  }

  @Get('byrubrique/:ru')
  findOneByRubrique(@Param('ru') ru: string) {
    return this.exclusionSpecifiqueService.findByRubrique(ru);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exclusionSpecifiqueService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExclusionSpecifiqueDto: UpdateExclusionSpecifiqueDto) {
    return this.exclusionSpecifiqueService.update(id, updateExclusionSpecifiqueDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.exclusionSpecifiqueService.remove(id);
  }
}
