import { Test, TestingModule } from '@nestjs/testing';
import { TypedocumentService } from './typedocument.service';

describe('TypedocumentService', () => {
  let service: TypedocumentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypedocumentService],
    }).compile();

    service = module.get<TypedocumentService>(TypedocumentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
