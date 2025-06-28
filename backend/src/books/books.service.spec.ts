import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BooksService } from './books.service';
import { Book } from './schemas/book.schema';
import { UploadService } from '../upload/upload.service';
import { NotFoundException } from '@nestjs/common';

describe('BooksService - View Book Details', () => {
  let service: BooksService;
  let mockBookModel: any;
  let mockUploadService: any;

  const mockBook = {
    _id: '507f1f77bcf86cd799439012',
    title: 'Test Book',
    author: 'Test Author',
    isbn: '978-0123456789',
    genres: ['Fiction'],
    pageCount: 300,
    publisher: 'Test Publisher',
    publicationYear: 2023,
    language: 'English',
    price: 25.99,
    originalPrice: 29.99,
    discountRate: 15,
    stock: 10,
    productType: 'BOOK',
    coverImage: 'test-image.jpg',
    description: 'A test book description',
    toObject: jest.fn().mockReturnValue({
      _id: '507f1f77bcf86cd799439012',
      title: 'Test Book',
      author: 'Test Author',
      isbn: '978-0123456789',
      genres: ['Fiction'],
      pageCount: 300,
      publisher: 'Test Publisher',
      publicationYear: 2023,
      language: 'English',
      price: 25.99,
      originalPrice: 29.99,
      discountRate: 15,
      stock: 10,
      productType: 'BOOK',
      coverImage: 'test-image.jpg',
      description: 'A test book description',
    }),
  };

  const processedImageUrl = 'https://processed-image-url.com/test-image.jpg';

  beforeEach(async () => {
    mockBookModel = {
      findOne: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    mockUploadService = {
      processImageUrl: jest.fn().mockResolvedValue(processedImageUrl),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getModelToken(Book.name),
          useValue: mockBookModel,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
  });

  describe('findOne', () => {
    it('should return a book when found with processed data', async () => {
      // Arrange
      mockBookModel.exec.mockResolvedValue(mockBook);

      // Act
      const result = await service.findOne(mockBook._id);

      // Assert
      expect(mockBookModel.findOne).toHaveBeenCalledWith({
        _id: mockBook._id,
        productType: 'BOOK',
      });
      expect(mockUploadService.processImageUrl).toHaveBeenCalledWith(mockBook.coverImage);
      
      // Verify book-specific fields
      expect((result as any)._id).toBe(mockBook._id);
      expect(result.title).toBe(mockBook.title);
      expect(result.author).toBe(mockBook.author);
      expect(result.isbn).toBe(mockBook.isbn);
      expect(result.genres).toEqual(mockBook.genres);
      expect(result.pageCount).toBe(mockBook.pageCount);
      expect(result.publisher).toBe(mockBook.publisher);
      expect(result.language).toBe(mockBook.language);
      expect(result.productType).toBe('BOOK');
      
      // Verify processed image URL
      expect(result.coverImage).toBe(processedImageUrl);
      
      // Verify price calculations
      expect(result.originalPrice).toBe(mockBook.originalPrice);
      expect(result.discountRate).toBe(mockBook.discountRate);
      expect(result.price).toBe(mockBook.price);
    });

    it('should throw NotFoundException when book not found', async () => {
      // Arrange
      const nonExistentId = '507f1f77bcf86cd799999999';
      mockBookModel.exec.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        `Book with ID "${nonExistentId}" not found`,
      );
      expect(mockBookModel.findOne).toHaveBeenCalledWith({
        _id: nonExistentId,
        productType: 'BOOK',
      });
    });

    it('should filter by productType BOOK only', async () => {
      // Arrange
      mockBookModel.exec.mockResolvedValue(mockBook);

      // Act
      await service.findOne(mockBook._id);

      // Assert
      expect(mockBookModel.findOne).toHaveBeenCalledWith({
        _id: mockBook._id,
        productType: 'BOOK',
      });
    });

    it('should handle books with missing price fields', async () => {
      // Arrange
      const bookWithoutPricing = {
        ...mockBook,
        toObject: jest.fn().mockReturnValue({
          ...mockBook.toObject(),
          price: undefined,
          originalPrice: 30.0,
          discountRate: 10,
        }),
      };
      mockBookModel.exec.mockResolvedValue(bookWithoutPricing);

      // Act
      const result = await service.findOne(mockBook._id);

      // Assert
      expect(result.originalPrice).toBe(30.0);
      expect(result.discountRate).toBe(10);
      // Should calculate price from originalPrice and discountRate
      expect(result.price).toBe(27.0); // 30 * (1 - 10/100)
    });

    it('should handle books with zero discount rate', async () => {
      // Arrange
      const bookWithoutDiscount = {
        ...mockBook,
        toObject: jest.fn().mockReturnValue({
          ...mockBook.toObject(),
          price: undefined,
          originalPrice: 25.99,
          discountRate: 0,
        }),
      };
      mockBookModel.exec.mockResolvedValue(bookWithoutDiscount);

      // Act
      const result = await service.findOne(mockBook._id);

      // Assert
      expect(result.originalPrice).toBe(25.99);
      expect(result.discountRate).toBe(0);
      expect(result.price).toBe(25.99); // No discount applied
    });

    it('should handle books with missing image', async () => {
      // Arrange
      const bookWithoutImage = {
        ...mockBook,
        toObject: jest.fn().mockReturnValue({
          ...mockBook.toObject(),
          coverImage: null,
        }),
      };
      mockBookModel.exec.mockResolvedValue(bookWithoutImage);
      mockUploadService.processImageUrl.mockResolvedValue(null);

      // Act
      const result = await service.findOne(mockBook._id);

      // Assert
      expect(mockUploadService.processImageUrl).toHaveBeenCalledWith(null);
      expect(result.coverImage).toBeNull();
    });

    it('should handle invalid ObjectId format', async () => {
      // Arrange
      const invalidId = 'invalid-book-id';
      mockBookModel.exec.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(invalidId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockBookModel.findOne).toHaveBeenCalledWith({
        _id: invalidId,
        productType: 'BOOK',
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const validId = '507f1f77bcf86cd799439012';
      const dbError = new Error('Database connection failed');
      mockBookModel.exec.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.findOne(validId)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle image processing errors gracefully', async () => {
      // Arrange
      mockBookModel.exec.mockResolvedValue(mockBook);
      const imageError = new Error('Image processing failed');
      mockUploadService.processImageUrl.mockRejectedValue(imageError);

      // Act & Assert
      await expect(service.findOne(mockBook._id)).rejects.toThrow(
        'Image processing failed',
      );
    });

    it('should verify all book-specific fields are present', async () => {
      // Arrange
      mockBookModel.exec.mockResolvedValue(mockBook);

      // Act
      const result = await service.findOne(mockBook._id);

      // Assert - Book-specific fields
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('author');
      expect(result).toHaveProperty('isbn');
      expect(result).toHaveProperty('genres');
      expect(result).toHaveProperty('pageCount');
      expect(result).toHaveProperty('publisher');
      expect(result).toHaveProperty('publicationYear');
      expect(result).toHaveProperty('language');
      
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
      expect(typeof result.author).toBe('string');
      expect(typeof result.isbn).toBe('string');
      expect(typeof result.pageCount).toBe('number');
      expect(typeof result.price).toBe('number');
      expect(result.pageCount).toBeGreaterThan(0);
    });

    it('should process book data through processBookData helper', async () => {
      // Arrange
      mockBookModel.exec.mockResolvedValue(mockBook);

      // Act
      const result = await service.findOne(mockBook._id);

      // Assert
      expect(mockBook.toObject).toHaveBeenCalled();
      expect(mockUploadService.processImageUrl).toHaveBeenCalled();
      expect(result.coverImage).toBe(processedImageUrl);
    });

    it('should call database query exactly once with correct filter', async () => {
      // Arrange
      mockBookModel.exec.mockResolvedValue(mockBook);

      // Act
      await service.findOne(mockBook._id);

      // Assert
      expect(mockBookModel.findOne).toHaveBeenCalledTimes(1);
      expect(mockBookModel.exec).toHaveBeenCalledTimes(1);
      expect(mockBookModel.findOne).toHaveBeenCalledWith({
        _id: mockBook._id,
        productType: 'BOOK',
      });
    });
  });
});