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
  Patch,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import {
  AddItemToCartDto,
  UpdateItemInCartDto,
} from './dto/add-item-to-cart.dto';
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
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiBody({ type: AddItemToCartDto })
  @ApiResponse({
    status: 201,
    description: 'Item successfully added to cart',
    type: Cart,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Not enough stock' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addToCart(@Request() req, @Body() addItemDto: AddItemToCartDto) {
    return this.cartsService.addItem(req.user.id, addItemDto);
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Update item in the cart (quantity, isTicked)' })
  @ApiParam({
    name: 'productId',
    description: 'ID of the product in the cart',
    type: String,
  })
  @ApiBody({ type: UpdateItemInCartDto })
  @ApiResponse({
    status: 200,
    description: 'Item updated successfully.',
    type: Cart,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid quantity, insufficient stock).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 404,
    description: 'Product not found in cart or user/product not found.',
  })
  async updateItemInCart(
    @Request() req,
    @Param('productId') productId: string,
    @Body() updateDto: UpdateItemInCartDto,
  ) {
    return this.cartsService.updateItemInCart(
      req.user.id,
      productId,
      updateDto,
    );
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove an item from the cart' })
  @ApiParam({
    name: 'productId',
    description: 'ID of the product to remove from the cart',
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
    description: 'Product not found in cart or user/product not found.',
  })
  async removeItemFromCart(
    @Request() req,
    @Param('productId') productId: string,
  ) {
    return this.cartsService.removeItem(req.user.id, productId);
  }

  @Delete()
  @ApiOperation({ summary: "Clear all items from the user's cart" })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully.',
    type: Cart,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @HttpCode(HttpStatus.OK)
  async clearCart(@Request() req) {
    return this.cartsService.clearCart(req.user.id);
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate cart items for stock and price changes' })
  @ApiResponse({
    status: 200,
    description: 'Cart validation results.',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string' },
              type: { type: 'string', enum: ['stock', 'price', 'unavailable'] },
              message: { type: 'string' },
              currentStock: { type: 'number' },
              requestedQuantity: { type: 'number' },
              currentPrice: { type: 'number' },
              cartPrice: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async validateCart(@Request() req) {
    return this.cartsService.validateCart(req.user.id);
  }
}
