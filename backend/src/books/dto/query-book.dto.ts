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

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SortField {
  PRICE = 'price',
  TITLE = 'title',
  PUBLICATION_YEAR = 'publicationYear',
  CREATED_AT = 'createdAt',
}

export class QueryBookDto {
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
    description: 'Search term to match title and description',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by author (case-insensitive)',
    example: 'tolkien',
  })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiPropertyOptional({
    description: 'Filter by genres (multiple genres can be provided)',
    isArray: true,
    example: ['Fantasy', 'Adventure'],
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
  genres?: string[];

  @ApiPropertyOptional({
    description:
      'Minimum price in USD (price in VND will be converted to USD by dividing by 25000)',
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
    description:
      'Maximum price in USD (price in VND will be converted to USD by dividing by 25000)',
    minimum: 0,
    maximum: 1000,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum publication year' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minYear?: number;

  @ApiPropertyOptional({ description: 'Maximum publication year' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxYear?: number;

  @ApiPropertyOptional({ description: 'Filter only books with stock > 0' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @ApiPropertyOptional({
    description: 'Filter only discounted books (discountRate > 0)',
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
    enum: SortField,
    default: SortField.CREATED_AT,
  })
  @IsEnum(SortField)
  @IsOptional()
  sortBy?: SortField = SortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}
