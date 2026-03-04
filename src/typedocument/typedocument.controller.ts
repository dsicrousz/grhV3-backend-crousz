import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TypedocumentService } from './typedocument.service';
import { CreateTypedocumentDto } from './dto/create-typedocument.dto';
import { UpdateTypedocumentDto } from './dto/update-typedocument.dto';

@Controller('typedocument')
export class TypedocumentController {
  constructor(private readonly typedocumentService: TypedocumentService) {}

  @Post()
  create(@Body() createTypedocumentDto: CreateTypedocumentDto) {
    return this.typedocumentService.create(createTypedocumentDto);
  }

  @Get()
  findAll() {
    return this.typedocumentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.typedocumentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTypedocumentDto: UpdateTypedocumentDto) {
    return this.typedocumentService.update(id, updateTypedocumentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.typedocumentService.remove(id);
  }
}
