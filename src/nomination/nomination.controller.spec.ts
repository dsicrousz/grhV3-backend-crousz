import { Test, TestingModule } from '@nestjs/testing';
import { NominationController } from './nomination.controller';
import { NominationService } from './nomination.service';

describe('NominationController', () => {
  let controller: NominationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NominationController],
      providers: [NominationService],
    }).compile();

    controller = module.get<NominationController>(NominationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
