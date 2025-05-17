import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WishlistsService } from './wishlists.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@ApiTags('wishlists')
@Controller('wishlists')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user wishlist' })
  @ApiResponse({
    status: 200,
    description: "Returns the user's wishlist with book details",
  })
  async getWishlist(@Request() req): Promise<any> {
    return this.wishlistsService.getUserWishlist(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a book to wishlist' })
  @ApiResponse({
    status: 201,
    description: 'The book has been added to the wishlist',
  })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @ApiResponse({ status: 409, description: 'Book already in wishlist' })
  async addToWishlist(
    @Request() req,
    @Body() addToWishlistDto: AddToWishlistDto,
  ) {
    return this.wishlistsService.addToWishlist(req.user.id, addToWishlistDto);
  }

  @Delete(':bookId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a book from wishlist' })
  @ApiResponse({
    status: 204,
    description: 'The book has been removed from the wishlist',
  })
  @ApiResponse({ status: 404, description: 'Book not found in wishlist' })
  async removeFromWishlist(@Request() req, @Param('bookId') bookId: string) {
    await this.wishlistsService.removeFromWishlist(req.user.id, bookId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear the wishlist' })
  @ApiResponse({ status: 204, description: 'The wishlist has been cleared' })
  async clearWishlist(@Request() req) {
    await this.wishlistsService.clearWishlist(req.user.id);
  }
}
