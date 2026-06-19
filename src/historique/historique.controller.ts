import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { HistoriqueService } from './historique.service';
import { CreateHistoriqueDto } from './dto/create-historique.dto';
import { TypeEvenement } from './entities/historique.entity';

@Controller('historique')
export class HistoriqueController {
    constructor(private readonly historiqueService: HistoriqueService) {}

    @Post()
    create(@Body() createDto: CreateHistoriqueDto) {
        return this.historiqueService.create(createDto);
    }

    @Get()
    findAll() {
        return this.historiqueService.findAll();
    }

    @Get('by-employe/:employeId')
    findByEmploye(@Param('employeId') employeId: string) {
        return this.historiqueService.findByEmploye(employeId);
    }

    @Get('by-employe/:employeId/type/:type')
    findByEmployeAndType(
        @Param('employeId') employeId: string,
        @Param('type') type: TypeEvenement,
    ) {
        return this.historiqueService.findByEmployeAndType(employeId, type);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.historiqueService.findOne(id);
    }
}
