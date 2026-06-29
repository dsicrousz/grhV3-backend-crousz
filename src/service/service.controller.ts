import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('service')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @UserHasPermission({ permission: { service: ['create'] } })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.serviceService.create(createServiceDto);
  }

  @Get('/bydivision/:id')
  @UserHasPermission({ permission: { service: ['read'] } })
  findByDivision(@Param('id') id: string) {
    return this.serviceService.findByDivision(id);
  }


  @Get()
  @UserHasPermission({ permission: { service: ['list'] } })
  findAll() {
    return this.serviceService.findAll();
  }

  @Get(':id')
  @UserHasPermission({ permission: { service: ['read'] } })
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { service: ['update'] } })
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.serviceService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @UserHasPermission({ permission: { service: ['delete'] } })
  remove(@Param('id') id: string) {
    return this.serviceService.remove(id);
  }
}
