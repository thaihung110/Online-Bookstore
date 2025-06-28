import { Test, TestingModule } from '@nestjs/testing';
import { CdsController } from './cds.controller';
import { AdminCDsService } from './cds.service';
import { UploadService } from '../../upload/upload.service';
import { AdminCreateCDDto } from './dto/admin-create-cd.dto';
import { AdminUpdateCDDto } from './dto/admin-update-cd.dto';
import { UploadPresignedUrlDto, UploadPresignedUrlResponseDto } from '../../upload/dto/upload-presigned-url.dto';
import { ProductType } from '../products/dto/create-product.dto';

describe('CdsController', () => {
  let controller: CdsController;
  let adminCDsService: AdminCDsService;
  let uploadService: UploadService;

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
    productType: ProductType.CD,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCDList = {
    cds: [mockCD],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
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

  const mockUploadDto: UploadPresignedUrlDto = {
    fileName: 'test-image.jpg',
    contentType: 'image/jpeg',
  };

  const mockUploadResponse: UploadPresignedUrlResponseDto = {
    uploadUrl: 'https://example.com/upload-url',
    s3Key: 'cd-covers/test-image.jpg',
    expiresIn: 300,
  };

  beforeEach(async () => {
    const mockAdminCDsService = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findAllCD: jest.fn(),
    };

    const mockUploadService = {
      generateUploadPresignedUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CdsController],
      providers: [
        {
          provide: AdminCDsService,
          useValue: mockAdminCDsService,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    controller = module.get<CdsController>(CdsController);
    adminCDsService = module.get<AdminCDsService>(AdminCDsService);
    uploadService = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUploadPresignedUrl', () => {
    it('should generate a presigned URL for CD image upload', async () => {
      jest.spyOn(uploadService, 'generateUploadPresignedUrl').mockResolvedValue(mockUploadResponse);

      const result = await controller.getUploadPresignedUrl(mockUploadDto);

      expect(uploadService.generateUploadPresignedUrl).toHaveBeenCalledWith(
        mockUploadDto.fileName,
        mockUploadDto.contentType,
      );
      expect(result).toEqual(mockUploadResponse);
    });

    it('should handle upload service errors', async () => {
      const error = new Error('Invalid file type');
      jest.spyOn(uploadService, 'generateUploadPresignedUrl').mockRejectedValue(error);

      await expect(controller.getUploadPresignedUrl(mockUploadDto)).rejects.toThrow(error);
    });
  });

  describe('create', () => {
    it('should create a new CD successfully', async () => {
      jest.spyOn(adminCDsService, 'create').mockResolvedValue(mockCD as any);

      const result = await controller.create(mockUserId, mockCreateCDDto);

      expect(adminCDsService.create).toHaveBeenCalledWith(mockUserId, mockCreateCDDto);
      expect(result).toEqual(mockCD);
    });

    it('should handle validation errors when creating a CD', async () => {
      const validationError = new Error('Validation failed');
      jest.spyOn(adminCDsService, 'create').mockRejectedValue(validationError);

      await expect(controller.create(mockUserId, mockCreateCDDto)).rejects.toThrow(validationError);
    });

    it('should handle service errors when creating a CD', async () => {
      const serviceError = new Error('Database connection failed');
      jest.spyOn(adminCDsService, 'create').mockRejectedValue(serviceError);

      await expect(controller.create(mockUserId, mockCreateCDDto)).rejects.toThrow(serviceError);
    });
  });

  describe('findById', () => {
    it('should find a CD by ID successfully', async () => {
      jest.spyOn(adminCDsService, 'findById').mockResolvedValue(mockCD as any);

      const result = await controller.findById(mockCDId);

      expect(adminCDsService.findById).toHaveBeenCalledWith(mockCDId);
      expect(result).toEqual(mockCD);
    });

    it('should handle CD not found error', async () => {
      const notFoundError = new Error('CD not found');
      jest.spyOn(adminCDsService, 'findById').mockRejectedValue(notFoundError);

      await expect(controller.findById('nonexistent-id')).rejects.toThrow(notFoundError);
    });

    it('should handle invalid ID format', async () => {
      const invalidIdError = new Error('Invalid ID format');
      jest.spyOn(adminCDsService, 'findById').mockRejectedValue(invalidIdError);

      await expect(controller.findById('invalid-id')).rejects.toThrow(invalidIdError);
    });
  });

  describe('update', () => {
    it('should update a CD successfully', async () => {
      const updatedCD = { ...mockCD, ...mockUpdateCDDto };
      jest.spyOn(adminCDsService, 'update').mockResolvedValue(updatedCD as any);

      const result = await controller.update(mockUserId, mockCDId, mockUpdateCDDto);

      expect(adminCDsService.update).toHaveBeenCalledWith(mockUserId, mockCDId, mockUpdateCDDto);
      expect(result).toEqual(updatedCD);
    });

    it('should handle CD not found error during update', async () => {
      const notFoundError = new Error('CD not found');
      jest.spyOn(adminCDsService, 'update').mockRejectedValue(notFoundError);

      await expect(controller.update(mockUserId, 'nonexistent-id', mockUpdateCDDto))
        .rejects.toThrow(notFoundError);
    });

    it('should handle validation errors during update', async () => {
      const validationError = new Error('Invalid update data');
      jest.spyOn(adminCDsService, 'update').mockRejectedValue(validationError);

      await expect(controller.update(mockUserId, mockCDId, mockUpdateCDDto))
        .rejects.toThrow(validationError);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { price: 25.99 };
      const updatedCD = { ...mockCD, price: 25.99 };
      jest.spyOn(adminCDsService, 'update').mockResolvedValue(updatedCD as any);

      const result = await controller.update(mockUserId, mockCDId, partialUpdate);

      expect(adminCDsService.update).toHaveBeenCalledWith(mockUserId, mockCDId, partialUpdate);
      expect(result).toEqual(updatedCD);
    });
  });

  describe('findAll', () => {
    it('should find all CDs with default parameters', async () => {
      jest.spyOn(adminCDsService, 'findAllCD').mockResolvedValue(mockCDList as any);

      const result = await controller.findAll();

      expect(adminCDsService.findAllCD).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        artist: undefined,
        albumTitle: undefined,
        releasedDateStart: undefined,
        releasedDateEnd: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        inStock: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(result).toEqual(mockCDList);
    });

    it('should find all CDs with custom pagination', async () => {
      jest.spyOn(adminCDsService, 'findAllCD').mockResolvedValue(mockCDList as any);

      const result = await controller.findAll(2, 20);

      expect(adminCDsService.findAllCD).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        search: undefined,
        artist: undefined,
        albumTitle: undefined,
        releasedDateStart: undefined,
        releasedDateEnd: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        inStock: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(result).toEqual(mockCDList);
    });

    it('should find all CDs with search filter', async () => {
      jest.spyOn(adminCDsService, 'findAllCD').mockResolvedValue(mockCDList as any);

      const result = await controller.findAll(1, 10, 'Test Album');

      expect(adminCDsService.findAllCD).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'Test Album',
        artist: undefined,
        albumTitle: undefined,
        releasedDateStart: undefined,
        releasedDateEnd: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        inStock: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(result).toEqual(mockCDList);
    });

    it('should find all CDs with artist filter', async () => {
      jest.spyOn(adminCDsService, 'findAllCD').mockResolvedValue(mockCDList as any);

      const result = await controller.findAll(1, 10, undefined, 'Test Artist');

      expect(adminCDsService.findAllCD).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        artist: 'Test Artist',
        albumTitle: undefined,
        releasedDateStart: undefined,
        releasedDateEnd: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        inStock: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(result).toEqual(mockCDList);
    });

    it('should find all CDs with price range filters', async () => {
      jest.spyOn(adminCDsService, 'findAllCD').mockResolvedValue(mockCDList as any);

      const result = await controller.findAll(1, 10, undefined, undefined, undefined, undefined, undefined, 10, 25);

      expect(adminCDsService.findAllCD).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        artist: undefined,
        albumTitle: undefined,
        releasedDateStart: undefined,
        releasedDateEnd: undefined,
        minPrice: 10,
        maxPrice: 25,
        inStock: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(result).toEqual(mockCDList);
    });

    it('should find all CDs with date range filters', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      jest.spyOn(adminCDsService, 'findAllCD').mockResolvedValue(mockCDList as any);

      const result = await controller.findAll(1, 10, undefined, undefined, undefined, startDate, endDate);

      expect(adminCDsService.findAllCD).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        artist: undefined,
        albumTitle: undefined,
        releasedDateStart: startDate,
        releasedDateEnd: endDate,
        minPrice: undefined,
        maxPrice: undefined,
        inStock: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(result).toEqual(mockCDList);
    });

    it('should find all CDs with stock filter', async () => {
      jest.spyOn(adminCDsService, 'findAllCD').mockResolvedValue(mockCDList as any);

      const result = await controller.findAll(1, 10, undefined, undefined, undefined, undefined, undefined, undefined, undefined, true);

      expect(adminCDsService.findAllCD).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        artist: undefined,
        albumTitle: undefined,
        releasedDateStart: undefined,
        releasedDateEnd: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        inStock: true,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(result).toEqual(mockCDList);
    });

    it('should find all CDs with custom sorting', async () => {
      jest.spyOn(adminCDsService, 'findAllCD').mockResolvedValue(mockCDList as any);

      const result = await controller.findAll(1, 10, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'price', 'asc');

      expect(adminCDsService.findAllCD).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        artist: undefined,
        albumTitle: undefined,
        releasedDateStart: undefined,
        releasedDateEnd: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        inStock: undefined,
        sortBy: 'price',
        sortOrder: 'asc',
      });
      expect(result).toEqual(mockCDList);
    });

    it('should handle all filters combined', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      jest.spyOn(adminCDsService, 'findAllCD').mockResolvedValue(mockCDList as any);

      const result = await controller.findAll(
        2, 20, 'search term', 'artist name', 'album title',
        startDate, endDate, 10, 30, true, 'title', 'asc'
      );

      expect(adminCDsService.findAllCD).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        search: 'search term',
        artist: 'artist name',
        albumTitle: 'album title',
        releasedDateStart: startDate,
        releasedDateEnd: endDate,
        minPrice: 10,
        maxPrice: 30,
        inStock: true,
        sortBy: 'title',
        sortOrder: 'asc',
      });
      expect(result).toEqual(mockCDList);
    });

    it('should handle service errors during findAll', async () => {
      const serviceError = new Error('Database query failed');
      jest.spyOn(adminCDsService, 'findAllCD').mockRejectedValue(serviceError);

      await expect(controller.findAll()).rejects.toThrow(serviceError);
    });
  });

  // Additional edge case tests
  describe('Edge Cases', () => {
    it('should handle empty string parameters', async () => {
      jest.spyOn(adminCDsService, 'findAllCD').mockResolvedValue(mockCDList as any);

      const result = await controller.findAll(1, 10, '', '');

      expect(adminCDsService.findAllCD).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: '',
        artist: '',
        albumTitle: undefined,
        releasedDateStart: undefined,
        releasedDateEnd: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        inStock: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('should handle zero price filters', async () => {
      jest.spyOn(adminCDsService, 'findAllCD').mockResolvedValue(mockCDList as any);

      const result = await controller.findAll(1, 10, undefined, undefined, undefined, undefined, undefined, 0, 0);

      expect(adminCDsService.findAllCD).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        artist: undefined,
        albumTitle: undefined,
        releasedDateStart: undefined,
        releasedDateEnd: undefined,
        minPrice: 0,
        maxPrice: 0,
        inStock: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('should handle false boolean filter', async () => {
      jest.spyOn(adminCDsService, 'findAllCD').mockResolvedValue(mockCDList as any);

      const result = await controller.findAll(1, 10, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false);

      expect(adminCDsService.findAllCD).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        artist: undefined,
        albumTitle: undefined,
        releasedDateStart: undefined,
        releasedDateEnd: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        inStock: false,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });
  });
});
