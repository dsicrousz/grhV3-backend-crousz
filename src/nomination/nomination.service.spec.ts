import { Test, TestingModule } from '@nestjs/testing';
import { NominationService } from './nomination.service';

describe('NominationService', () => {
  let service: NominationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NominationService],
    }).compile();

    service = module.get<NominationService>(NominationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
