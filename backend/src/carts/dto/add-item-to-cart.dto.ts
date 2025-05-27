import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsMongoId,
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
}
