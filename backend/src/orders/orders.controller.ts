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
import { CreateOrderDto } from './dto/create-order.dto';
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
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully.',
    type: Order,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., item not found, insufficient stock).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, createOrderDto);
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

  // Example of an admin route (would typically have an AdminGuard)
  // For now, just demonstrating the service call without specific admin guard
  @Put(':orderId/status')
  @ApiOperation({
    summary: 'Update order status (Admin action - for demonstration)',
  })
  @ApiParam({
    name: 'orderId',
    description: 'ID of the order to update',
    type: String,
  })
  @ApiBody({
    schema: {
      properties: { status: { type: 'string', example: 'shipped' } },
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
    description: 'Bad Request (e.g., invalid status).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body('status') status: string,
    // @Request() req, // req.user could be used to check for admin role with a proper AdminGuard
  ) {
    // Add role check here if an AdminGuard is not used: if (req.user.role !== 'admin') throw new UnauthorizedException();
    return this.ordersService.updateOrderStatus(orderId, status);
  }
}
