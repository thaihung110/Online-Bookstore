import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { AdminCDsService } from './cds.service';
import { CD } from '../../cds/schemas/cd.schema';
import { UploadService } from '../../upload/upload.service';
import { ProductActivityLogService } from '../activity-log/activity-log.service';

describe('AdminCDsService', () => {
  let service: AdminCDsService;

  const mockCDModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUploadService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockProductActivityLogService = {
    logActivity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCDsService,
        {
          provide: getModelToken(CD.name),
          useValue: mockCDModel,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
        {
          provide: ProductActivityLogService,
          useValue: mockProductActivityLogService,
        },
      ],
    }).compile();

    service = module.get<AdminCDsService>(AdminCDsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
