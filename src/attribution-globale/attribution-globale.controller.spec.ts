import { Test, TestingModule } from '@nestjs/testing';
import { AttributionGlobaleController } from './attribution-globale.controller';
import { AttributionGlobaleService } from './attribution-globale.service';

describe('AttributionGlobaleController', () => {
  let controller: AttributionGlobaleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttributionGlobaleController],
      providers: [AttributionGlobaleService],
    }).compile();

    controller = module.get<AttributionGlobaleController>(AttributionGlobaleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
