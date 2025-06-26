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

export class CreateCDDto {
  @ApiProperty({
    description: 'The title of the CD/Album',
    example: 'Abbey Road',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The artist or band name',
    example: 'The Beatles',
  })
  @IsString()
  @IsNotEmpty()
  artist: string;

  @ApiProperty({
    description: 'The album title',
    example: 'Abbey Road',
  })
  @IsString()
  @IsNotEmpty()
  albumTitle: string;

  @ApiProperty({
    description: 'List of tracks on the CD',
    example: 'Come Together, Something, Maxwell\'s Silver Hammer, Oh! Darling',
  })
  @IsString()
  @IsNotEmpty()
  trackList: string;

  @ApiProperty({
    description: 'Music genre/category',
    example: 'Rock',
    enum: ['Pop', 'Rock', 'Jazz', 'Classical', 'Hip-Hop', 'Country', 'Electronic', 'Blues', 'Folk', 'Other'],
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Release date of the CD',
    example: '1969-09-26',
  })
  @IsDateString()
  releaseddate: Date;

  @ApiProperty({
    description: 'The original price of the CD before discount',
    example: 19.99,
  })
  @IsNumber()
  @Min(0)
  originalPrice: number;

  @ApiPropertyOptional({
    description: 'The discount rate percentage (0-100)',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountRate?: number;

  @ApiProperty({
    description: 'The available stock of the CD',
    example: 50,
  })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({
    description: 'URL of the CD cover image',
    example: 'http://example.com/cover.jpg',
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'URL of the CD cover image (alternative field name)',
    example: 'http://example.com/cover.jpg',
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Is the CD available for pre-order?',
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
    description: 'Is the CD featured?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}