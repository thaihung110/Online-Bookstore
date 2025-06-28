import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { Product } from './schemas/product.schema';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService - View Product Details', () => {
  let service: ProductsService;
  let mockProductModel: any;

  const mockProduct = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Product',
    price: 29.99,
    originalPrice: 29.99,
    isAvailable: true,
    stock: 10,
    productType: 'product',
  };

  const mockUnavailableProduct = {
    _id: '507f1f77bcf86cd799439012',
    title: 'Unavailable Product',
    price: 19.99,
    originalPrice: 19.99,
    isAvailable: false,
    stock: 0,
    productType: 'product',
  };

  beforeEach(async () => {
    mockProductModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('findOne', () => {
    it('should return a product when found and available', async () => {
      // Arrange
      mockProductModel.exec.mockResolvedValue(mockProduct);

      // Act
      const result = await service.findOne(mockProduct._id);

      // Assert
      expect(mockProductModel.findById).toHaveBeenCalledWith(mockProduct._id);
      expect(result).toEqual(mockProduct);
      expect(result._id).toBe(mockProduct._id);
      expect(result.title).toBe(mockProduct.title);
      expect(result.price).toBe(mockProduct.price);
      expect(result.isAvailable).toBe(true);
    });

    it('should throw NotFoundException when product not found', async () => {
      // Arrange
      const nonExistentId = '507f1f77bcf86cd799999999';
      mockProductModel.exec.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        `Product with ID ${nonExistentId} not found or not available`,
      );
      expect(mockProductModel.findById).toHaveBeenCalledWith(nonExistentId);
    });

    it('should throw NotFoundException when product is not available', async () => {
      // Arrange
      mockProductModel.exec.mockResolvedValue(mockUnavailableProduct);

      // Act & Assert
      await expect(service.findOne(mockUnavailableProduct._id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(mockUnavailableProduct._id)).rejects.toThrow(
        `Product with ID ${mockUnavailableProduct._id} not found or not available`,
      );
      expect(mockProductModel.findById).toHaveBeenCalledWith(mockUnavailableProduct._id);
    });

    it('should handle invalid ObjectId format', async () => {
      // Arrange
      const invalidId = 'invalid-id-format';
      mockProductModel.exec.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(invalidId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockProductModel.findById).toHaveBeenCalledWith(invalidId);
    });

    it('should handle empty string ID', async () => {
      // Arrange
      const emptyId = '';
      mockProductModel.exec.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(emptyId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockProductModel.findById).toHaveBeenCalledWith(emptyId);
    });

    it('should handle database errors', async () => {
      // Arrange
      const validId = '507f1f77bcf86cd799439011';
      const dbError = new Error('Database connection failed');
      mockProductModel.exec.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.findOne(validId)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockProductModel.findById).toHaveBeenCalledWith(validId);
    });

    it('should verify product data integrity', async () => {
      // Arrange
      mockProductModel.exec.mockResolvedValue(mockProduct);

      // Act
      const result = await service.findOne(mockProduct._id);

      // Assert - Verify all expected fields are present
      expect(result).toHaveProperty('_id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('originalPrice');
      expect(result).toHaveProperty('isAvailable');
      expect(result).toHaveProperty('stock');
      expect(result).toHaveProperty('productType');
      
      // Verify data types
      expect(typeof result._id).toBe('string');
      expect(typeof result.title).toBe('string');
      expect(typeof result.price).toBe('number');
      expect(typeof result.originalPrice).toBe('number');
      expect(typeof result.isAvailable).toBe('boolean');
      expect(typeof result.stock).toBe('number');
      expect(typeof result.productType).toBe('string');
    });

    it('should call database query exactly once', async () => {
      // Arrange
      mockProductModel.exec.mockResolvedValue(mockProduct);

      // Act
      await service.findOne(mockProduct._id);

      // Assert
      expect(mockProductModel.findById).toHaveBeenCalledTimes(1);
      expect(mockProductModel.exec).toHaveBeenCalledTimes(1);
    });
  });
});