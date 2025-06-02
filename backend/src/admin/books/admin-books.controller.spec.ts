import { Test, TestingModule } from '@nestjs/testing';
import { AdminBooksController } from './admin-books.controller';
import { AdminBooksService } from './admin-books.service';
import { UploadService } from '../../upload/upload.service';
import { UploadPresignedUrlDto } from '../../upload/dto/upload-presigned-url.dto';

describe('AdminBooksController', () => {
  let controller: AdminBooksController;
  let adminBooksService: AdminBooksService;
  let uploadService: UploadService;

  const mockAdminBooksService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUploadService = {
    generateUploadPresignedUrl: jest.fn(),
    generateDownloadPresignedUrl: jest.fn(),
    processImageUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminBooksController],
      providers: [
        {
          provide: AdminBooksService,
          useValue: mockAdminBooksService,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    controller = module.get<AdminBooksController>(AdminBooksController);
    adminBooksService = module.get<AdminBooksService>(AdminBooksService);
    uploadService = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUploadPresignedUrl', () => {
    it('should generate presigned URL for valid image upload request', async () => {
      const uploadDto: UploadPresignedUrlDto = {
        fileName: 'test-book-cover.jpg',
        contentType: 'image/jpeg',
      };

      const mockResponse = {
        uploadUrl: 'https://test-bucket.r2.cloudflarestorage.com/book-covers/123456-test-book-cover.jpg?signature=abc123',
        s3Key: 'book-covers/123456-test-book-cover.jpg',
        expiresIn: 300,
      };

      mockUploadService.generateUploadPresignedUrl.mockResolvedValue(mockResponse);

      const result = await controller.getUploadPresignedUrl(uploadDto);

      expect(uploadService.generateUploadPresignedUrl).toHaveBeenCalledWith(
        uploadDto.fileName,
        uploadDto.contentType,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle PNG files', async () => {
      const uploadDto: UploadPresignedUrlDto = {
        fileName: 'test-book-cover.png',
        contentType: 'image/png',
      };

      const mockResponse = {
        uploadUrl: 'https://test-bucket.r2.cloudflarestorage.com/book-covers/123456-test-book-cover.png?signature=def456',
        s3Key: 'book-covers/123456-test-book-cover.png',
        expiresIn: 300,
      };

      mockUploadService.generateUploadPresignedUrl.mockResolvedValue(mockResponse);

      const result = await controller.getUploadPresignedUrl(uploadDto);

      expect(uploadService.generateUploadPresignedUrl).toHaveBeenCalledWith(
        uploadDto.fileName,
        uploadDto.contentType,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle WebP files', async () => {
      const uploadDto: UploadPresignedUrlDto = {
        fileName: 'test-book-cover.webp',
        contentType: 'image/webp',
      };

      const mockResponse = {
        uploadUrl: 'https://test-bucket.r2.cloudflarestorage.com/book-covers/123456-test-book-cover.webp?signature=ghi789',
        s3Key: 'book-covers/123456-test-book-cover.webp',
        expiresIn: 300,
      };

      mockUploadService.generateUploadPresignedUrl.mockResolvedValue(mockResponse);

      const result = await controller.getUploadPresignedUrl(uploadDto);

      expect(uploadService.generateUploadPresignedUrl).toHaveBeenCalledWith(
        uploadDto.fileName,
        uploadDto.contentType,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should propagate errors from upload service', async () => {
      const uploadDto: UploadPresignedUrlDto = {
        fileName: 'test-book-cover.jpg',
        contentType: 'image/jpeg',
      };

      const error = new Error('Failed to generate upload URL');
      mockUploadService.generateUploadPresignedUrl.mockRejectedValue(error);

      await expect(controller.getUploadPresignedUrl(uploadDto)).rejects.toThrow(error);
    });
  });
});
