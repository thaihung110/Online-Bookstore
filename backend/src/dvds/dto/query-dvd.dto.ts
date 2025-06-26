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

export enum DVDSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum DVDSortField {
  PRICE = 'price',
  TITLE = 'title',
  DIRECTOR = 'director',
  RUNTIME = 'runtime',
  RELEASED_DATE = 'releaseddate',
  CREATED_AT = 'createdAt',
}

export class QueryDVDDto {
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
    description: 'Search term to match title, director, or studio',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by director (case-insensitive)',
    example: 'spielberg',
  })
  @IsString()
  @IsOptional()
  director?: string;

  @ApiPropertyOptional({
    description: 'Filter by studio (case-insensitive)',
    example: 'warner bros',
  })
  @IsString()
  @IsOptional()
  studio?: string;

  @ApiPropertyOptional({
    description: 'Filter by disc types (multiple types can be provided)',
    isArray: true,
    example: ['Blu-ray', 'DVD'],
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const splitTypes = value.split(',');
      const cleanedTypes = splitTypes
        .map((type) => type.trim())
        .filter((type) => type.length > 0);
      return cleanedTypes;
    }
    if (Array.isArray(value)) {
      const cleanedTypes = value
        .map((type) => (typeof type === 'string' ? type.trim() : type))
        .filter(
          (type) =>
            type && (typeof type === 'string' ? type.length > 0 : true),
        );
      return cleanedTypes;
    }
    return [];
  })
  @IsArray()
  @IsOptional()
  discTypes?: string[];

  @ApiPropertyOptional({
    description: 'Filter by film types/genres (multiple genres can be provided)',
    isArray: true,
    example: ['Action', 'Sci-Fi'],
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const splitGenres = value.split(',');
      const cleanedGenres = splitGenres
        .map((genre) => genre.trim())
        .filter((genre) => genre.length > 0);
      return cleanedGenres;
    }
    if (Array.isArray(value)) {
      const cleanedGenres = value
        .map((genre) => (typeof genre === 'string' ? genre.trim() : genre))
        .filter(
          (genre) =>
            genre && (typeof genre === 'string' ? genre.length > 0 : true),
        );
      return cleanedGenres;
    }
    return [];
  })
  @IsArray()
  @IsOptional()
  filmTypes?: string[];

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

  @ApiPropertyOptional({ description: 'Minimum runtime in minutes' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  minRuntime?: number;

  @ApiPropertyOptional({ description: 'Maximum runtime in minutes' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxRuntime?: number;

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

  @ApiPropertyOptional({ description: 'Filter only DVDs with stock > 0' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @ApiPropertyOptional({
    description: 'Filter only discounted DVDs (discountRate > 0)',
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
    enum: DVDSortField,
    default: DVDSortField.CREATED_AT,
  })
  @IsEnum(DVDSortField)
  @IsOptional()
  sortBy?: DVDSortField = DVDSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: DVDSortOrder,
    default: DVDSortOrder.DESC,
  })
  @IsEnum(DVDSortOrder)
  @IsOptional()
  sortOrder?: DVDSortOrder = DVDSortOrder.DESC;
}