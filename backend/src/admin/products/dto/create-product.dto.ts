import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductType {
  BOOK = 'BOOK',
  DVD = 'DVD',
  CD = 'CD',
}

export class CreateProductDto {
  @ApiProperty({
    description: 'The title of the product',
    example: 'The Great Product',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Whether the product is available for rush delivery',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isAvailableRush?: boolean;

  @ApiProperty({
    description: 'The original price of the product before discount',
    example: 24.99,
  })
  @IsNumber()
  @Min(0)
  originalPrice: number;


  // price
  @ApiProperty({
    description: 'The price of the product after discount',
    example: 19.99,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ 
    description: 'The available stock of the product', 
    example: 100 
  })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({
    description: 'URL of the product cover image',
    example: 'http://example.com/cover.jpg',
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'URL of the product cover image (alternative field name)',
    example: 'http://example.com/cover.jpg',
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Creation date', 
    example: '2023-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @ApiPropertyOptional({ 
    description: 'Last update date', 
    example: '2023-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDate()
  updatedAt?: Date;


  // weight
  @ApiPropertyOptional({
    description: 'Weight of the product in grams',
    example: 500,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}