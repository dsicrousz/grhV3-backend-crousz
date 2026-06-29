import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('session')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @UserHasPermission({ permission: { session: ['create'] } })
  create(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionService.create(createSessionDto);
  }

  @Get()
  @UserHasPermission({ permission: { session: ['list'] } })
  findAll() {
    return this.sessionService.findAll();
  }

  @Get(':id')
  @UserHasPermission({ permission: { session: ['read'] } })
  findOne(@Param('id') id: string) {
    return this.sessionService.findOne(id);
  }

  @Patch(':id')
  @UserHasPermission({ permission: { session: ['update'] } })
  update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
    return this.sessionService.update(id, updateSessionDto);
  }

  @Delete(':id')
  @UserHasPermission({ permission: { session: ['delete'] } })
  remove(@Param('id') id: string) {
    return this.sessionService.remove(id);
  }
}
