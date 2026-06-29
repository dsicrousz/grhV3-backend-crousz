import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { HistoriqueService } from './historique.service';
import { CreateHistoriqueDto } from './dto/create-historique.dto';
import { TypeEvenement } from './entities/historique.entity';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('historique')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class HistoriqueController {
    constructor(private readonly historiqueService: HistoriqueService) {}

    @Post()
    @UserHasPermission({ permission: { historique: ['create'] } })
    create(@Body() createDto: CreateHistoriqueDto) {
        return this.historiqueService.create(createDto);
    }

    @Get()
    @UserHasPermission({ permission: { historique: ['list'] } })
    findAll() {
        return this.historiqueService.findAll();
    }

    @Get('by-employe/:employeId')
    @UserHasPermission({ permission: { historique: ['read'] } })
    findByEmploye(@Param('employeId') employeId: string) {
        return this.historiqueService.findByEmploye(employeId);
    }

    @Get('by-employe/:employeId/type/:type')
    @UserHasPermission({ permission: { historique: ['read'] } })
    findByEmployeAndType(
        @Param('employeId') employeId: string,
        @Param('type') type: TypeEvenement,
    ) {
        return this.historiqueService.findByEmployeAndType(employeId, type);
    }

    @Get(':id')
    @UserHasPermission({ permission: { historique: ['read'] } })
    findOne(@Param('id') id: string) {
        return this.historiqueService.findOne(id);
    }
}
