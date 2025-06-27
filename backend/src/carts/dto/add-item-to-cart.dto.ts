import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsMongoId,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddItemToCartDto {
  @ApiProperty({
    description: 'The ID of the product to add to the cart',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description:
      'The quantity of the product to add (will be added to existing quantity if product already in cart)',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Whether the item is ticked/selected in the cart',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isTicked?: boolean;
}

export class UpdateItemInCartDto {
  @ApiProperty({
    description: 'The quantity of the product to update',
    example: 2,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiProperty({
    description: 'Whether the item is ticked/selected in the cart',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isTicked?: boolean;
}
