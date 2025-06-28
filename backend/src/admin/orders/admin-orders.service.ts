import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../../orders/schemas/order.schema';
import { UpdateOrderDto } from '../../orders/dto';
import {
  OrderFilters,
  OrderListResponse,
  OrderFilterQuery,
  OrderSortOptions,
} from './types';

@Injectable()
export class AdminOrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async findAll(filters: OrderFilters): Promise<OrderListResponse> {
    const {
      page = 1,
      limit = 10,
      status,
      userId,
      minTotal,
      maxTotal,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const query: OrderFilterQuery = {};

    // Apply filters
    if (status) {
      query.status = status;
    }

    if (userId) {
      query.user = userId;
    }

    if (minTotal !== undefined || maxTotal !== undefined) {
      query.total = {};
      if (minTotal !== undefined) {
        query.total.$gte = minTotal;
      }
      if (maxTotal !== undefined) {
        query.total.$lte = maxTotal;
      }
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Count total documents
    const total = await this.orderModel.countDocuments(query);

    // Build sort object
    const sort: OrderSortOptions = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch paginated orders
    const orders = await this.orderModel
      .find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'username email')
      .populate('items.product', 'title author price coverImage')
      .exec();

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderModel
      .findById(id)
      .populate('user', 'username email')
      .populate('items.product', 'title author price coverImage')
      .exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    console.log('[Admin Orders Service] Updating order:', id);
    console.log('[Admin Orders Service] Update data:', updateOrderDto);

    // Fetch existing order and check if it exists
    const existingOrder = await this.orderModel.findById(id).exec();
    if (!existingOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    console.log(
      '[Admin Orders Service] Current order status:',
      existingOrder.status,
    );

    // Validate status transition
    if (
      updateOrderDto.status &&
      !this.isValidStatusTransition(existingOrder.status, updateOrderDto.status)
    ) {
      console.log(
        '[Admin Orders Service] Invalid status transition from',
        existingOrder.status,
        'to',
        updateOrderDto.status,
      );
      throw new BadRequestException(
        `Invalid status transition from ${existingOrder.status} to ${updateOrderDto.status}`,
      );
    }

    console.log('[Admin Orders Service] Status transition is valid');

    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(id, updateOrderDto, { new: true })
      .populate('user', 'username email')
      .populate('items.product', 'title author price coverImage')
      .exec();

    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    console.log(
      '[Admin Orders Service] Order updated successfully:',
      updatedOrder.status,
    );

    return updatedOrder;
  }

  async delete(id: string): Promise<void> {
    // Check if order exists
    await this.findById(id);

    const result = await this.orderModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
  }

  private isValidStatusTransition(
    currentStatus: string,
    newStatus: string,
  ): boolean {
    // Use UPPERCASE statuses to match schema
    const validTransitions = {
      PENDING: ['CONFIRMED', 'CANCELED'],
      RECEIVED: ['CONFIRMED', 'CANCELED'],
      CONFIRMED: ['PREPARED', 'CANCELED'],
      PREPARED: ['SHIPPED', 'CANCELED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: ['REFUNDED'],
      CANCELED: [],
      REFUNDED: [],
    };

    console.log(
      '[Admin Orders Service] Checking transition from',
      currentStatus,
      'to',
      newStatus,
    );
    console.log(
      '[Admin Orders Service] Valid transitions for',
      currentStatus,
      ':',
      validTransitions[currentStatus],
    );

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}
