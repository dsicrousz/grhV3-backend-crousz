import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FonctionService } from './fonction.service';
import { CreateFonctionDto } from './dto/create-fonction.dto';
import { UpdateFonctionDto } from './dto/update-fonction.dto';

@Controller('fonction')
export class FonctionController {
  constructor(private readonly fonctionService: FonctionService) {}

  @Post()
  create(@Body() createFonctionDto: CreateFonctionDto) {
    return this.fonctionService.create(createFonctionDto);
  }

  @Get()
  findAll() {
    return this.fonctionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fonctionService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFonctionDto: UpdateFonctionDto) {
    return this.fonctionService.update(id, updateFonctionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fonctionService.remove(id);
  }
}
