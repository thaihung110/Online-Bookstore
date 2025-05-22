import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty({ description: 'Book ID' })
  @IsString()
  readonly book: string;

  @ApiProperty({ description: 'Quantity of the book' })
  @IsNumber()
  readonly quantity: number;

  @ApiProperty({ description: 'Price of the book at time of order' })
  @IsNumber()
  readonly price: number;
}

export class UpdateOrderDto {
  @ApiProperty({
    description: 'Order status',
    enum: [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'returned',
      'cancelled',
      'refunded',
      'completed',
    ],
    required: false,
  })
  @IsOptional()
  @IsEnum([
    'pending',
    'processing',
    'shipped',
    'delivered',
    'returned',
    'cancelled',
    'refunded',
    'completed',
  ])
  readonly status?: string;

  @ApiProperty({ description: 'Shipping address', required: false })
  @IsOptional()
  @IsString()
  readonly shippingAddress?: string;

  @ApiProperty({ description: 'Tracking number', required: false })
  @IsOptional()
  @IsString()
  readonly trackingNumber?: string;

  @ApiProperty({ description: 'Notes about the order', required: false })
  @IsOptional()
  @IsString()
  readonly notes?: string;

  @ApiProperty({
    description: 'Order items',
    required: false,
    type: [OrderItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  readonly items?: OrderItemDto[];
}
