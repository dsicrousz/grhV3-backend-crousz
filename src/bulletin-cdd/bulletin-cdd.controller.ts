import { Controller, Get, Param } from '@nestjs/common';
import { BulletinCDDService } from './bulletin-cdd.service';
import { Roles } from 'src/common/guards';

@Controller('bulletin-cdd')
@Roles('admin', 'rh', 'csa')
export class BulletinCDDController {
    constructor(private readonly bulletinService: BulletinCDDService) {}

    @Get('employe/:id')
    findByEmploye(@Param('id') id: string) {
        return this.bulletinService.findByEmploye(id);
    }

    @Get('lot/:id')
    findByLot(@Param('id') id: string) {
        return this.bulletinService.findByLot(id);
    }
}
