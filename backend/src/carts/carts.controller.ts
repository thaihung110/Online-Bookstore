import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Put,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { AddItemToCartDto } from './dto/add-item-to-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Cart } from './schemas/cart.schema';

@ApiTags('carts')
@Controller('carts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  @ApiOperation({ summary: "Get the current user's cart" })
  @ApiResponse({
    status: 200,
    description: "User's cart retrieved successfully.",
    type: Cart,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getCart(@Request() req) {
    return this.cartsService.getCart(req.user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add an item to the cart' })
  @ApiBody({ type: AddItemToCartDto })
  @ApiResponse({
    status: 200,
    description: 'Item added to cart successfully.',
    type: Cart,
  }) // Changed to 200 as it returns the updated cart
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid bookId, insufficient stock).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 404,
    description: 'Book not found or user not found.',
  })
  async addItemToCart(
    @Request() req,
    @Body() addItemToCartDto: AddItemToCartDto,
  ) {
    return this.cartsService.addItem(req.user.id, addItemToCartDto);
  }

  @Put('items/:bookId')
  @ApiOperation({ summary: 'Update item quantity in the cart' })
  @ApiParam({
    name: 'bookId',
    description: 'ID of the book in the cart',
    type: String,
  })
  @ApiBody({
    schema: {
      properties: { quantity: { type: 'number', example: 2, minimum: 1 } },
      required: ['quantity'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Item quantity updated successfully.',
    type: Cart,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid quantity, insufficient stock).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 404,
    description: 'Book not found in cart or user/book not found.',
  })
  async updateItemQuantity(
    @Request() req,
    @Param('bookId') bookId: string,
    @Body('quantity', ParseIntPipe) quantity: number,
  ) {
    return this.cartsService.updateItemQuantity(req.user.id, bookId, quantity);
  }

  @Delete('items/:bookId')
  @ApiOperation({ summary: 'Remove an item from the cart' })
  @ApiParam({
    name: 'bookId',
    description: 'ID of the book to remove from the cart',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Item removed from cart successfully.',
    type: Cart,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 404,
    description: 'Book not found in cart or user/book not found.',
  })
  async removeItemFromCart(@Request() req, @Param('bookId') bookId: string) {
    return this.cartsService.removeItem(req.user.id, bookId);
  }

  @Delete()
  @ApiOperation({ summary: "Clear all items from the user's cart" })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully.',
    type: Cart,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @HttpCode(HttpStatus.OK) // Or 204 if not returning content, but service returns cart
  async clearCart(@Request() req) {
    return this.cartsService.clearCart(req.user.id);
  }
}
