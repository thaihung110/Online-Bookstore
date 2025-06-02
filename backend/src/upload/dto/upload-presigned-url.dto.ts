import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class UploadPresignedUrlDto {
  @ApiProperty({
    description: 'Name of the file to upload',
    example: 'book-cover.jpg',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^image\/(jpeg|jpg|png|webp)$/, {
    message: 'Content type must be image/jpeg, image/png, or image/webp',
  })
  contentType: string;
}

export class UploadPresignedUrlResponseDto {
  @ApiProperty({
    description: 'Presigned URL for uploading the file',
    example: 'https://r2.example.com/bucket/book-covers/123456-book-cover.jpg?...',
  })
  uploadUrl: string;

  @ApiProperty({
    description: 'S3 key for the uploaded file',
    example: 'book-covers/123456-book-cover.jpg',
  })
  s3Key: string;

  @ApiProperty({
    description: 'URL expiration time in seconds',
    example: 300,
  })
  expiresIn: number;
}
