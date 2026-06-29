import { Controller, Get, Param } from '@nestjs/common';
import { BulletinTemporaireService } from './bulletin-temporaire.service';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('bulletin-temporaire')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class BulletinTemporaireController {
    constructor(private readonly bulletinService: BulletinTemporaireService) {}

    @Get('employe/:id')
    @UserHasPermission({ permission: { bulletin: ['read'] } })
    findByEmploye(@Param('id') id: string) {
        return this.bulletinService.findByEmploye(id);
    }

    @Get('lot/:id')
    @UserHasPermission({ permission: { bulletin: ['list'] } })
    findByLot(@Param('id') id: string) {
        return this.bulletinService.findByLot(id);
    }
}
