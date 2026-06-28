import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ParametreBulletinService } from './parametre-bulletin.service';
import { CreateParametreBulletinDto } from './dto/create-parametre-bulletin.dto';
import { UpdateParametreBulletinDto } from './dto/update-parametre-bulletin.dto';
import { Roles } from 'src/common/guards';

@Controller('parametre-bulletin')
@Roles('admin', 'rh', 'csa')
export class ParametreBulletinController {
    constructor(private readonly parametreBulletinService: ParametreBulletinService) {}

    @Post()
    create(@Body() createParametreBulletinDto: CreateParametreBulletinDto) {
        return this.parametreBulletinService.create(createParametreBulletinDto);
    }

    @Get()
    findAll() {
        return this.parametreBulletinService.findAll();
    }

    @Get('annee/:annee')
    findByAnnee(@Param('annee') annee: string) {
        return this.parametreBulletinService.findByAnnee(+annee);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.parametreBulletinService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateParametreBulletinDto: UpdateParametreBulletinDto) {
        return this.parametreBulletinService.update(id, updateParametreBulletinDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.parametreBulletinService.remove(id);
    }
}
