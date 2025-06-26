import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDVDDto {
  @ApiProperty({
    description: 'The title of the DVD/Movie',
    example: 'The Matrix',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The type of disc',
    example: 'Blu-ray',
    enum: ['DVD', 'Blu-ray', '4K UHD', 'Blu-ray 3D'],
  })
  @IsString()
  @IsNotEmpty()
  disctype: string;

  @ApiProperty({
    description: 'The director of the movie',
    example: 'Lana Wachowski, Lilly Wachowski',
  })
  @IsString()
  @IsNotEmpty()
  director: string;

  @ApiProperty({
    description: 'Runtime of the movie in minutes',
    example: 136,
  })
  @IsNumber()
  @Min(1)
  runtime: number;

  @ApiProperty({
    description: 'The production studio',
    example: 'Warner Bros.',
  })
  @IsString()
  @IsNotEmpty()
  studio: string;

  @ApiProperty({
    description: 'Available subtitle languages',
    example: 'English, Spanish, French',
    default: 'Multiple',
  })
  @IsString()
  @IsNotEmpty()
  subtitles: string;

  @ApiProperty({
    description: 'Release date of the DVD',
    example: '1999-03-31',
  })
  @IsDateString()
  releaseddate: Date;

  @ApiProperty({
    description: 'Movie genre/film type',
    example: 'Action',
    enum: ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Adventure', 'Fantasy', 'Documentary', 'Animation', 'Crime', 'Mystery', 'Other'],
  })
  @IsString()
  @IsNotEmpty()
  filmtype: string;

  @ApiProperty({
    description: 'The original price of the DVD before discount',
    example: 29.99,
  })
  @IsNumber()
  @Min(0)
  originalPrice: number;

  @ApiPropertyOptional({
    description: 'The discount rate percentage (0-100)',
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountRate?: number;

  @ApiProperty({
    description: 'The available stock of the DVD',
    example: 75,
  })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({
    description: 'URL of the DVD cover image',
    example: 'http://example.com/cover.jpg',
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'URL of the DVD cover image (alternative field name)',
    example: 'http://example.com/cover.jpg',
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Is the DVD available for pre-order?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAvailableForPreOrder?: boolean;

  @ApiPropertyOptional({
    description: 'Pre-order release date',
  })
  @IsOptional()
  @IsDateString()
  preOrderReleaseDate?: Date;

  @ApiPropertyOptional({
    description: 'Is the DVD featured?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}