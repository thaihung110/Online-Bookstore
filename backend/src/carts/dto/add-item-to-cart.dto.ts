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
    description: 'The ID of the book to add to the cart',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsMongoId()
  @IsNotEmpty()
  bookId: string;

  @ApiProperty({
    description:
      'The quantity of the book to add (will be added to existing quantity if book already in cart)',
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
    description: 'The quantity of the book to update',
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
