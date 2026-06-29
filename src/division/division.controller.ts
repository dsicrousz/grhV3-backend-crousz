import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DivisionService } from './division.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('division')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class DivisionController {
  constructor(private readonly divisionService: DivisionService) {}

  @Post()
  @UserHasPermission({ permission: { division: ['create'] } })
  create(@Body() createDivisionDto: CreateDivisionDto) {
    return this.divisionService.create(createDivisionDto);
  }

  @Get()
  @UserHasPermission({ permission: { division: ['list'] } })
  findAll() {
    return this.divisionService.findAll();
  }

  @Get(':id')
  @UserHasPermission({ permission: { division: ['read'] } })
  findOne(@Param('id') id: string) {
    return this.divisionService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { division: ['update'] } })
  update(@Param('id') id: string, @Body() updateDivisionDto: UpdateDivisionDto) {
    return this.divisionService.update(id, updateDivisionDto);
  }

  @Delete(':id')
  @UserHasPermission({ permission: { division: ['delete'] } })
  remove(@Param('id') id: string) {
    return this.divisionService.remove(id);
  }
}
