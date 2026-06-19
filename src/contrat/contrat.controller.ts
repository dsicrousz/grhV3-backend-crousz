import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ContratService } from './contrat.service';
import { Roles } from 'src/common/guards';
import { CreateContratDto } from './dto/create-contrat.dto';
import { UpdateContratDto } from './dto/update-contrat.dto';
import { TerminerContratDto } from './dto/terminer-contrat.dto';
import { MotifTerminaison, TypeContrat } from './entities/contrat.entity';

@Controller('contrat')
@Roles('admin', 'rh')
export class ContratController {
    constructor(private readonly contratService: ContratService) {}

    @Post()
    create(@Body() createContratDto: CreateContratDto) {
        return this.contratService.create(createContratDto);
    }

    @Get()
    findAll() {
        return this.contratService.findAll();
    }

    @Get('by-type/:type')
    findByType(@Param('type') type: TypeContrat) {
        return this.contratService.findByType(type);
    }

    @Get('by-employe/:employeId')
    findByEmploye(@Param('employeId') employeId: string) {
        return this.contratService.findByEmploye(employeId);
    }

    @Get('active/:employeId')
    findActiveByEmploye(@Param('employeId') employeId: string) {
        return this.contratService.findActiveByEmploye(employeId);
    }

    @Get('terminations')
    findTerminaisons(
        @Query('motif') motif?: MotifTerminaison,
        @Query('annee') annee?: string,
    ) {
        const anneeNum = annee ? parseInt(annee, 10) : undefined;
        return this.contratService.findTerminaisons(motif, anneeNum);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.contratService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateContratDto: UpdateContratDto) {
        return this.contratService.update(id, updateContratDto);
    }

    @Patch('terminer/:id')
    terminer(@Param('id') id: string, @Body() dto: TerminerContratDto) {
        return this.contratService.terminer(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.contratService.remove(id);
    }
}
