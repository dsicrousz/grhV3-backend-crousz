import { Test, TestingModule } from '@nestjs/testing';
import { TypedocumentController } from './typedocument.controller';
import { TypedocumentService } from './typedocument.service';

describe('TypedocumentController', () => {
  let controller: TypedocumentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TypedocumentController],
      providers: [TypedocumentService],
    }).compile();

    controller = module.get<TypedocumentController>(TypedocumentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
