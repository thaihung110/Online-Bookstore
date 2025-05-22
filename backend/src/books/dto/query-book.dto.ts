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
  AVERAGE_RATING = 'averageRating',
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
    // Log input value for debug
    console.log(
      'QueryBookDto: transforming genres, input:',
      value,
      'type:',
      typeof value,
    );

    // Nếu là string (từ URL param), chuyển thành array
    if (typeof value === 'string') {
      // Xử lý chuỗi genres đúng cách, loại bỏ khoảng trắng và chuẩn hóa dữ liệu
      const splitGenres = value.split(',');
      const cleanedGenres = splitGenres
        .map(
          (genre) => genre.trim(), // Loại bỏ khoảng trắng ở đầu và cuối
        )
        .filter((genre) => genre.length > 0); // Loại bỏ chuỗi rỗng

      console.log(
        'QueryBookDto: split string to array and normalized:',
        cleanedGenres,
      );
      return cleanedGenres;
    }
    // Nếu đã là array, chuẩn hóa dữ liệu
    if (Array.isArray(value)) {
      const cleanedGenres = value
        .map((genre) => (typeof genre === 'string' ? genre.trim() : genre))
        .filter(
          (genre) =>
            genre && (typeof genre === 'string' ? genre.length > 0 : true),
        );
      console.log('QueryBookDto: normalized array:', cleanedGenres);
      return cleanedGenres;
    }
    // Trường hợp khác, trả về array rỗng
    console.log(
      'QueryBookDto: returning empty array for value type:',
      typeof value,
    );
    return [];
  })
  @IsArray()
  @IsOptional()
  genres?: string[];

  @ApiPropertyOptional({ description: 'Minimum price' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
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

  @ApiPropertyOptional({ description: 'Filter only in-stock books' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @ApiPropertyOptional({ description: 'Filter only discounted books' })
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
