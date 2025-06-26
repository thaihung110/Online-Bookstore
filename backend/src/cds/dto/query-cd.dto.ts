import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export enum CDSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum CDSortField {
  PRICE = 'price',
  TITLE = 'title',
  ARTIST = 'artist',
  ALBUM_TITLE = 'albumTitle',
  RELEASED_DATE = 'releaseddate',
  CREATED_AT = 'createdAt',
}

export class QueryCDDto {
  @ApiPropertyOptional({ description: 'Page number (default: 1)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page (default: 10)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search term to match title, artist, or album title',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by artist (case-insensitive)',
    example: 'beatles',
  })
  @IsString()
  @IsOptional()
  artist?: string;

  @ApiPropertyOptional({
    description: 'Filter by album title (case-insensitive)',
    example: 'abbey road',
  })
  @IsString()
  @IsOptional()
  albumTitle?: string;

  @ApiPropertyOptional({
    description: 'Filter by music categories (multiple categories can be provided)',
    isArray: true,
    example: ['Rock', 'Pop'],
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const splitCategories = value.split(',');
      const cleanedCategories = splitCategories
        .map((category) => category.trim())
        .filter((category) => category.length > 0);
      return cleanedCategories;
    }
    if (Array.isArray(value)) {
      const cleanedCategories = value
        .map((category) => (typeof category === 'string' ? category.trim() : category))
        .filter(
          (category) =>
            category && (typeof category === 'string' ? category.length > 0 : true),
        );
      return cleanedCategories;
    }
    return [];
  })
  @IsArray()
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Minimum price in USD',
    minimum: 0,
    maximum: 1000,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price in USD',
    minimum: 0,
    maximum: 1000,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum release year' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minYear?: number;

  @ApiPropertyOptional({ description: 'Maximum release year' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxYear?: number;

  @ApiPropertyOptional({ description: 'Filter only CDs with stock > 0' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @ApiPropertyOptional({
    description: 'Filter only discounted CDs (discountRate > 0)',
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  onSale?: boolean;

  @ApiPropertyOptional({ description: 'Minimum discount rate (percentage)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  minDiscountRate?: number;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: CDSortField,
    default: CDSortField.CREATED_AT,
  })
  @IsEnum(CDSortField)
  @IsOptional()
  sortBy?: CDSortField = CDSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: CDSortOrder,
    default: CDSortOrder.DESC,
  })
  @IsEnum(CDSortOrder)
  @IsOptional()
  sortOrder?: CDSortOrder = CDSortOrder.DESC;
}