import { Test, TestingModule } from '@nestjs/testing';
import { AttributionIndividuelleController } from './attribution-individuelle.controller';
import { AttributionIndividuelleService } from './attribution-individuelle.service';

describe('AttributionIndividuelleController', () => {
  let controller: AttributionIndividuelleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttributionIndividuelleController],
      providers: [AttributionIndividuelleService],
    }).compile();

    controller = module.get<AttributionIndividuelleController>(AttributionIndividuelleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
