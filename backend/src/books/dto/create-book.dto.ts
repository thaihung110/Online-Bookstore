import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({
    description: 'The title of the book',
    example: 'The Great Gatsby',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The author of the book',
    example: 'F. Scott Fitzgerald',
  })
  @IsString()
  @IsNotEmpty()
  author: string;

  @ApiProperty({
    description: 'A brief description of the book',
    example: 'A novel about the American Dream',
  })
  @IsString()
  @IsNotEmpty()
  description: string;



  @ApiProperty({
    description: 'The original price of the book before discount',
    example: 24.99,
  })
  @IsNumber()
  @Min(0)
  originalPrice: number;

  @ApiPropertyOptional({
    description: 'The discount rate percentage (0-100)',
    example: 25,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountRate?: number;

  @ApiProperty({ description: 'The available stock of the book', example: 100 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({
    description: 'The ISBN of the book',
    example: '978-3-16-148410-0',
  })
  @IsString()
  @IsNotEmpty()
  isbn: string;

  @ApiProperty({
    description: 'The publisher of the book',
    example: "Charles Scribner's Sons",
  })
  @IsString()
  @IsNotEmpty()
  publisher: string;

  @ApiPropertyOptional({
    description: 'The publication date of the book',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsString()
  publicationDate?: string;

  @ApiProperty({
    description: 'The publication year of the book',
    example: 1925,
  })
  @IsNumber()
  publicationYear: number;

  @ApiProperty({
    description: 'The number of pages in the book',
    example: 180,
  })
  @IsNumber()
  @Min(1)
  pageCount: number;

  @ApiPropertyOptional({
    description: 'The language of the book',
    example: 'English',
  })
  @IsOptional()
  @IsString()
  language?: string;



  @ApiPropertyOptional({
    description: 'Genres of the book',
    type: [String],
    example: ['Classic', 'Fiction'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  genres?: string[];

  @ApiPropertyOptional({
    description: 'URL of the book cover image',
    example: 'http://example.com/cover.jpg',
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'URL of the book cover image (alternative field name)',
    example: 'http://example.com/cover.jpg',
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Is the book available for pre-order?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAvailableForPreOrder?: boolean;

  @ApiPropertyOptional({ description: 'Pre-order release date' })
  @IsOptional()
  @IsDateString()
  preOrderReleaseDate?: Date;

  @ApiPropertyOptional({ description: 'Is the book featured?', default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
