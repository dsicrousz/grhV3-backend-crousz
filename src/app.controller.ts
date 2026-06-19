import { Controller, Get } from '@nestjs/common';
import { Public } from '@thallesp/nestjs-better-auth';
import { AppService } from './app.service';

@Controller()
class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
