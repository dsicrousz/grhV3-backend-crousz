import { Test, TestingModule } from '@nestjs/testing';
import { AttributionFonctionnelleController } from './attribution-fonctionnelle.controller';
import { AttributionFonctionnelleService } from './attribution-fonctionnelle.service';

describe('AttributionFonctionnelleController', () => {
  let controller: AttributionFonctionnelleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttributionFonctionnelleController],
      providers: [AttributionFonctionnelleService],
    }).compile();

    controller = module.get<AttributionFonctionnelleController>(AttributionFonctionnelleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
