import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { AdminCDsService, CDFilters } from './cds.service';
import { CD, CDDocument } from '../../cds/schemas/cd.schema';
import { UploadService } from '../../upload/upload.service';
import { ProductActivityLogService } from '../activity-log/activity-log.service';
import { AdminCreateCDDto } from './dto/admin-create-cd.dto';
import { AdminUpdateCDDto } from './dto/admin-update-cd.dto';
import { ProductType } from '../products/dto/create-product.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AdminCDsService', () => {
  let service: AdminCDsService;
  let cdModel: Model<CDDocument>;
  let configService: ConfigService;
  let uploadService: UploadService;
  let productActivityLogService: ProductActivityLogService;

  // Mock data
  const mockCDId = '507f1f77bcf86cd799439011';
  const mockUserId = '507f1f77bcf86cd799439012';

  const mockCD = {
    _id: mockCDId,
    title: 'Test Album',
    artist: 'Test Artist',
    albumTitle: 'Test Album Title',
    trackList: 'Track 1, Track 2, Track 3',
    category: 'Pop',
    releaseddate: new Date('2023-01-01'),
    price: 15.99,
    originalPrice: 19.99,
    stock: 10,
    coverImage: 'https://example.com/image.jpg',
    productType: 'CD',
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    toObject: jest.fn().mockReturnValue({
      _id: mockCDId,
      title: 'Test Album',
      artist: 'Test Artist',
      albumTitle: 'Test Album Title',
      trackList: 'Track 1, Track 2, Track 3',
      category: 'Pop',
      releaseddate: new Date('2023-01-01'),
      price: 15.99,
      originalPrice: 19.99,
      stock: 10,
      coverImage: 'https://example.com/image.jpg',
      productType: 'CD',
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  const mockCreateCDDto: AdminCreateCDDto = {
    title: 'New Album',
    artist: 'New Artist',
    albumTitle: 'New Album Title',
    trackList: 'Track 1, Track 2, Track 3',
    category: 'Pop',
    releaseddate: new Date('2023-12-01'),
    price: 19.99,
    originalPrice: 24.99,
    stock: 5,
    coverImage: 'https://example.com/new-image.jpg',
    productType: ProductType.CD,
  };

  const mockUpdateCDDto: AdminUpdateCDDto = {
    title: 'Updated Album',
    price: 22.99,
    stock: 8,
  };

  const mockCDList = [mockCD];

  // Mock implementations
  const mockCDModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    new: jest.fn(),
    constructor: jest.fn(),
    exec: jest.fn(),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-value'),
  };

  const mockUploadService = {
    generateUploadPresignedUrl: jest.fn(),
    processImageUrls: jest.fn().mockResolvedValue(['https://example.com/processed-image.jpg']),
  };

  const mockProductActivityLogService = {
    logActivity: jest.fn(),
    getProductHistory: jest.fn(),
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
    cdModel = module.get<Model<CDDocument>>(getModelToken(CD.name));
    configService = module.get<ConfigService>(ConfigService);
    uploadService = module.get<UploadService>(UploadService);
    productActivityLogService = module.get<ProductActivityLogService>(ProductActivityLogService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllCD', () => {
    const mockQuery = {
      productType: 'CD',
      isAvailable: true,
    };

    beforeEach(() => {
      mockCDModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockCDList),
            }),
          }),
        }),
      });
      mockCDModel.countDocuments.mockResolvedValue(1);
    });

    it('should find all CDs with default filters', async () => {
      const filters: CDFilters = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAllCD(filters);

      expect(mockCDModel.countDocuments).toHaveBeenCalledWith(mockQuery);
      expect(mockCDModel.find).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual({
        cds: expect.any(Array),
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should handle pagination correctly', async () => {
      const filters: CDFilters = {
        page: 3,
        limit: 5,
      };

      const mockLimitChain = {
        exec: jest.fn().mockResolvedValue(mockCDList),
      };

      const mockSkipChain = {
        limit: jest.fn().mockReturnValue(mockLimitChain),
      };

      const mockSortChain = {
        skip: jest.fn().mockReturnValue(mockSkipChain),
      };

      const mockFindChain = {
        sort: jest.fn().mockReturnValue(mockSortChain),
      };

      mockCDModel.find.mockReturnValue(mockFindChain);

      await service.findAllCD(filters);

      expect(mockSortChain.skip).toHaveBeenCalledWith(10); // (3-1) * 5
      expect(mockSkipChain.limit).toHaveBeenCalledWith(5);
    });

    it('should calculate total pages correctly', async () => {
      mockCDModel.countDocuments.mockResolvedValue(23);
      
      const filters: CDFilters = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAllCD(filters);

      expect(result.totalPages).toBe(3); // Math.ceil(23 / 10)
      expect(result.total).toBe(23);
    });

    it('should handle empty results', async () => {
      mockCDModel.countDocuments.mockResolvedValue(0);
      mockCDModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const filters: CDFilters = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAllCD(filters);

      expect(result).toEqual({
        cds: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockCDModel.countDocuments.mockRejectedValue(dbError);

      const filters: CDFilters = {
        page: 1,
        limit: 10,
      };

      await expect(service.findAllCD(filters)).rejects.toThrow(dbError);
    });
  });
});
