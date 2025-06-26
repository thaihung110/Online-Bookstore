import { Test, TestingModule } from '@nestjs/testing';
import { DvdsController } from './dvds.controller';

describe('DvdsController', () => {
  let controller: DvdsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DvdsController],
    }).compile();

    controller = module.get<DvdsController>(DvdsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
