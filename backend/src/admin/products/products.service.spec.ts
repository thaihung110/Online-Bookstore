import { ConfigService } from '@nestjs/config';
import { AdminProductsService } from './products.service';
import { UploadService } from '../../upload/upload.service';
import { ProductActivityLogService } from '../activity-log/activity-log.service';

describe('AdminProductsService', () => {
  let service: AdminProductsService<any, any>;

  const mockProductModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  } as any;

  const mockConfigService = {
    get: jest.fn(),
  } as any;

  const mockUploadService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  } as any;

  const mockProductActivityLogService = {
    logActivity: jest.fn(),
  } as any;

  beforeEach(() => {
    service = new AdminProductsService(
      mockProductModel,
      mockConfigService,
      mockUploadService,
      mockProductActivityLogService
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
