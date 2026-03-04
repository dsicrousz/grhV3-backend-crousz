import { Test, TestingModule } from '@nestjs/testing';
import { ImpotController } from './impot.controller';
import { ImpotService } from './impot.service';

describe('ImpotController', () => {
  let controller: ImpotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImpotController],
      providers: [ImpotService],
    }).compile();

    controller = module.get<ImpotController>(ImpotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
