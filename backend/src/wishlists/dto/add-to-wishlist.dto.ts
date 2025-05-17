import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToWishlistDto {
  @ApiProperty({
    description: 'The ID of the book to add to the wishlist',
    example: '6078f1a5e32f1c00205b1c42',
  })
  @IsNotEmpty()
  @IsString()
  bookId: string;
}
