import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NominationService } from './nomination.service';
import { CreateNominationDto } from './dto/create-nomination.dto';
import { UpdateNominationDto } from './dto/update-nomination.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';


@Controller('nomination')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class NominationController {
  constructor(private readonly nominationService: NominationService) {}

  @Post()
  @UserHasPermission({ permission: { nomination: ['create'] } })
  create(@Body() createNominationDto: CreateNominationDto) {
    return this.nominationService.create(createNominationDto);
  }

  @Get()
  @UserHasPermission({ permission: { nomination: ['list'] } })
  findAll() {
    return this.nominationService.findAll();
  }

  @Get('byemploye/:emp')
  @UserHasPermission({ permission: { nomination: ['read'] } })
  findByEmploye(@Param('emp') emp: string) {
    return this.nominationService.findByEmploye(emp);
  }

  @Get('byemployeactive/:emp')
  @UserHasPermission({ permission: { nomination: ['read'] } })
  findActiveByEmploye(@Param('emp') emp: string) {
    return this.nominationService.findActiveByEmploye(emp);
  }

  @Get(':id')
  @UserHasPermission({ permission: { nomination: ['read'] } })
  findOne(@Param('id') id: string) {
    return this.nominationService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { nomination: ['update'] } })
  update(@Param('id') id: string, @Body() updateNominationDto: UpdateNominationDto) {
    return this.nominationService.update(id, updateNominationDto);
  }

  @Patch('/toggle/:id')
  @UserHasPermission({ permission: { nomination: ['update'] } })
  toggleState(@Param('id') id: string, @Body() updateStateDto: {est_active: boolean}) {
    return this.nominationService.toggleState(id, updateStateDto);
  }

  @Delete(':id')
  @UserHasPermission({ permission: { nomination: ['delete'] } })
  remove(@Param('id') id: string) {
    return this.nominationService.remove(id);
  }
}
