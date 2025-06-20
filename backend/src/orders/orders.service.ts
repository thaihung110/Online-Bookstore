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
    console.log('[Orders Service] Order DTO:', JSON.stringify(createOrderDto, null, 2));
    console.log('[Orders Service] Order items:', createOrderDto.items);

    await this.usersService.findById(userId); // Ensure user exists

    const processedOrderItems: OrderItem[] = [];

    for (const itemDto of createOrderDto.items) {
      console.log('[Orders Service] Processing item:', itemDto);
      console.log('[Orders Service] Looking for book with ID:', itemDto.bookId);
      console.log('[Orders Service] About to call booksService.findOne...');

      let book: BookDocument;
      try {
        book = (await this.booksService.findOne(itemDto.bookId)) as BookDocument;
        console.log('[Orders Service] Successfully found book:', book._id, book.title);
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
      console.log('[Orders Service] Using book ObjectId:', bookObjectId.toString());

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
    for (const item of processedOrderItems) {
      cartItems.push({
        quantity: item.quantity,
        priceAtAdd: item.price * (1 - (item.discount || 0) / 100), // Apply discount
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
    console.log('- Order discount:', calculation.discount);
    console.log('- Final total:', calculation.total);

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
      subtotal: calculation.subtotal,
      tax: calculation.taxAmount,
      shippingCost: calculation.shippingCost,
      discount: calculation.discount,
      total: calculation.total,
      status: 'pending', // Initial status
      isGift: createOrderDto.isGift,
      giftMessage: createOrderDto.giftMessage,
      // loyaltyPointsEarned: 0, // Calculate later
    });

    try {
      const savedOrder = await newOrder.save();

      // Decrement stock for each book using original book IDs
      for (let i = 0; i < processedOrderItems.length; i++) {
        const item = processedOrderItems[i];
        const originalBookId = createOrderDto.items[i].bookId; // Use original book ID

        console.log('[Orders Service] Updating stock for book ID:', originalBookId);

        const bookToUpdate = (await this.booksService.findOne(
          originalBookId,
        )) as BookDocument;
        const newStock = bookToUpdate.stock - item.quantity;
        await this.booksService.update(originalBookId, {
          stock: newStock,
        });

        console.log('[Orders Service] Updated stock for book:', originalBookId, 'new stock:', newStock);
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
            item.book.coverImage = await this.uploadService.processImageUrl(item.book.coverImage);
          }
        })
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
