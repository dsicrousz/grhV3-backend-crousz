import { Test, TestingModule } from '@nestjs/testing';
import { AttributionIndividuelleService } from './attribution-individuelle.service';

describe('AttributionIndividuelleService', () => {
  let service: AttributionIndividuelleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttributionIndividuelleService],
    }).compile();

    service = module.get<AttributionIndividuelleService>(AttributionIndividuelleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
