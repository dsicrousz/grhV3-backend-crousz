import { Test, TestingModule } from '@nestjs/testing';
import { FonctionController } from './fonction.controller';
import { FonctionService } from './fonction.service';

describe('FonctionController', () => {
  let controller: FonctionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FonctionController],
      providers: [FonctionService],
    }).compile();

    controller = module.get<FonctionController>(FonctionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
