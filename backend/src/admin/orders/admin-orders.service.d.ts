import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../../orders/schemas/order.schema';
import { UpdateOrderDto } from '../../orders/dto';
import { OrderQueryParams, OrderListResponse } from './types';

export declare class AdminOrdersService {
  private readonly orderModel: Model<OrderDocument>;
  constructor(orderModel: Model<OrderDocument>);

  findAll(filters: OrderQueryParams): Promise<OrderListResponse>;
  findById(id: string): Promise<Order>;
  update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order>;
  delete(id: string): Promise<void>;
  private isValidStatusTransition(
    currentStatus: string,
    newStatus: string,
  ): boolean;
}
