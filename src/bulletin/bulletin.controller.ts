import { Controller, Get, Param } from '@nestjs/common';
import { BulletinService } from './bulletin.service';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

/**
 * Bulletin Controller
 *
 * @export
 * @class BulletinController
 * @typedef {BulletinController}
 */
@Controller('bulletin')
@Roles(['admin', 'rh', 'csa', 'dsi'])
export class BulletinController {
  constructor(private readonly bulletinService: BulletinService) {}

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
