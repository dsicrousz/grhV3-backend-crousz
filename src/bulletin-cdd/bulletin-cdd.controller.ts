import { Controller, Get, Param } from '@nestjs/common';
import { BulletinCDDService } from './bulletin-cdd.service';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('bulletin-cdd')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class BulletinCDDController {
    constructor(private readonly bulletinService: BulletinCDDService) {}

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
