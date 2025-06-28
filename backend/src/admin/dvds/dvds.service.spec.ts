import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { AdminDVDsService, DVDFilters } from './dvds.service';
import { DVD, DVDDocument } from '../../dvds/schemas/dvd.schema';
import { UploadService } from '../../upload/upload.service';
import { ProductActivityLogService } from '../activity-log/activity-log.service';
import { AdminCreateDVDDto } from './dto/admin-create-dvd.dto';
import { ProductType } from '../products/dto/create-product.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AdminDVDsService', () => {
  let service: AdminDVDsService;
  let dvdModel: Model<DVDDocument>;
  let configService: ConfigService;
  let uploadService: UploadService;
  let productActivityLogService: ProductActivityLogService;

  // Mock data
  const mockDVDId = '507f1f77bcf86cd799439013';
  const mockUserId = '507f1f77bcf86cd799439014';

  const mockDVD = {
    _id: mockDVDId,
    title: 'Test Movie',
    director: 'Test Director',
    disctype: 'Blu-ray',
    runtime: 120,
    studio: 'Test Studio',
    subtitles: 'English, Spanish',
    releaseddate: new Date('2023-01-01'),
    filmtype: 'Action',
    price: 12.99,
    originalPrice: 15.99,
    stock: 5,
    coverImage: 'https://example.com/dvd-image.jpg',
    productType: 'DVD',
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    toObject: jest.fn().mockReturnValue({
      _id: mockDVDId,
      title: 'Test Movie',
      director: 'Test Director',
      disctype: 'Blu-ray',
      runtime: 120,
      studio: 'Test Studio',
      subtitles: 'English, Spanish',
      releaseddate: new Date('2023-01-01'),
      filmtype: 'Action',
      price: 12.99,
      originalPrice: 15.99,
      stock: 5,
      coverImage: 'https://example.com/dvd-image.jpg',
      productType: 'DVD',
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  const mockCreateDVDDto: AdminCreateDVDDto = {
    title: 'New Movie',
    director: 'New Director',
    disctype: 'DVD',
    runtime: 95,
    studio: 'New Studio',
    subtitles: 'English',
    releaseddate: new Date('2023-12-01'),
    filmtype: 'Comedy',
    price: 14.99,
    originalPrice: 18.99,
    stock: 3,
    coverImage: 'https://example.com/new-dvd-image.jpg',
    productType: ProductType.DVD,
  };

  const mockDVDList = [mockDVD];

  // Mock implementations
  const mockDVDModel = {
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
    processImageUrl: jest.fn().mockResolvedValue('https://example.com/processed-image.jpg'),
  };

  const mockProductActivityLogService = {
    logActivity: jest.fn(),
    getProductHistory: jest.fn(),
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
    dvdModel = module.get<Model<DVDDocument>>(getModelToken(DVD.name));
    configService = module.get<ConfigService>(ConfigService);
    uploadService = module.get<UploadService>(UploadService);
    productActivityLogService = module.get<ProductActivityLogService>(ProductActivityLogService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllDVD', () => {
    const mockQuery = {
      productType: 'DVD',
      isAvailable: true,
    };

    beforeEach(() => {
      mockDVDModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockDVDList),
            }),
          }),
        }),
      });
      mockDVDModel.countDocuments.mockResolvedValue(1);
    });

    it('should find all DVDs with default filters', async () => {
      const filters: DVDFilters = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAllDVD(filters);

      expect(mockDVDModel.countDocuments).toHaveBeenCalledWith(mockQuery);
      expect(mockDVDModel.find).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual({
        dvds: expect.any(Array),
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should handle pagination correctly', async () => {
      const filters: DVDFilters = {
        page: 3,
        limit: 5,
      };

      const mockLimitChain = {
        exec: jest.fn().mockResolvedValue(mockDVDList),
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

      mockDVDModel.find.mockReturnValue(mockFindChain);

      await service.findAllDVD(filters);

      expect(mockSortChain.skip).toHaveBeenCalledWith(10); // (3-1) * 5
      expect(mockSkipChain.limit).toHaveBeenCalledWith(5);
    });

    it('should calculate total pages correctly', async () => {
      mockDVDModel.countDocuments.mockResolvedValue(18);
      
      const filters: DVDFilters = {
        page: 1,
        limit: 8,
      };

      const result = await service.findAllDVD(filters);

      expect(result.totalPages).toBe(3); // Math.ceil(18 / 8)
      expect(result.total).toBe(18);
    });

    it('should handle empty results', async () => {
      mockDVDModel.countDocuments.mockResolvedValue(0);
      mockDVDModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const filters: DVDFilters = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAllDVD(filters);

      expect(result).toEqual({
        dvds: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockDVDModel.countDocuments.mockRejectedValue(dbError);

      const filters: DVDFilters = {
        page: 1,
        limit: 10,
      };

      await expect(service.findAllDVD(filters)).rejects.toThrow(dbError);
    });
  });
});
