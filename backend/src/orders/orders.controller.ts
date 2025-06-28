import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Put,
  Query,
  ParseUUIDPipe, // Note: Order IDs are typically Mongo ObjectIds (strings), not UUIDs.
  // For Mongo ObjectIds, no specific pipe is needed for validation by default unless custom regex is used.
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, CreateOrderFromCartDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Order } from './schemas/order.schema'; // Import Order schema for response types

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new order',
    description: 'Creates a new order. Supports rush delivery for Hanoi addresses with eligible products (additional $4 per item surcharge applies).'
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully.',
    type: Order,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., item not found, insufficient stock, rush delivery not available for address or products).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, createOrderDto);
  }

  @Post('from-cart')
  @ApiOperation({
    summary: 'Create a new order from user cart',
    description: 'Creates a new order from selected cart items. Supports rush delivery for Hanoi addresses with eligible products (additional $4 per item surcharge applies).'
  })
  @ApiBody({ type: CreateOrderFromCartDto })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully from cart.',
    type: Order,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request (e.g., cart empty, no items selected, insufficient stock, rush delivery not available for address or products).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createOrderFromCart(
    @Request() req,
    @Body() createOrderFromCartDto: CreateOrderFromCartDto,
  ) {
    return this.ordersService.createOrderFromCart(
      req.user.id,
      createOrderFromCartDto,
    );
  }

  @Get()
  @ApiOperation({ summary: "Get current user's orders" })
  @ApiResponse({
    status: 200,
    description: 'List of user orders.',
    type: [Order],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getUserOrders(@Request() req) {
    return this.ordersService.findUserOrders(req.user.id);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get a specific order by ID (for current user)' })
  @ApiParam({
    name: 'orderId',
    description: 'ID of the order to retrieve',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Order details.', type: Order })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 404,
    description: 'Order not found or does not belong to user.',
  })
  async getOrderById(@Request() req, @Param('orderId') orderId: string) {
    return this.ordersService.findOrderById(orderId, req.user.id);
  }

  // Handle payment completion callback from payment gateway
  @Put(':orderId/payment-completed')
  @ApiOperation({
    summary: 'Handle payment completion from payment gateway',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Order number to update',
    type: String,
  })
  @ApiBody({
    schema: {
      properties: {
        paymentId: { type: 'string', example: 'payment_123' },
      },
      required: ['paymentId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Order payment status updated to RECEIVED.',
    type: Order,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., order not in PENDING status).',
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async handlePaymentCompleted(
    @Param('orderId') orderId: string,
    @Body('paymentId') paymentId: string,
  ) {
    return this.ordersService.handlePaymentCompleted(orderId, paymentId);
  }

  // Cancel an order
  @Put(':orderId/cancel')
  @ApiOperation({
    summary: 'Cancel an order',
  })
  @ApiParam({
    name: 'orderId',
    description: 'ID of the order to cancel',
    type: String,
  })
  @ApiBody({
    schema: {
      properties: {
        reason: { type: 'string', example: 'Customer requested cancellation' },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully.',
    type: Order,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., order cannot be cancelled).',
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async cancelOrder(
    @Param('orderId') orderId: string,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.cancelOrder(orderId, reason);
  }

  // Admin route to update order status with proper flow validation
  @Put(':orderId/status')
  @ApiOperation({
    summary: 'Update order status (Admin only)',
  })
  @ApiParam({
    name: 'orderId',
    description: 'ID of the order to update',
    type: String,
  })
  @ApiBody({
    schema: {
      properties: {
        status: {
          type: 'string',
          enum: [
            'CONFIRMED',
            'PREPARED',
            'SHIPPED',
            'DELIVERED',
            'REFUNDED',
            'CANCELED',
          ],
          example: 'CONFIRMED',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Order status updated.',
    type: Order,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid status transition).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body('status') status: string,
    @Request() req,
  ) {
    // In production, add AdminGuard to protect this endpoint
    return this.ordersService.updateOrderStatus(orderId, status, req.user.id);
  }

  // Admin route to get orders by status
  @Get('admin/status/:status')
  @ApiOperation({
    summary: 'Get orders by status (Admin only)',
  })
  @ApiParam({
    name: 'status',
    description: 'Order status to filter by',
    type: String,
    enum: [
      'RECEIVED',
      'PENDING',
      'CANCELED',
      'CONFIRMED',
      'PREPARED',
      'SHIPPED',
      'DELIVERED',
      'REFUNDED',
    ],
  })
  @ApiResponse({
    status: 200,
    description: 'List of orders with specified status.',
    type: [Order],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getOrdersByStatus(@Param('status') status: string) {
    // In production, add AdminGuard to protect this endpoint
    return this.ordersService.findOrdersByStatus(status);
  }

  // Admin route to get orders expiring soon
  @Get('admin/expiring-soon')
  @ApiOperation({
    summary: 'Get orders expiring soon (Admin only)',
  })
  @ApiQuery({
    name: 'hours',
    description: 'Hours ahead to check for expiring orders',
    type: Number,
    required: false,
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: 'List of orders expiring soon.',
    type: [Order],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getOrdersExpiringSoon(@Query('hours') hours?: number) {
    // In production, add AdminGuard to protect this endpoint
    return this.ordersService.findOrdersExpiringSoon(hours || 2);
  }
}
