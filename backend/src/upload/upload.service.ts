import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    // Initialize S3Client for Cloudflare R2
    this.s3Client = new S3Client({
      region: this.configService.get<string>('r2.region'),
      endpoint: this.configService.get<string>('r2.endpoint'),
      credentials: {
        accessKeyId: this.configService.get<string>('r2.accessKey'),
        secretAccessKey: this.configService.get<string>('r2.secretKey'),
      },
      forcePathStyle: true, // Required for R2 compatibility
    });

    this.bucketName = this.configService.get<string>('r2.bucketName');
    
    this.logger.log('UploadService initialized with R2 configuration');
    this.logger.log(`Bucket: ${this.bucketName}`);
    this.logger.log(`Endpoint: ${this.configService.get<string>('r2.endpoint')}`);
  }

  /**
   * Generate a presigned URL for uploading files to R2
   */
  async generateUploadPresignedUrl(
    fileName: string,
    contentType: string,
  ): Promise<{
    uploadUrl: string;
    s3Key: string;
    expiresIn: number;
  }> {
    try {
      // Generate unique S3 key with timestamp
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const s3Key = `book-covers/${timestamp}-${sanitizedFileName}`;

      // Create PutObject command
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        ContentType: contentType,
      });

      // Generate presigned URL (expires in 5 minutes)
      const expiresIn = 300; // 5 minutes
      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      this.logger.log(`Generated upload presigned URL for: ${s3Key}`);

      return {
        uploadUrl,
        s3Key,
        expiresIn,
      };
    } catch (error) {
      this.logger.error('Error generating upload presigned URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  /**
   * Generate a presigned URL for downloading files from R2
   */
  async generateDownloadPresignedUrl(s3Key: string): Promise<string> {
    try {
      // Create GetObject command
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      // Generate presigned URL (expires in 1 hour)
      const downloadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600, // 1 hour
      });

      this.logger.debug(`Generated download presigned URL for: ${s3Key}`);

      return downloadUrl;
    } catch (error) {
      this.logger.error(`Error generating download presigned URL for ${s3Key}:`, error);
      throw new Error('Failed to generate download URL');
    }
  }

  /**
   * Process image URL - return Google Books URLs as-is, generate presigned URLs for S3 keys
   */
  async processImageUrl(coverImage: string): Promise<string> {
    if (!coverImage || coverImage.trim() === '') {
      return '/placeholder-book.jpg';
    }

    // If it's a Google Books URL or any HTTP URL, return as-is
    if (coverImage.startsWith('http')) {
      return coverImage;
    }

    // If it's an S3 key, generate presigned URL
    try {
      return await this.generateDownloadPresignedUrl(coverImage);
    } catch (error) {
      this.logger.warn(`Failed to generate presigned URL for ${coverImage}, using placeholder`);
      return '/placeholder-book.jpg';
    }
  }
}
