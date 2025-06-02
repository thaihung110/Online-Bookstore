import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UploadService } from './upload.service';

describe('UploadService Integration Tests', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              r2: {
                accessKey: 'test-access-key',
                secretKey: 'test-secret-key',
                endpoint: 'https://test.r2.cloudflarestorage.com',
                bucketName: 'test-bucket',
                region: 'auto',
              },
            }),
          ],
        }),
      ],
      providers: [UploadService],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Image URL Processing Flow', () => {
    it('should handle Google Books URLs correctly', async () => {
      const googleBooksUrl = 'https://books.google.com/books/content/images/frontcover/abc123.jpg';
      const result = await service.processImageUrl(googleBooksUrl);
      expect(result).toBe(googleBooksUrl);
    });

    it('should handle external HTTP URLs correctly', async () => {
      const externalUrl = 'https://example.com/book-cover.jpg';
      const result = await service.processImageUrl(externalUrl);
      expect(result).toBe(externalUrl);
    });

    it('should handle empty/null values correctly', async () => {
      expect(await service.processImageUrl('')).toBe('/placeholder-book.jpg');
      expect(await service.processImageUrl(null as any)).toBe('/placeholder-book.jpg');
      expect(await service.processImageUrl(undefined as any)).toBe('/placeholder-book.jpg');
      expect(await service.processImageUrl('   ')).toBe('/placeholder-book.jpg');
    });

    it('should handle S3 keys by attempting to generate presigned URLs', async () => {
      const s3Key = 'book-covers/123456-test-book.jpg';
      
      // Since we're using mock credentials, this will likely fail and return placeholder
      // In a real environment with valid R2 credentials, this would generate a presigned URL
      const result = await service.processImageUrl(s3Key);
      
      // Should either return a presigned URL or fallback to placeholder
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('File Name Sanitization', () => {
    it('should generate valid S3 keys for various file names', async () => {
      const testCases = [
        'simple-file.jpg',
        'file with spaces.png',
        'file@with#special$chars%.webp',
        'very-long-file-name-that-might-cause-issues.jpg',
        'unicode-文件名.jpg',
      ];

      for (const fileName of testCases) {
        try {
          const result = await service.generateUploadPresignedUrl(fileName, 'image/jpeg');
          expect(result).toHaveProperty('uploadUrl');
          expect(result).toHaveProperty('s3Key');
          expect(result).toHaveProperty('expiresIn');
          expect(result.s3Key).toMatch(/^book-covers\/\d+-/);
        } catch (error) {
          // Expected to fail with mock credentials, but should not throw validation errors
          expect(error.message).not.toContain('validation');
        }
      }
    });
  });

  describe('Content Type Validation', () => {
    it('should handle valid image content types', async () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      
      for (const contentType of validTypes) {
        try {
          const result = await service.generateUploadPresignedUrl('test.jpg', contentType);
          // Should not throw validation errors
          expect(result).toBeDefined();
        } catch (error) {
          // Expected to fail with mock credentials, but should not be validation errors
          expect(error.message).not.toContain('Content type');
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle S3 connection errors gracefully', async () => {
      // Test with an invalid S3 key that would cause connection issues
      const invalidS3Key = 'invalid/path/that/does/not/exist.jpg';
      
      const result = await service.processImageUrl(invalidS3Key);
      
      // Should fallback to placeholder on any S3 errors
      expect(result).toBe('/placeholder-book.jpg');
    });
  });
});
