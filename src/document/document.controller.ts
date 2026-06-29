import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('document')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @UserHasPermission({ permission: { document: ['create'] } })
  create(@Body() createDocumentDto: CreateDocumentDto) {
    return this.documentService.create(createDocumentDto);
  }

  @Get()
  @UserHasPermission({ permission: { document: ['list'] } })
  findAll() {
    return this.documentService.findAll();
  }

  @Get(':id')
  @UserHasPermission({ permission: { document: ['read'] } })
  findOne(@Param('id') id: string) {
    return this.documentService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { document: ['update'] } })
  update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    return this.documentService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  @UserHasPermission({ permission: { document: ['delete'] } })
  remove(@Param('id') id: string) {
    return this.documentService.remove(id);
  }
}
