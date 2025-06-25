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
import { UploadService } from '../upload/upload.service';
import { calculateOrderTotal } from '../shared/price-calculator';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly usersService: UsersService,
    private readonly booksService: BooksService,
    private readonly cartsService: CartsService,
    private readonly uploadService: UploadService,
  ) {}

  async createOrder(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<OrderDocument> {
    console.log('[Orders Service] Creating order for user:', userId);
    console.log(
      '[Orders Service] Order DTO:',
      JSON.stringify(createOrderDto, null, 2),
    );
    console.log('[Orders Service] Order items:', createOrderDto.items);

    await this.usersService.findById(userId); // Ensure user exists

    const processedOrderItems: OrderItem[] = [];

    for (const itemDto of createOrderDto.items) {
      console.log('[Orders Service] Processing item:', itemDto);
      console.log('[Orders Service] Looking for book with ID:', itemDto.bookId);
      console.log('[Orders Service] About to call booksService.findOne...');

      let book: BookDocument;
      try {
        book = (await this.booksService.findOne(
          itemDto.bookId,
        )) as BookDocument;
        console.log(
          '[Orders Service] Successfully found book:',
          book._id,
          book.title,
        );
      } catch (error) {
        console.error('[Orders Service] Error in booksService.findOne:', error);
        throw error;
      }
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
      // Use the original MongoDB _id, not the processed book.id
      const bookObjectId = new Types.ObjectId(itemDto.bookId);
      console.log(
        '[Orders Service] Using book ObjectId:',
        bookObjectId.toString(),
      );

      processedOrderItems.push({
        book: bookObjectId as any, // Use original MongoDB _id
        quantity: itemDto.quantity,
        price: book.price,
        discount: book.discountRate || 0,
        title: book.title,
        author: book.author,
      } as OrderItem);
    }

    if (processedOrderItems.length === 0) {
      throw new BadRequestException('Order must contain at least one item.');
    }

    // Prepare cart items for universal calculation
    const cartItems: Array<{ quantity: number; priceAtAdd: number }> = [];
    let totalItemDiscount = 0;

    for (const item of processedOrderItems) {
      // Calculate individual item discount
      const itemDiscount =
        (item.price * item.quantity * (item.discount || 0)) / 100;
      totalItemDiscount += itemDiscount;

      cartItems.push({
        quantity: item.quantity,
        priceAtAdd: item.price, // Use original price for subtotal calculation
      });
    }

    // Use universal price calculator - SINGLE SOURCE OF TRUTH
    const calculation = calculateOrderTotal(cartItems);

    // Log calculation details for debugging
    console.log('[Orders Service] Universal calculation:');
    console.log('- Subtotal:', calculation.subtotal);
    console.log('- Total items:', calculation.totalItems);
    console.log('- Shipping cost:', calculation.shippingCost);
    console.log('- Tax amount:', calculation.taxAmount);
    console.log('- Final total:', calculation.total);

    // Determine initial status based on payment method
    let initialStatus: string;
    let isPaid = false;
    let paidAt: Date | null = null;
    let receivedAt: Date | null = null;
    let pendingExpiry: Date | null = null;

    if (createOrderDto.paymentInfo.method === 'cash') {
      // CASH orders are immediately RECEIVED
      initialStatus = 'RECEIVED';
      isPaid = true;
      paidAt = new Date();
      receivedAt = new Date();
    } else {
      // VNPAY orders start as PENDING
      initialStatus = 'PENDING';
      isPaid = false;
      paidAt = null;
      // Set expiry time to 24 hours from now
      pendingExpiry = new Date();
      pendingExpiry.setHours(pendingExpiry.getHours() + 24);
    }

    const newOrder = new this.orderModel({
      user: new Types.ObjectId(userId) as any,
      items: processedOrderItems,
      shippingAddress: createOrderDto.shippingAddress,
      paymentInfo: {
        method: createOrderDto.paymentInfo.method,
        isPaid,
        paidAt,
        paymentId: createOrderDto.paymentInfo.paymentId,
      },
      subtotal: calculation.subtotal,
      tax: calculation.taxAmount,
      shippingCost: calculation.shippingCost,
      discount: 0,
      total: calculation.total,
      status: initialStatus,
      receivedAt,
      pendingExpiry,
      isGift: createOrderDto.isGift,
      giftMessage: createOrderDto.giftMessage,
      loyaltyPointsEarned: 0,
    });

    try {
      const savedOrder = await newOrder.save();

      // Decrement stock for each book using original book IDs
      for (let i = 0; i < processedOrderItems.length; i++) {
        const item = processedOrderItems[i];
        const originalBookId = createOrderDto.items[i].bookId; // Use original book ID

        console.log(
          '[Orders Service] Updating stock for book ID:',
          originalBookId,
        );

        const bookToUpdate = (await this.booksService.findOne(
          originalBookId,
        )) as BookDocument;
        const newStock = bookToUpdate.stock - item.quantity;
        await this.booksService.update(originalBookId, {
          stock: newStock,
        });

        console.log(
          '[Orders Service] Updated stock for book:',
          originalBookId,
          'new stock:',
          newStock,
        );
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

    // Process cover images for all books in order items
    if (order.items) {
      await Promise.all(
        order.items.map(async (item: any) => {
          if (item.book && item.book.coverImage) {
            item.book.coverImage = await this.uploadService.processImageUrl(
              item.book.coverImage,
            );
          }
        }),
      );
    }

    return order;
  }

  // Method to handle payment completion from payment gateway
  async handlePaymentCompleted(
    orderId: string,
    paymentId: string,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(new Types.ObjectId(orderId));
    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Order ${orderId} is not in PENDING status`,
      );
    }

    // Update order to RECEIVED when payment is completed
    order.status = 'RECEIVED';
    order.paymentInfo.isPaid = true;
    order.paymentInfo.paidAt = new Date();
    order.paymentInfo.paymentId = paymentId;
    order.receivedAt = new Date();
    order.pendingExpiry = null; // Clear expiry

    return await order.save();
  }

  // Method to auto-cancel expired PENDING orders
  async cancelExpiredOrders(): Promise<number> {
    const now = new Date();
    const expiredOrders = await this.orderModel.find({
      status: 'PENDING',
      pendingExpiry: { $lte: now },
    });

    let canceledCount = 0;
    for (const order of expiredOrders) {
      await this.cancelOrder(
        order._id.toString(),
        'Auto-canceled after 24 hours',
      );
      canceledCount++;
    }

    return canceledCount;
  }

  // Method to cancel an order
  async cancelOrder(orderId: string, reason: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(new Types.ObjectId(orderId));
    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    if (!['PENDING', 'RECEIVED'].includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel order with status ${order.status}`,
      );
    }

    // Restore stock for canceled orders
    for (const item of order.items) {
      const book = await this.booksService.findOne(item.book.toString());
      if (book) {
        await this.booksService.update(item.book.toString(), {
          stock: book.stock + item.quantity,
        });
      }
    }

    order.status = 'CANCELED';
    order.cancelledAt = new Date();
    order.notes.push(`Canceled: ${reason}`);

    return await order.save();
  }

  // Admin method to update order status with proper flow validation
  async updateOrderStatus(
    orderId: string,
    newStatus: string,
    adminId?: string,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(new Types.ObjectId(orderId));
    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    // Validate status transitions
    const allowedTransitions = {
      RECEIVED: ['CONFIRMED', 'CANCELED'],
      CONFIRMED: ['PREPARED', 'CANCELED'],
      PREPARED: ['SHIPPED', 'CANCELED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: ['REFUNDED'],
    };

    const currentStatus = order.status;
    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }

    // Update status and timestamps
    order.status = newStatus;
    const now = new Date();

    switch (newStatus) {
      case 'CONFIRMED':
        order.confirmedAt = now;
        break;
      case 'PREPARED':
        order.preparedAt = now;
        break;
      case 'SHIPPED':
        order.shippedAt = now;
        break;
      case 'DELIVERED':
        order.deliveredAt = now;
        break;
      case 'REFUNDED':
        order.refundedAt = now;
        break;
      case 'CANCELED':
        order.cancelledAt = now;
        // Restore stock for canceled orders
        for (const item of order.items) {
          const book = await this.booksService.findOne(item.book.toString());
          if (book) {
            await this.booksService.update(item.book.toString(), {
              stock: book.stock + item.quantity,
            });
          }
        }
        break;
    }

    if (adminId) {
      order.notes.push(
        `Status updated to ${newStatus} by admin ${adminId} at ${now.toISOString()}`,
      );
    }

    return await order.save();
  }

  // Method to get orders by status
  async findOrdersByStatus(status: string): Promise<OrderDocument[]> {
    return this.orderModel.find({ status }).sort({ createdAt: -1 }).exec();
  }

  // Method to get pending orders that will expire soon
  async findOrdersExpiringSoon(
    hoursAhead: number = 2,
  ): Promise<OrderDocument[]> {
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + hoursAhead);

    return this.orderModel
      .find({
        status: 'PENDING',
        pendingExpiry: { $lte: futureTime, $gt: new Date() },
      })
      .sort({ pendingExpiry: 1 })
      .exec();
  }
}
