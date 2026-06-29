import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TypedocumentService } from './typedocument.service';
import { CreateTypedocumentDto } from './dto/create-typedocument.dto';
import { UpdateTypedocumentDto } from './dto/update-typedocument.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('typedocument')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class TypedocumentController {
  constructor(private readonly typedocumentService: TypedocumentService) {}

  @Post()
  @UserHasPermission({ permission: { typedocument: ['create'] } })
  create(@Body() createTypedocumentDto: CreateTypedocumentDto) {
    return this.typedocumentService.create(createTypedocumentDto);
  }

  @Get()
  @UserHasPermission({ permission: { typedocument: ['list'] } })
  findAll() {
    return this.typedocumentService.findAll();
  }

  @Get(':id')
  @UserHasPermission({ permission: { typedocument: ['read'] } })
  findOne(@Param('id') id: string) {
    return this.typedocumentService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { typedocument: ['update'] } })
  update(@Param('id') id: string, @Body() updateTypedocumentDto: UpdateTypedocumentDto) {
    return this.typedocumentService.update(id, updateTypedocumentDto);
  }

  @Delete(':id')
  @UserHasPermission({ permission: { typedocument: ['delete'] } })
  remove(@Param('id') id: string) {
    return this.typedocumentService.remove(id);
  }
}
