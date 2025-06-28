import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ProductActivityLogService } from './activity-log.service';
import { ProductActivityLog } from './schemas/product-activity-log.schema';

describe('ProductActivityLogService', () => {
  let service: ProductActivityLogService;

  const mockProductActivityLogModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
    populate: jest.fn(),
    sort: jest.fn(),
    exec: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductActivityLogService,
        {
          provide: getModelToken(ProductActivityLog.name),
          useValue: mockProductActivityLogModel,
        },
      ],
    }).compile();

    service = module.get<ProductActivityLogService>(ProductActivityLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
