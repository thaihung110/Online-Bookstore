import { Test, TestingModule } from '@nestjs/testing';
import { CdsService } from './cds.service';

describe('CdsService', () => {
  let service: CdsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CdsService],
    }).compile();

    service = module.get<CdsService>(CdsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
