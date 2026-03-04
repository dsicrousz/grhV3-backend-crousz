import { Controller, Get, Param } from '@nestjs/common';
import { BulletinService } from './bulletin.service';

/**
 * Bulletin Controller
 *
 * @export
 * @class BulletinController
 * @typedef {BulletinController}
 */
@Controller('bulletin')
export class BulletinController {
  constructor(private readonly bulletinService: BulletinService) {}

  @Get('employe/:id')
  findByEmploye(@Param('id') id: string) {
    return this.bulletinService.findByEmploye(id);
  }

  @Get('lot/:id')
  findByLot(@Param('id') id: string) {
    return this.bulletinService.findByLot(id);
  }

}
