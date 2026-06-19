import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PosteService } from './poste.service';
import { CreatePosteDto } from './dto/create-poste.dto';
import { UpdatePosteDto } from './dto/update-poste.dto';

@Controller('poste')
export class PosteController {
  constructor(private readonly posteService: PosteService) {}

  @Post()
  create(@Body() createPosteDto: CreatePosteDto) {
    return this.posteService.create(createPosteDto);
  }

  @Get()
  findAll() {
    return this.posteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.posteService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePosteDto: UpdatePosteDto) {
    return this.posteService.update(id, updatePosteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.posteService.remove(id);
  }
}
