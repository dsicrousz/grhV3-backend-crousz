import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ImpotService } from './impot.service';
import { CreateImpotDto } from './dto/create-impot.dto';
import { UpdateImpotDto } from './dto/update-impot.dto';

@Controller('impot')
export class ImpotController {
  constructor(private readonly impotService: ImpotService) {}

  @Post()
  create(@Body() createImpotDto: CreateImpotDto) {
    return this.impotService.create(createImpotDto);
  }

  @Get()
  findAll() {
    return this.impotService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.impotService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateImpotDto: UpdateImpotDto) {
    return this.impotService.update(id, updateImpotDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.impotService.remove(id);
  }
}
