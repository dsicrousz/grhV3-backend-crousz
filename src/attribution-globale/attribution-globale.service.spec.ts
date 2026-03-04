import { Test, TestingModule } from '@nestjs/testing';
import { AttributionGlobaleService } from './attribution-globale.service';

describe('AttributionGlobaleService', () => {
  let service: AttributionGlobaleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttributionGlobaleService],
    }).compile();

    service = module.get<AttributionGlobaleService>(AttributionGlobaleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
