import { Test, TestingModule } from '@nestjs/testing';
import { ExclusionSpecifiqueController } from './exclusion-specifique.controller';
import { ExclusionSpecifiqueService } from './exclusion-specifique.service';

describe('ExclusionSpecifiqueController', () => {
  let controller: ExclusionSpecifiqueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExclusionSpecifiqueController],
      providers: [ExclusionSpecifiqueService],
    }).compile();

    controller = module.get<ExclusionSpecifiqueController>(ExclusionSpecifiqueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
