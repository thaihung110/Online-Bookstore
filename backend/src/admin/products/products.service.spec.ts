import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { AdminProductsService } from './products.service';
import { Product, ProductDocument } from '../../products/schemas/product.schema';
import { UploadService } from '../../upload/upload.service';
import { ProductActivityLogService } from '../activity-log/activity-log.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AdminProductsService', () => {
  let service: AdminProductsService<Product, ProductDocument>;
  let productModel: Model<ProductDocument>;
  let configService: ConfigService;
  let uploadService: UploadService;
  let productActivityLogService: ProductActivityLogService;

  // Mock data
  const mockProductId = '507f1f77bcf86cd799439011';
  const mockUserId = '507f1f77bcf86cd799439012';

  const mockProduct = {
    _id: mockProductId,
    title: 'Test Product',
    price: 19.99,
    originalPrice: 24.99,
    stock: 10,
    coverImage: 'https://example.com/image.jpg',
    productType: 'BOOK',
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    toObject: jest.fn().mockReturnValue({
      _id: mockProductId,
      title: 'Test Product',
      price: 19.99,
      originalPrice: 24.99,
      stock: 10,
      coverImage: 'https://example.com/image.jpg',
      productType: 'BOOK',
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  const mockDeletedProduct = {
    _id: mockProductId,
    title: 'Test Product',
    price: 19.99,
    originalPrice: 24.99,
    stock: 10,
    coverImage: 'https://example.com/image.jpg',
    productType: 'BOOK',
    isAvailable: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateProductDto: CreateProductDto = {
    title: 'New Product',
    price: 15.99,
    originalPrice: 19.99,
    stock: 5,
    coverImage: 'https://example.com/new-image.jpg',
  };

  const mockUpdateProductDto: UpdateProductDto = {
    title: 'Updated Product',
    price: 22.99,
    stock: 8,
  };

  // Mock implementations - create a proper jest mock function with all static methods
  const MockProductModel: any = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: mockProductId,
    save: jest.fn().mockResolvedValue({
      ...mockProduct,
      ...data,
      _id: mockProductId,
    }),
    toObject: jest.fn().mockReturnValue({
      ...mockProduct,
      ...data,
      _id: mockProductId,
    }),
  }));

  // Add static methods to the mock constructor
  MockProductModel.find = jest.fn();
  MockProductModel.findOne = jest.fn();
  MockProductModel.findById = jest.fn();
  MockProductModel.findByIdAndUpdate = jest.fn();
  MockProductModel.findByIdAndDelete = jest.fn();
  MockProductModel.updateMany = jest.fn();
  MockProductModel.countDocuments = jest.fn();
  MockProductModel.create = jest.fn();
  MockProductModel.exec = jest.fn();
  MockProductModel.sort = jest.fn();
  MockProductModel.skip = jest.fn();
  MockProductModel.limit = jest.fn();
  MockProductModel.select = jest.fn();
  MockProductModel.save = jest.fn();

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-value'),
  };

  const mockUploadService = {
    generateUploadPresignedUrl: jest.fn(),
    processImageUrl: jest.fn().mockResolvedValue('https://example.com/processed-image.jpg'),
  };

  const mockProductActivityLogService = {
    logActivity: jest.fn(),
    findByUserId: jest.fn(),
    countDeletedProductsByUserIdAndDate: jest.fn().mockResolvedValue(0),
    countUpdatedPriceProductsByUserIdAndDate: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AdminProductsService,
          useFactory: (productModel, configService, uploadService, productActivityLogService) => {
            return new AdminProductsService(productModel, configService, uploadService, productActivityLogService);
          },
          inject: [
            getModelToken(Product.name),
            ConfigService,
            UploadService,
            ProductActivityLogService,
          ],
        },
        {
          provide: getModelToken(Product.name),
          useValue: MockProductModel,
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

    service = module.get<AdminProductsService<Product, ProductDocument>>(AdminProductsService);
    productModel = module.get<Model<ProductDocument>>(getModelToken(Product.name));
    configService = module.get<ConfigService>(ConfigService);
    uploadService = module.get<UploadService>(UploadService);
    productActivityLogService = module.get<ProductActivityLogService>(ProductActivityLogService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('delete', () => {
    it('should delete a product successfully', async () => {
      MockProductModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });
      MockProductModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockProduct, isAvailable: false }),
      });

      await service.delete(mockUserId, mockProductId);

      expect(MockProductModel.findOne).toHaveBeenCalledWith({
        _id: mockProductId,
        isAvailable: true,
      });
      expect(MockProductModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockProductId,
        { isAvailable: false, updatedAt: expect.any(Date) },
        { new: true }
      );
      expect(mockProductActivityLogService.logActivity).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      MockProductModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.delete(mockUserId, 'nonexistent-id')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.delete(mockUserId, 'nonexistent-id')).rejects.toThrow(
        'Product with ID nonexistent-id not found or has already been'
      );
    });

    it('should throw NotFoundException when product is already deleted (isAvailable = false)', async () => {
      MockProductModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null), // Product with isAvailable: true not found
      });

      await expect(service.delete(mockUserId, mockProductId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when daily delete limit is exceeded', async () => {
      MockProductModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });
      mockProductActivityLogService.countDeletedProductsByUserIdAndDate.mockResolvedValue(10);

      await expect(service.delete(mockUserId, mockProductId)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.delete(mockUserId, mockProductId)).rejects.toThrow(
        'You can only delete up to 30 products per day'
      );
    });

    it('should throw NotFoundException when findByIdAndUpdate returns null', async () => {
      MockProductModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });
      MockProductModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      // Ensure daily limit check passes
      mockProductActivityLogService.countDeletedProductsByUserIdAndDate.mockResolvedValue(0);

      await expect(service.delete(mockUserId, mockProductId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.delete(mockUserId, mockProductId)).rejects.toThrow(
        'Product with ID'
      );
    });
  });

  describe('deleteMany', () => {
    const mockIds = [mockProductId, '507f1f77bcf86cd799439013'];

    it('should delete multiple products successfully', async () => {
      MockProductModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockProduct, { ...mockProduct, _id: mockIds[1] }]),
      });
      MockProductModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
      });

      await service.deleteMany(mockUserId, mockIds);

      expect(MockProductModel.find).toHaveBeenCalledWith({
        _id: { $in: mockIds },
        isAvailable: true,
      });
      expect(MockProductModel.updateMany).toHaveBeenCalledWith(
        { _id: { $in: mockIds } },
        { isAvailable: false, updatedAt: expect.any(Date) },
        { multi: true }
      );
      expect(mockProductActivityLogService.logActivity).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException when no product IDs provided', async () => {
      await expect(service.deleteMany(mockUserId, [])).rejects.toThrow(
        BadRequestException
      );
      await expect(service.deleteMany(mockUserId, [])).rejects.toThrow(
        'No product IDs provided for deletion'
      );
    });

    it('should throw BadRequestException when more than 10 products provided', async () => {
      const tooManyIds = Array.from({ length: 11 }, (_, i) => `id${i}`);

      await expect(service.deleteMany(mockUserId, tooManyIds)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.deleteMany(mockUserId, tooManyIds)).rejects.toThrow(
        'You can only delete up to 30 products at a time'
      );
    });

    it('should throw NotFoundException when some products do not exist', async () => {
      MockProductModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockProduct]), // Only 1 product found out of 2
      });

      await expect(service.deleteMany(mockUserId, mockIds)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.deleteMany(mockUserId, mockIds)).rejects.toThrow(
        'Products with the provided IDs not found or have already been deleted'
      );
    });

    it('should throw NotFoundException when no products exist', async () => {
      MockProductModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      await expect(service.deleteMany(mockUserId, mockIds)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when daily delete limit would be exceeded', async () => {
      MockProductModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockProduct, { ...mockProduct, _id: mockIds[1] }]),
      });
      mockProductActivityLogService.countDeletedProductsByUserIdAndDate.mockResolvedValue(29); // 29 + 2 = 31 > 30

      await expect(service.deleteMany(mockUserId, mockIds)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.deleteMany(mockUserId, mockIds)).rejects.toThrow(
        'You can only delete up to 30 products per day'
      );
    });

    it('should throw NotFoundException when updateMany modifies no documents', async () => {
      MockProductModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockProduct, { ...mockProduct, _id: mockIds[1] }]),
      });
      MockProductModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      });
      // Ensure daily limit check passes
      mockProductActivityLogService.countDeletedProductsByUserIdAndDate.mockResolvedValue(0);

      await expect(service.deleteMany(mockUserId, mockIds)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.deleteMany(mockUserId, mockIds)).rejects.toThrow(
        'No products found with the provided IDs'
      );
    });
  });

  describe('findById', () => {
    it('should find a product by ID successfully', async () => {
      MockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      const result = await service.findById(mockProductId);

      expect(MockProductModel.findById).toHaveBeenCalledWith(mockProductId);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      MockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        'Product with ID nonexistent-id not found or is deleted'
      );
    });

    it('should throw NotFoundException when product is deleted (isAvailable = false)', async () => {
      MockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDeletedProduct),
      });

      await expect(service.findById(mockProductId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findById(mockProductId)).rejects.toThrow(
        'Product with ID'
      );
    });
  });

  describe('findGeneralInfo', () => {
    it('should find general product info successfully', async () => {
      MockProductModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProduct),
        }),
      });

      const result = await service.findGeneralInfo(mockProductId);

      expect(MockProductModel.findById).toHaveBeenCalledWith(mockProductId);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      MockProductModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findGeneralInfo('nonexistent-id')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findGeneralInfo('nonexistent-id')).rejects.toThrow(
        'Product with ID nonexistent-id not found'
      );
    });

    it('should throw NotFoundException when product is not available (isAvailable = false)', async () => {
      MockProductModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockDeletedProduct),
        }),
      });

      await expect(service.findGeneralInfo(mockProductId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findGeneralInfo(mockProductId)).rejects.toThrow(
        'Product with ID'
      );
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      // Mock findById for checking if product exists
      MockProductModel.findById
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockProduct),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue({
            ...mockProduct,
            save: jest.fn().mockResolvedValue({ ...mockProduct, ...mockUpdateProductDto }),
          }),
        });

      // Mock findOne for checking if product is deleted
      MockProductModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.update(mockUserId, mockProductId, mockUpdateProductDto);

      expect(result).toBeDefined();
      expect(mockProductActivityLogService.logActivity).toHaveBeenCalled();
    });

    it('should throw NotFoundException when trying to update deleted product', async () => {
      // Mock findById to return product (for first check)
      MockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      // Mock findOne to return deleted product
      MockProductModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDeletedProduct),
      });

      await expect(service.update(mockUserId, mockProductId, mockUpdateProductDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.update(mockUserId, mockProductId, mockUpdateProductDto)).rejects.toThrow(
        'Product with ID'
      );
    });

    it('should throw BadRequestException when price ratio is invalid', async () => {
      const invalidPriceDto = {
        price: 5, // Too low compared to originalPrice
        originalPrice: 25,
      };

      // Mock findById
      MockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      // Mock findOne for deleted check
      MockProductModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update(mockUserId, mockProductId, invalidPriceDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.update(mockUserId, mockProductId, invalidPriceDto)).rejects.toThrow(
        'Price must be between 30% and 150% of the original price'
      );
    });

    it('should throw BadRequestException when price update limit is exceeded', async () => {
      const priceUpdateDto = {
        price: 25.99, // Different from current price
      };

      // Mock findById
      MockProductModel.findById
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockProduct),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockProduct),
        });

      // Mock findOne for deleted check
      MockProductModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Mock price update count to exceed limit
      mockProductActivityLogService.countUpdatedPriceProductsByUserIdAndDate.mockResolvedValue(2);

      await expect(service.update(mockUserId, mockProductId, priceUpdateDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.update(mockUserId, mockProductId, priceUpdateDto)).rejects.toThrow(
        'You can only update the price of a product up to 2 times per day'
      );
    });
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const result = await service.create(mockUserId, mockCreateProductDto);

      expect(MockProductModel).toHaveBeenCalledWith(expect.objectContaining({
        ...mockCreateProductDto,
        isAvailable: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      }));
      expect(mockProductActivityLogService.logActivity).toHaveBeenCalledWith(
        mockUserId,
        mockProductId,
        'create',
        expect.any(Date)
      );
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when price ratio is invalid', async () => {
      const invalidCreateDto = {
        ...mockCreateProductDto,
        price: 5,
        originalPrice: 25,
      };

      await expect(service.create(mockUserId, invalidCreateDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.create(mockUserId, invalidCreateDto)).rejects.toThrow(
        'Price must be between 30% and 150% of the original price'
      );
    });
  });
});
