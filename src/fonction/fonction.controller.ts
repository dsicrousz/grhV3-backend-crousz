import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FonctionService } from './fonction.service';
import { CreateFonctionDto } from './dto/create-fonction.dto';
import { UpdateFonctionDto } from './dto/update-fonction.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('fonction')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class FonctionController {
  constructor(private readonly fonctionService: FonctionService) {}

  @Post()
  @UserHasPermission({ permission: { fonction: ['create'] } })
  create(@Body() createFonctionDto: CreateFonctionDto) {
    return this.fonctionService.create(createFonctionDto);
  }

  @Get()
  @UserHasPermission({ permission: { fonction: ['list'] } })
  findAll() {
    return this.fonctionService.findAll();
  }

  @Get(':id')
  @UserHasPermission({ permission: { fonction: ['read'] } })
  findOne(@Param('id') id: string) {
    return this.fonctionService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { fonction: ['update'] } })
  update(@Param('id') id: string, @Body() updateFonctionDto: UpdateFonctionDto) {
    return this.fonctionService.update(id, updateFonctionDto);
  }

  @Delete(':id')
  @UserHasPermission({ permission: { fonction: ['delete'] } })
  remove(@Param('id') id: string) {
    return this.fonctionService.remove(id);
  }
}
