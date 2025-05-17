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
    description: 'The quantity of the book to add',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

// Optional: DTO for updating item quantity, or use AddItemToCartDto
// export class UpdateCartItemDto {
//   @ApiProperty({
//     description: 'The new quantity of the book in the cart',
//     example: 2,
//     minimum: 1,
//   })
//   @IsNumber()
//   @Min(1)
//   quantity: number;
// }
