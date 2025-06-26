import { Test, TestingModule } from '@nestjs/testing';
import { DvdsService } from './dvds.service';

describe('DvdsService', () => {
  let service: DvdsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DvdsService],
    }).compile();

    service = module.get<DvdsService>(DvdsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
