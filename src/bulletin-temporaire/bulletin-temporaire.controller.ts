import { Controller, Get, Param } from '@nestjs/common';
import { BulletinTemporaireService } from './bulletin-temporaire.service';
import { Roles } from 'src/common/guards';

@Controller('bulletin-temporaire')
@Roles('admin', 'rh', 'csa')
export class BulletinTemporaireController {
    constructor(private readonly bulletinService: BulletinTemporaireService) {}

    @Get('employe/:id')
    findByEmploye(@Param('id') id: string) {
        return this.bulletinService.findByEmploye(id);
    }

    @Get('lot/:id')
    findByLot(@Param('id') id: string) {
        return this.bulletinService.findByLot(id);
    }
}
