import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderItem } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UsersService } from '../users/users.service';
import { BooksService } from '../books/books.service';
import { CartsService } from '../carts/carts.service';
import { BookDocument } from '../books/schemas/book.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly usersService: UsersService,
    private readonly booksService: BooksService,
    private readonly cartsService: CartsService,
  ) {}

  async createOrder(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<OrderDocument> {
    await this.usersService.findById(userId); // Ensure user exists

    const processedOrderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const itemDto of createOrderDto.items) {
      const book: BookDocument = (await this.booksService.findOne(
        itemDto.bookId,
      )) as BookDocument;
      if (!book) {
        throw new NotFoundException(
          `Book with ID "${itemDto.bookId}" not found.`,
        );
      }
      if (book.stock < itemDto.quantity) {
        throw new BadRequestException(
          `Not enough stock for book "${book.title}". Available: ${book.stock}, Requested: ${itemDto.quantity}`,
        );
      }
      processedOrderItems.push({
        book: new Types.ObjectId(book.id) as any, // Cast to any to satisfy schema type if strict
        quantity: itemDto.quantity,
        price: book.price,
        discount: book.discountPercentage || 0,
        title: book.title,
        author: book.author,
      } as OrderItem);
      subtotal +=
        book.price *
        itemDto.quantity *
        (1 - (book.discountPercentage || 0) / 100);
    }

    if (processedOrderItems.length === 0) {
      throw new BadRequestException('Order must contain at least one item.');
    }

    // For now, tax, shipping, and main order discount are mocked/zero
    const tax = 0; // Placeholder
    const shippingCost = 0; // Placeholder
    const orderDiscount = 0; // Placeholder
    const total = subtotal + tax + shippingCost - orderDiscount;

    const newOrder = new this.orderModel({
      user: new Types.ObjectId(userId) as any, // Cast to any for schema compatibility
      items: processedOrderItems,
      shippingAddress: createOrderDto.shippingAddress,
      paymentInfo: {
        ...createOrderDto.paymentInfo,
        isPaid: createOrderDto.paymentInfo.method === 'mock', // Mock payments are considered paid instantly
        paidAt:
          createOrderDto.paymentInfo.method === 'mock' ? new Date() : null,
        transactionId:
          createOrderDto.paymentInfo.method === 'mock'
            ? `mock_${new Types.ObjectId().toHexString()}`
            : createOrderDto.paymentInfo.transactionId,
      },
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      shippingCost: parseFloat(shippingCost.toFixed(2)),
      discount: parseFloat(orderDiscount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      status: 'pending', // Initial status
      isGift: createOrderDto.isGift,
      giftMessage: createOrderDto.giftMessage,
      // loyaltyPointsEarned: 0, // Calculate later
    });

    try {
      const savedOrder = await newOrder.save();

      // Decrement stock for each book
      for (const item of processedOrderItems) {
        const bookToUpdate = (await this.booksService.findOne(
          item.book.toString(),
        )) as BookDocument;
        const newStock = bookToUpdate.stock - item.quantity;
        await this.booksService.update(item.book.toString(), {
          stock: newStock,
        });
      }

      // Clear the user's cart after successful order creation
      await this.cartsService.clearCart(userId);

      return savedOrder;
    } catch (error) {
      // If order saving or stock update fails, we might need a rollback strategy (transactions)
      // For now, log and throw generic error
      console.error('Error creating order or updating stock: ', error);
      throw new InternalServerErrorException(
        'Failed to create order. Please try again.',
      );
    }
  }

  async findUserOrders(userId: string): Promise<OrderDocument[]> {
    await this.usersService.findById(userId); // Ensure user exists
    return this.orderModel
      .find({ user: new Types.ObjectId(userId) as any })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOrderById(
    orderId: string,
    userId?: string,
  ): Promise<OrderDocument> {
    const orderObjectId = new Types.ObjectId(orderId);
    let userObjectId: Types.ObjectId | undefined;

    if (userId) {
      await this.usersService.findById(userId); // Ensure user exists
      userObjectId = new Types.ObjectId(userId);
    }

    const order = await this.orderModel
      .findById(orderObjectId)
      .populate('items.book', 'title coverImage')
      .exec();

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }
    // Ensure order.user is treated as an ObjectId that has .equals method
    const orderUserObjectId =
      order.user instanceof Types.ObjectId
        ? order.user
        : new Types.ObjectId(order.user.toString());
    if (userObjectId && !orderUserObjectId.equals(userObjectId)) {
      throw new NotFoundException(
        `Order with ID "${orderId}" does not belong to the user.`,
      );
    }
    return order;
  }

  // Admin/System method to update order status (simplified)
  async updateOrderStatus(
    orderId: string,
    status: string,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(new Types.ObjectId(orderId));
    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }
    // Add validation for allowed status transitions later
    order.status = status;
    if (status === 'delivered') order.deliveredAt = new Date();
    if (status === 'cancelled') order.cancelledAt = new Date();
    if (status === 'refunded') order.refundedAt = new Date();
    return order.save();
  }
}
