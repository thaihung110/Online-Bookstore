import {
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsMongoId,
  IsEnum,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty({
    description: 'Product ID for the order item',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

class ShippingAddressDto {
  @ApiProperty({ description: 'Full name for shipping', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Address line 1', example: '123 Main St' })
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiPropertyOptional({ description: 'Address line 2', example: 'Apt 4B' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ description: 'City for shipping', example: 'Anytown' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State or province for shipping', example: 'CA' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'Postal code for shipping', example: '90210' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ description: 'Country for shipping', example: 'USA' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiPropertyOptional({
    description: 'Phone number for shipping',
    example: '555-1234',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Email for shipping notifications',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  email: string;
}

enum PaymentMethod {
  CASH = 'COD', // Updated to match MongoDB validation
  VNPAY = 'VNPAY', // Updated to match MongoDB validation
}

class PaymentInfoDto {
  @ApiProperty({
    description: 'Payment method used',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Payment ID reference to payments collection',
  })
  @IsOptional()
  @IsString()
  paymentId?: string;

  @ApiPropertyOptional({ description: 'Transaction ID from payment gateway' })
  @IsOptional()
  @IsString()
  transactionId?: string;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Array of items in the order',
    type: [OrderItemDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    description: 'Shipping address for the order',
    type: ShippingAddressDto,
  })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({
    description: 'Payment information for the order',
    type: PaymentInfoDto,
  })
  @ValidateNested()
  @Type(() => PaymentInfoDto)
  paymentInfo: PaymentInfoDto;

  @ApiPropertyOptional({ description: 'Is this order a gift?', default: false })
  @IsOptional()
  @IsBoolean()
  isGift?: boolean;

  @ApiPropertyOptional({ description: 'Gift message if the order is a gift' })
  @IsOptional()
  @IsString()
  giftMessage?: string;

  @ApiPropertyOptional({ description: 'Is this a rush delivery order?', default: false })
  @IsOptional()
  @IsBoolean()
  isRushOrder?: boolean;

  @ApiPropertyOptional({ description: 'Requested delivery time for rush orders' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  rushDeliveryTime?: Date;

  @ApiPropertyOptional({ description: 'Special delivery instructions for rush orders' })
  @IsOptional()
  @IsString()
  rushInstructions?: string;
}

export class CreateOrderFromCartDto {
  @ApiProperty({
    description: 'Shipping address for the order',
    type: ShippingAddressDto,
  })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({
    description: 'Payment information for the order',
    type: PaymentInfoDto,
  })
  @ValidateNested()
  @Type(() => PaymentInfoDto)
  paymentInfo: PaymentInfoDto;

  @ApiPropertyOptional({ description: 'Is this order a gift?', default: false })
  @IsOptional()
  @IsBoolean()
  isGift?: boolean;

  @ApiPropertyOptional({ description: 'Gift message if the order is a gift' })
  @IsOptional()
  @IsString()
  giftMessage?: string;

  @ApiPropertyOptional({ description: 'Is this a rush delivery order?', default: false })
  @IsOptional()
  @IsBoolean()
  isRushOrder?: boolean;

  @ApiPropertyOptional({ description: 'Requested delivery time for rush orders' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  rushDeliveryTime?: Date;

  @ApiPropertyOptional({ description: 'Special delivery instructions for rush orders' })
  @IsOptional()
  @IsString()
  rushInstructions?: string;
}
