import { AdminOrdersService } from './admin-orders.service';
import { UpdateOrderDto } from '../../orders/dto';
import { Order } from '../../orders/schemas/order.schema';
import { OrderQueryParams, OrderListResponse } from './types';

export declare class AdminOrdersController {
  private readonly adminOrdersService: AdminOrdersService;
  constructor(adminOrdersService: AdminOrdersService);

  findAll(params: OrderQueryParams): Promise<OrderListResponse>;
  findById(id: string): Promise<Order>;
  update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order>;
  delete(id: string): Promise<void>;
}
