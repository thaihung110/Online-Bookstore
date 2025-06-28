import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CDsService } from './cds.service';
import { CD } from './schemas/cd.schema';
import { UploadService } from '../upload/upload.service';
import { NotFoundException } from '@nestjs/common';

describe('CDsService - View CD Details', () => {
  let service: CDsService;
  let mockCDModel: any;
  let mockUploadService: any;

  const mockCD = {
    _id: '507f1f77bcf86cd799439013',
    title: 'Test Album',
    artist: 'Test Artist',
    albumTitle: 'Test Album Title',
    category: 'Rock',
    trackList: 'Track 1, Track 2, Track 3',
    releaseddate: new Date('2023-06-01'),
    price: 15.99,
    originalPrice: 19.99,
    stock: 25,
    productType: 'CD',
    coverImage: 'test-cd-cover.jpg',
    toObject: jest.fn().mockReturnValue({
      _id: '507f1f77bcf86cd799439013',
      title: 'Test Album',
      artist: 'Test Artist',
      albumTitle: 'Test Album Title',
      category: 'Rock',
      trackList: 'Track 1, Track 2, Track 3',
      releaseddate: new Date('2023-06-01'),
      price: 15.99,
      originalPrice: 19.99,
      stock: 25,
      productType: 'CD',
      coverImage: 'test-cd-cover.jpg',
    }),
  };

  const processedImageUrl = 'https://processed-image-url.com/test-cd-cover.jpg';

  beforeEach(async () => {
    mockCDModel = {
      findOne: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    mockUploadService = {
      processImageUrl: jest.fn().mockResolvedValue(processedImageUrl),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CDsService,
        {
          provide: getModelToken(CD.name),
          useValue: mockCDModel,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    service = module.get<CDsService>(CDsService);
  });

  describe('findOne', () => {
    it('should return a CD when found with processed data', async () => {
      // Arrange
      mockCDModel.exec.mockResolvedValue(mockCD);

      // Act
      const result = await service.findOne(mockCD._id);

      // Assert
      expect(mockCDModel.findOne).toHaveBeenCalledWith({
        _id: mockCD._id,
        productType: 'CD',
      });
      expect(mockUploadService.processImageUrl).toHaveBeenCalledWith(mockCD.coverImage);
      
      // Verify CD-specific fields
      expect((result as any)._id).toBe(mockCD._id);
      expect(result.title).toBe(mockCD.title);
      expect(result.artist).toBe(mockCD.artist);
      expect(result.albumTitle).toBe(mockCD.albumTitle);
      expect(result.category).toBe(mockCD.category);
      expect(result.trackList).toBe(mockCD.trackList);
      expect(result.releaseddate).toEqual(mockCD.releaseddate);
      expect(result.productType).toBe('CD');
      
      // Verify processed image URL
      expect(result.coverImage).toBe(processedImageUrl);
      
      // Verify price calculations
      expect(result.originalPrice).toBe(mockCD.originalPrice);
      expect(result.price).toBe(mockCD.price);
    });

    it('should throw NotFoundException when CD not found', async () => {
      // Arrange
      const nonExistentId = '507f1f77bcf86cd799999999';
      mockCDModel.exec.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        `CD with ID "${nonExistentId}" not found`,
      );
      expect(mockCDModel.findOne).toHaveBeenCalledWith({
        _id: nonExistentId,
        productType: 'CD',
      });
    });

    it('should filter by productType CD only', async () => {
      // Arrange
      mockCDModel.exec.mockResolvedValue(mockCD);

      // Act
      await service.findOne(mockCD._id);

      // Assert
      expect(mockCDModel.findOne).toHaveBeenCalledWith({
        _id: mockCD._id,
        productType: 'CD',
      });
    });

    it('should handle CDs with missing price fields', async () => {
      // Arrange
      const cdWithoutPricing = {
        ...mockCD,
        toObject: jest.fn().mockReturnValue({
          ...mockCD.toObject(),
          price: undefined,
          originalPrice: 20.0,
        }),
      };
      mockCDModel.exec.mockResolvedValue(cdWithoutPricing);

      // Act
      const result = await service.findOne(mockCD._id);

      // Assert
      expect(result.originalPrice).toBe(20.0);
      // Should use originalPrice when price is missing and no discountRate
      expect(result.price).toBe(20.0);
    });

    it('should handle CDs with zero discount rate', async () => {
      // Arrange
      const cdWithoutDiscount = {
        ...mockCD,
        toObject: jest.fn().mockReturnValue({
          ...mockCD.toObject(),
          price: undefined,
          originalPrice: 15.99,
        }),
      };
      mockCDModel.exec.mockResolvedValue(cdWithoutDiscount);

      // Act
      const result = await service.findOne(mockCD._id);

      // Assert
      expect(result.originalPrice).toBe(15.99);
      expect(result.price).toBe(15.99); // No discount applied
    });

    it('should handle CDs with missing image', async () => {
      // Arrange
      const cdWithoutImage = {
        ...mockCD,
        toObject: jest.fn().mockReturnValue({
          ...mockCD.toObject(),
          coverImage: null,
        }),
      };
      mockCDModel.exec.mockResolvedValue(cdWithoutImage);
      mockUploadService.processImageUrl.mockResolvedValue(null);

      // Act
      const result = await service.findOne(mockCD._id);

      // Assert
      expect(mockUploadService.processImageUrl).toHaveBeenCalledWith(null);
      expect(result.coverImage).toBeNull();
    });

    it('should handle invalid ObjectId format', async () => {
      // Arrange
      const invalidId = 'invalid-cd-id';
      mockCDModel.exec.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(invalidId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockCDModel.findOne).toHaveBeenCalledWith({
        _id: invalidId,
        productType: 'CD',
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const validId = '507f1f77bcf86cd799439013';
      const dbError = new Error('Database connection failed');
      mockCDModel.exec.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.findOne(validId)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle image processing errors gracefully', async () => {
      // Arrange
      mockCDModel.exec.mockResolvedValue(mockCD);
      const imageError = new Error('Image processing failed');
      mockUploadService.processImageUrl.mockRejectedValue(imageError);

      // Act & Assert
      await expect(service.findOne(mockCD._id)).rejects.toThrow(
        'Image processing failed',
      );
    });

    it('should verify all CD-specific fields are present', async () => {
      // Arrange
      mockCDModel.exec.mockResolvedValue(mockCD);

      // Act
      const result = await service.findOne(mockCD._id);

      // Assert - CD-specific fields
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('artist');
      expect(result).toHaveProperty('albumTitle');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('trackList');
      expect(result).toHaveProperty('releaseddate');
      
      // Common product fields
      expect(result).toHaveProperty('_id');
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('originalPrice');
      expect(result).toHaveProperty('discountRate');
      expect(result).toHaveProperty('stock');
      expect(result).toHaveProperty('productType');
      expect(result).toHaveProperty('coverImage');
      
      // Verify data types
      expect(typeof result.title).toBe('string');
      expect(typeof result.artist).toBe('string');
      expect(typeof result.albumTitle).toBe('string');
      expect(typeof result.category).toBe('string');
      expect(typeof result.price).toBe('number');
    });

    it('should process CD data through processCDData helper', async () => {
      // Arrange
      mockCDModel.exec.mockResolvedValue(mockCD);

      // Act
      const result = await service.findOne(mockCD._id);

      // Assert
      expect(mockCD.toObject).toHaveBeenCalled();
      expect(mockUploadService.processImageUrl).toHaveBeenCalled();
      expect(result.coverImage).toBe(processedImageUrl);
    });

    it('should verify CD release date format', async () => {
      // Arrange
      mockCDModel.exec.mockResolvedValue(mockCD);

      // Act
      const result = await service.findOne(mockCD._id);

      // Assert
      expect(result.releaseddate).toBeInstanceOf(Date);
      expect(result.releaseddate.getFullYear()).toBe(2023);
      expect(result.releaseddate.getMonth()).toBe(5); // June (0-indexed)
    });

    it('should handle CDs with track list information', async () => {
      // Arrange
      mockCDModel.exec.mockResolvedValue(mockCD);

      // Act
      const result = await service.findOne(mockCD._id);

      // Assert
      expect(result.trackList).toBeDefined();
      expect(typeof result.trackList).toBe('string');
      expect(result.trackList.length).toBeGreaterThan(0);
    });

    it('should call database query exactly once with correct filter', async () => {
      // Arrange
      mockCDModel.exec.mockResolvedValue(mockCD);

      // Act
      await service.findOne(mockCD._id);

      // Assert
      expect(mockCDModel.findOne).toHaveBeenCalledTimes(1);
      expect(mockCDModel.exec).toHaveBeenCalledTimes(1);
      expect(mockCDModel.findOne).toHaveBeenCalledWith({
        _id: mockCD._id,
        productType: 'CD',
      });
    });
  });
});