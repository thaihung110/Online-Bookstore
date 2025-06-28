import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { AdminDVDsService } from './dvds.service';
import { DVD } from '../../dvds/schemas/dvd.schema';
import { UploadService } from '../../upload/upload.service';
import { ProductActivityLogService } from '../activity-log/activity-log.service';

describe('AdminDVDsService', () => {
  let service: AdminDVDsService;

  const mockDVDModel = {
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
        AdminDVDsService,
        {
          provide: getModelToken(DVD.name),
          useValue: mockDVDModel,
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

    service = module.get<AdminDVDsService>(AdminDVDsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
