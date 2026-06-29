import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ParametreBulletinService } from './parametre-bulletin.service';
import { CreateParametreBulletinDto } from './dto/create-parametre-bulletin.dto';
import { UpdateParametreBulletinDto } from './dto/update-parametre-bulletin.dto';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('parametre-bulletin')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class ParametreBulletinController {
    constructor(private readonly parametreBulletinService: ParametreBulletinService) {}

    @Post()
    @UserHasPermission({ permission: { parametreBulletin: ['create'] } })
    create(@Body() createParametreBulletinDto: CreateParametreBulletinDto) {
        return this.parametreBulletinService.create(createParametreBulletinDto);
    }

    @Get()
    @UserHasPermission({ permission: { parametreBulletin: ['list'] } })
    findAll() {
        return this.parametreBulletinService.findAll();
    }

    @Get('annee/:annee')
    findByAnnee(@Param('annee') annee: string) {
        return this.parametreBulletinService.findByAnnee(+annee);
    }

    @Get(':id')
    @UserHasPermission({ permission: { parametreBulletin: ['read'] } })
    findOne(@Param('id') id: string) {
        return this.parametreBulletinService.findOne(id);
    }

    @Patch(':id')
    @UserHasPermission({ permission: { parametreBulletin: ['update'] } })
    update(@Param('id') id: string, @Body() updateParametreBulletinDto: UpdateParametreBulletinDto) {
        return this.parametreBulletinService.update(id, updateParametreBulletinDto);
    }

    @Delete(':id')
    @UserHasPermission({ permission: { parametreBulletin: ['delete'] } })
    remove(@Param('id') id: string) {
        return this.parametreBulletinService.remove(id);
    }
}
