import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DVDsService } from './dvds.service';
import { DVD } from './schemas/dvd.schema';
import { UploadService } from '../upload/upload.service';
import { NotFoundException } from '@nestjs/common';

describe('DVDsService - View DVD Details', () => {
  let service: DVDsService;
  let mockDVDModel: any;
  let mockUploadService: any;

  const mockDVD = {
    _id: '507f1f77bcf86cd799439014',
    title: 'Test Movie',
    director: 'Test Director',
    studio: 'Test Studios',
    filmtype: 'Action',
    disctype: 'Blu-ray',
    runtime: 120,
    releaseddate: new Date('2023-03-01'),
    price: 19.99,
    originalPrice: 24.99,
    stock: 15,
    productType: 'DVD',
    coverImage: 'test-dvd-cover.jpg',
    subtitles: 'English',
    toObject: jest.fn().mockReturnValue({
      _id: '507f1f77bcf86cd799439014',
      title: 'Test Movie',
      director: 'Test Director',
      studio: 'Test Studios',
      filmtype: 'Action',
      disctype: 'Blu-ray',
      runtime: 120,
      releaseddate: new Date('2023-03-01'),
      price: 19.99,
      originalPrice: 24.99,
      stock: 15,
      productType: 'DVD',
      coverImage: 'test-dvd-cover.jpg',
      subtitles: 'English',
    }),
  };

  const processedImageUrl = 'https://processed-image-url.com/test-dvd-cover.jpg';

  beforeEach(async () => {
    mockDVDModel = {
      findOne: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    mockUploadService = {
      processImageUrl: jest.fn().mockResolvedValue(processedImageUrl),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DVDsService,
        {
          provide: getModelToken(DVD.name),
          useValue: mockDVDModel,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    service = module.get<DVDsService>(DVDsService);
  });

  describe('findOne', () => {
    it('should return a DVD when found with processed data', async () => {
      // Arrange
      mockDVDModel.exec.mockResolvedValue(mockDVD);

      // Act
      const result = await service.findOne(mockDVD._id);

      // Assert
      expect(mockDVDModel.findOne).toHaveBeenCalledWith({
        _id: mockDVD._id,
        productType: 'DVD',
      });
      expect(mockUploadService.processImageUrl).toHaveBeenCalledWith(mockDVD.coverImage);
      
      // Verify DVD-specific fields
      expect((result as any)._id).toBe(mockDVD._id);
      expect(result.title).toBe(mockDVD.title);
      expect(result.director).toBe(mockDVD.director);
      expect(result.studio).toBe(mockDVD.studio);
      expect(result.filmtype).toBe(mockDVD.filmtype);
      expect(result.disctype).toBe(mockDVD.disctype);
      expect(result.runtime).toBe(mockDVD.runtime);
      expect(result.releaseddate).toEqual(mockDVD.releaseddate);
      expect(result.subtitles).toBe(mockDVD.subtitles);
      expect(result.productType).toBe('DVD');
      
      // Verify processed image URL
      expect(result.coverImage).toBe(processedImageUrl);
      
      // Verify price calculations
      expect(result.originalPrice).toBe(mockDVD.originalPrice);
      expect(result.price).toBe(mockDVD.price);
    });

    it('should throw NotFoundException when DVD not found', async () => {
      // Arrange
      const nonExistentId = '507f1f77bcf86cd799999999';
      mockDVDModel.exec.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        `DVD with ID "${nonExistentId}" not found`,
      );
      expect(mockDVDModel.findOne).toHaveBeenCalledWith({
        _id: nonExistentId,
        productType: 'DVD',
      });
    });

    it('should filter by productType DVD only', async () => {
      // Arrange
      mockDVDModel.exec.mockResolvedValue(mockDVD);

      // Act
      await service.findOne(mockDVD._id);

      // Assert
      expect(mockDVDModel.findOne).toHaveBeenCalledWith({
        _id: mockDVD._id,
        productType: 'DVD',
      });
    });

    it('should handle DVDs with missing price fields', async () => {
      // Arrange
      const dvdWithoutPricing = {
        ...mockDVD,
        toObject: jest.fn().mockReturnValue({
          ...mockDVD.toObject(),
          price: undefined,
          originalPrice: 25.0,
        }),
      };
      mockDVDModel.exec.mockResolvedValue(dvdWithoutPricing);

      // Act
      const result = await service.findOne(mockDVD._id);

      // Assert
      expect(result.originalPrice).toBe(25.0);
      // Should use originalPrice when price is missing
      expect(result.price).toBe(25.0);
    });

    it('should handle DVDs with zero discount rate', async () => {
      // Arrange
      const dvdWithoutDiscount = {
        ...mockDVD,
        toObject: jest.fn().mockReturnValue({
          ...mockDVD.toObject(),
          price: undefined,
          originalPrice: 19.99,
        }),
      };
      mockDVDModel.exec.mockResolvedValue(dvdWithoutDiscount);

      // Act
      const result = await service.findOne(mockDVD._id);

      // Assert
      expect(result.originalPrice).toBe(19.99);
      expect(result.price).toBe(19.99); // No discount applied
    });

    it('should handle DVDs with missing image', async () => {
      // Arrange
      const dvdWithoutImage = {
        ...mockDVD,
        toObject: jest.fn().mockReturnValue({
          ...mockDVD.toObject(),
          coverImage: null,
        }),
      };
      mockDVDModel.exec.mockResolvedValue(dvdWithoutImage);
      mockUploadService.processImageUrl.mockResolvedValue(null);

      // Act
      const result = await service.findOne(mockDVD._id);

      // Assert
      expect(mockUploadService.processImageUrl).toHaveBeenCalledWith(null);
      expect(result.coverImage).toBeNull();
    });

    it('should handle invalid ObjectId format', async () => {
      // Arrange
      const invalidId = 'invalid-dvd-id';
      mockDVDModel.exec.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(invalidId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockDVDModel.findOne).toHaveBeenCalledWith({
        _id: invalidId,
        productType: 'DVD',
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const validId = '507f1f77bcf86cd799439014';
      const dbError = new Error('Database connection failed');
      mockDVDModel.exec.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.findOne(validId)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle image processing errors gracefully', async () => {
      // Arrange
      mockDVDModel.exec.mockResolvedValue(mockDVD);
      const imageError = new Error('Image processing failed');
      mockUploadService.processImageUrl.mockRejectedValue(imageError);

      // Act & Assert
      await expect(service.findOne(mockDVD._id)).rejects.toThrow(
        'Image processing failed',
      );
    });

    it('should verify all DVD-specific fields are present', async () => {
      // Arrange
      mockDVDModel.exec.mockResolvedValue(mockDVD);

      // Act
      const result = await service.findOne(mockDVD._id);

      // Assert - DVD-specific fields
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('director');
      expect(result).toHaveProperty('studio');
      expect(result).toHaveProperty('filmtype');
      expect(result).toHaveProperty('disctype');
      expect(result).toHaveProperty('runtime');
      expect(result).toHaveProperty('releaseddate');
      expect(result).toHaveProperty('subtitles');
      
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
      expect(typeof result.director).toBe('string');
      expect(typeof result.studio).toBe('string');
      expect(typeof result.filmtype).toBe('string');
      expect(typeof result.disctype).toBe('string');
      expect(typeof result.runtime).toBe('number');
      expect(typeof result.subtitles).toBe('string');
      expect(typeof result.price).toBe('number');
      expect(result.runtime).toBeGreaterThan(0);
    });

    it('should process DVD data through processDVDData helper', async () => {
      // Arrange
      mockDVDModel.exec.mockResolvedValue(mockDVD);

      // Act
      const result = await service.findOne(mockDVD._id);

      // Assert
      expect(mockDVD.toObject).toHaveBeenCalled();
      expect(mockUploadService.processImageUrl).toHaveBeenCalled();
      expect(result.coverImage).toBe(processedImageUrl);
    });

    it('should verify DVD release date format', async () => {
      // Arrange
      mockDVDModel.exec.mockResolvedValue(mockDVD);

      // Act
      const result = await service.findOne(mockDVD._id);

      // Assert
      expect(result.releaseddate).toBeInstanceOf(Date);
      expect(result.releaseddate.getFullYear()).toBe(2023);
      expect(result.releaseddate.getMonth()).toBe(2); // March (0-indexed)
    });

    it('should handle different disc types', async () => {
      // Arrange
      const dvdWithDifferentDiscType = {
        ...mockDVD,
        toObject: jest.fn().mockReturnValue({
          ...mockDVD.toObject(),
          disctype: '4K UHD',
        }),
      };
      mockDVDModel.exec.mockResolvedValue(dvdWithDifferentDiscType);

      // Act
      const result = await service.findOne(mockDVD._id);

      // Assert
      expect(result.disctype).toBe('4K UHD');
      expect(['DVD', 'Blu-ray', '4K UHD', 'Blu-ray 3D']).toContain(result.disctype);
    });

    it('should handle different film types', async () => {
      // Arrange
      const dvdWithDifferentFilmType = {
        ...mockDVD,
        toObject: jest.fn().mockReturnValue({
          ...mockDVD.toObject(),
          filmtype: 'Comedy',
        }),
      };
      mockDVDModel.exec.mockResolvedValue(dvdWithDifferentFilmType);

      // Act
      const result = await service.findOne(mockDVD._id);

      // Assert
      expect(result.filmtype).toBe('Comedy');
      expect(typeof result.filmtype).toBe('string');
    });

    it('should verify runtime is a positive number', async () => {
      // Arrange
      mockDVDModel.exec.mockResolvedValue(mockDVD);

      // Act
      const result = await service.findOne(mockDVD._id);

      // Assert
      expect(result.runtime).toBe(120);
      expect(result.runtime).toBeGreaterThan(0);
      expect(typeof result.runtime).toBe('number');
    });

    it('should call database query exactly once with correct filter', async () => {
      // Arrange
      mockDVDModel.exec.mockResolvedValue(mockDVD);

      // Act
      await service.findOne(mockDVD._id);

      // Assert
      expect(mockDVDModel.findOne).toHaveBeenCalledTimes(1);
      expect(mockDVDModel.exec).toHaveBeenCalledTimes(1);
      expect(mockDVDModel.findOne).toHaveBeenCalledWith({
        _id: mockDVD._id,
        productType: 'DVD',
      });
    });
  });
});