import { Test, TestingModule } from '@nestjs/testing';
import { ExclusionSpecifiqueService } from './exclusion-specifique.service';

describe('ExclusionSpecifiqueService', () => {
  let service: ExclusionSpecifiqueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExclusionSpecifiqueService],
    }).compile();

    service = module.get<ExclusionSpecifiqueService>(ExclusionSpecifiqueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
