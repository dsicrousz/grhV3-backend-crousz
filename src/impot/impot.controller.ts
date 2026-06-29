import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ImpotService } from './impot.service';
import { CreateImpotDto } from './dto/create-impot.dto';
import { UpdateImpotDto } from './dto/update-impot.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('impot')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class ImpotController {
  constructor(private readonly impotService: ImpotService) {}

  @Post()
  @UserHasPermission({ permission: { impot: ['create'] } })
  create(@Body() createImpotDto: CreateImpotDto) {
    return this.impotService.create(createImpotDto);
  }

  @Get()
  @UserHasPermission({ permission: { impot: ['list'] } })
  findAll() {
    return this.impotService.findAll();
  }

  @Get(':id')
  @UserHasPermission({ permission: { impot: ['read'] } })
  findOne(@Param('id') id: string) {
    return this.impotService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { impot: ['update'] } })
  update(@Param('id') id: string, @Body() updateImpotDto: UpdateImpotDto) {
    return this.impotService.update(id, updateImpotDto);
  }

  @Delete(':id')
  @UserHasPermission({ permission: { impot: ['delete'] } })
  remove(@Param('id') id: string) {
    return this.impotService.remove(id);
  }
}
