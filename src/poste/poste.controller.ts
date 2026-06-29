import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PosteService } from './poste.service';
import { CreatePosteDto } from './dto/create-poste.dto';
import { UpdatePosteDto } from './dto/update-poste.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('poste')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class PosteController {
  constructor(private readonly posteService: PosteService) {}

  @Post()
  @UserHasPermission({ permission: { poste: ['create'] } })
  create(@Body() createPosteDto: CreatePosteDto) {
    return this.posteService.create(createPosteDto);
  }

  @Get()
  @UserHasPermission({ permission: { poste: ['list'] } })
  findAll() {
    return this.posteService.findAll();
  }

  @Get(':id')
  @UserHasPermission({ permission: { poste: ['read'] } })
  findOne(@Param('id') id: string) {
    return this.posteService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { poste: ['update'] } })
  update(@Param('id') id: string, @Body() updatePosteDto: UpdatePosteDto) {
    return this.posteService.update(id, updatePosteDto);
  }

  @Delete(':id')
  @UserHasPermission({ permission: { poste: ['delete'] } })
  remove(@Param('id') id: string) {
    return this.posteService.remove(id);
  }
}
