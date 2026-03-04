import { Test, TestingModule } from '@nestjs/testing';
import { AttributionFonctionnelleService } from './attribution-fonctionnelle.service';

describe('AttributionFonctionnelleService', () => {
  let service: AttributionFonctionnelleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttributionFonctionnelleService],
    }).compile();

    service = module.get<AttributionFonctionnelleService>(AttributionFonctionnelleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
