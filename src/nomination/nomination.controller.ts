import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NominationService } from './nomination.service';
import { CreateNominationDto } from './dto/create-nomination.dto';
import { UpdateNominationDto } from './dto/update-nomination.dto';


@Controller('nomination')
export class NominationController {
  constructor(private readonly nominationService: NominationService) {}

  @Post()
  create(@Body() createNominationDto: CreateNominationDto) {
    return this.nominationService.create(createNominationDto);
  }

  @Get()
  findAll() {
    return this.nominationService.findAll();
  }

  @Get('byemploye/:emp')
  findByEmploye(@Param('emp') emp: string) {
    return this.nominationService.findByEmploye(emp);
  }

  @Get('byemployeactive/:emp')
  findActiveByEmploye(@Param('emp') emp: string) {
    return this.nominationService.findActiveByEmploye(emp);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nominationService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNominationDto: UpdateNominationDto) {
    return this.nominationService.update(id, updateNominationDto);
  }

  @Patch('/toggle/:id')
  toggleState(@Param('id') id: string, @Body() updateStateDto: {est_active: boolean}) {
    return this.nominationService.toggleState(id, updateStateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nominationService.remove(id);
  }
}
