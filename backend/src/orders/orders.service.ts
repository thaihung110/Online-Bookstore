import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderItem } from './schemas/order.schema';
import { CreateOrderDto, CreateOrderFromCartDto } from './dto/create-order.dto';
import { UsersService } from '../users/users.service';
import { BooksService } from '../books/books.service';
import { CartsService } from '../carts/carts.service';
import { BookDocument } from '../books/schemas/book.schema';
import { CartItem } from '../carts/schemas/cart.schema';
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

    if (createOrderDto.paymentInfo.method === 'COD') {
      // COD orders are immediately RECEIVED but not yet paid (will pay on delivery)
      initialStatus = 'RECEIVED';
      isPaid = false; // COD = not paid yet, will pay on delivery
      paidAt = null; // COD = will have paidAt when actually paid on delivery
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
        isPaid: Boolean(isPaid), // Ensure boolean type
        paidAt,
        paymentId: createOrderDto.paymentInfo.paymentId || undefined,
      },
      subtotal: calculation.subtotal,
      tax: calculation.taxAmount,
      shippingCost: calculation.shippingCost,
      discount: 0,
      total: calculation.total,
      status: initialStatus,
      receivedAt,
      pendingExpiry,
      isGift: Boolean(createOrderDto.isGift || false), // Ensure boolean type
      giftMessage: createOrderDto.giftMessage || undefined,
      loyaltyPointsEarned: 0,
    });

    try {
      console.log('[Orders Service] About to save order with data:');
      console.log('User ID:', userId);
      console.log('Payment Method:', createOrderDto.paymentInfo.method);
      console.log('Initial Status:', initialStatus);
      console.log('Is Paid:', isPaid);
      console.log(
        'Payment Logic Applied:',
        createOrderDto.paymentInfo.method === 'COD'
          ? 'COD - Order set to RECEIVED immediately'
          : 'VNPAY - Order set to PENDING',
      );
      console.log(
        'Payment Info:',
        JSON.stringify(
          {
            method: createOrderDto.paymentInfo.method,
            isPaid: Boolean(isPaid),
            paidAt,
            paymentId: createOrderDto.paymentInfo.paymentId || undefined,
          },
          null,
          2,
        ),
      );
      console.log(
        'Complete Order Data:',
        JSON.stringify(
          {
            user: new Types.ObjectId(userId),
            items: processedOrderItems.length,
            paymentInfo: {
              method: createOrderDto.paymentInfo.method,
              isPaid: Boolean(isPaid),
              paidAt,
              paymentId: createOrderDto.paymentInfo.paymentId || undefined,
            },
            status: initialStatus,
            total: calculation.total,
          },
          null,
          2,
        ),
      );

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
      // For now, log and throw specific error based on type
      console.error('Error creating order or updating stock: ', error);

      // Handle MongoDB validation errors specifically
      if (
        error.name === 'ValidationError' ||
        error.name === 'MongoServerError'
      ) {
        console.error('MongoDB Validation Error Details:');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);

        if (error.errors) {
          console.error('Validation Errors:');
          for (const field in error.errors) {
            console.error(`- ${field}: ${error.errors[field].message}`);
          }
        }

        if (error.errInfo) {
          console.error('Error Info:', JSON.stringify(error.errInfo, null, 2));
        }

        throw new BadRequestException(
          `Order validation failed: ${error.message}. Please check your order data.`,
        );
      }

      // Handle other types of errors
      throw new InternalServerErrorException(
        `Failed to create order: ${error.message}. Please try again.`,
      );
    }
  }

  async createOrderFromCart(
    userId: string,
    createOrderFromCartDto: CreateOrderFromCartDto,
  ): Promise<OrderDocument> {
    console.log('[Orders Service] Creating order from cart for user:', userId);

    // Get user's cart
    const cart = await this.cartsService.getCart(userId);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty. Cannot create order.');
    }

    // Filter only ticked items for checkout
    const tickedItems = cart.items.filter((item) => item.isTicked);

    if (tickedItems.length === 0) {
      throw new BadRequestException(
        'No items selected for checkout. Please select items to proceed.',
      );
    }

    // Convert cart items to order items format
    const orderItemsDto = tickedItems.map((cartItem) => ({
      bookId: (cartItem.book as any)._id
        ? (cartItem.book as any)._id.toString()
        : cartItem.book.toString(),
      quantity: cartItem.quantity,
    }));

    // Create the order DTO with cart items
    const createOrderDto: CreateOrderDto = {
      items: orderItemsDto,
      shippingAddress: createOrderFromCartDto.shippingAddress,
      paymentInfo: createOrderFromCartDto.paymentInfo,
      isGift: createOrderFromCartDto.isGift,
      giftMessage: createOrderFromCartDto.giftMessage,
    };

    // Use existing createOrder method
    return this.createOrder(userId, createOrderDto);
  }

  async findAll(): Promise<OrderDocument[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).exec();
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
    console.log(`[ORDERS DEBUG] ===== handlePaymentCompleted START =====`);
    console.log(`[ORDERS DEBUG] Input orderId: ${orderId}`);
    console.log(`[ORDERS DEBUG] Input paymentId: ${paymentId}`);

    const order = await this.orderModel.findById(new Types.ObjectId(orderId));
    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    console.log(`[ORDERS DEBUG] Found order successfully`);
    console.log(`[ORDERS DEBUG] Order ID: ${order._id.toString()}`);
    console.log(`[ORDERS DEBUG] Current order status: ${order.status}`);
    console.log(`[ORDERS DEBUG] Payment method: ${order.paymentInfo.method}`);
    console.log(
      `[ORDERS DEBUG] Current payment info:`,
      JSON.stringify(order.paymentInfo, null, 2),
    );

    // For COD orders, they're already RECEIVED, just update payment info
    if (order.paymentInfo.method === 'COD') {
      console.log(`[ORDERS DEBUG] COD order - updating payment info only`);

      // For COD: isPaid = false, paidAt = null (will be paid on delivery)
      const codPaymentInfo = {
        isPaid: false,
        paidAt: null,
        paymentId: paymentId,
      };

      // Ensure order is marked as RECEIVED (should already be)
      const codStatus = order.status !== 'RECEIVED' ? 'RECEIVED' : order.status;
      const codReceivedAt =
        order.status !== 'RECEIVED' ? new Date() : order.receivedAt;

      console.log(
        `[ORDERS DEBUG] COD payment info to set:`,
        JSON.stringify(codPaymentInfo, null, 2),
      );

      try {
        console.log(
          `[ORDERS DEBUG] Using direct MongoDB update for COD order...`,
        );

        const updateResult = await this.orderModel.updateOne(
          { _id: new Types.ObjectId(orderId) },
          {
            $set: {
              status: codStatus,
              'paymentInfo.isPaid': false, // COD = not paid yet
              'paymentInfo.paidAt': null, // COD = will pay on delivery
              'paymentInfo.paymentId': paymentId,
              receivedAt: codReceivedAt,
              pendingExpiry: null,
              updatedAt: new Date(),
            },
          },
        );

        console.log(`[ORDERS DEBUG] COD MongoDB update result:`, updateResult);

        // Fetch the updated document
        const updatedOrder = await this.orderModel.findById(
          new Types.ObjectId(orderId),
        );
        console.log(
          `[ORDERS DEBUG] ✅ COD order updated with direct MongoDB operation!`,
        );

        // Verify the saved data
        const freshOrder = await this.orderModel.findById(
          new Types.ObjectId(orderId),
        );
        console.log(`[ORDERS DEBUG] === COD FRESH FETCH FROM DB ===`);
        console.log(
          `[ORDERS DEBUG] Fresh COD payment info:`,
          JSON.stringify(freshOrder.paymentInfo, null, 2),
        );
        console.log(`[ORDERS DEBUG] Fresh COD status: ${freshOrder.status}`);

        return updatedOrder;
      } catch (saveError) {
        console.log(`[ORDERS DEBUG] ❌ COD UPDATE ERROR:`, saveError);
        throw saveError;
      }
    }

    // For VNPAY orders, transition from PENDING to RECEIVED
    if (order.status !== 'PENDING') {
      console.log(`[ORDERS DEBUG] ERROR: Order not in PENDING status`);
      throw new BadRequestException(
        `Order ${orderId} is not in PENDING status (current: ${order.status})`,
      );
    }

    console.log(
      `[ORDERS DEBUG] VNPAY order - transitioning from PENDING to RECEIVED`,
    );

    // Update order to RECEIVED when payment is completed
    const paymentCompletedAt = new Date();
    console.log(
      `[ORDERS DEBUG] Payment completed timestamp: ${paymentCompletedAt.toISOString()}`,
    );

    // Store original values for comparison
    const originalIsPaid = order.paymentInfo.isPaid;
    const originalPaidAt = order.paymentInfo.paidAt;
    const originalPaymentId = order.paymentInfo.paymentId;
    const originalStatus = order.status;

    console.log(`[ORDERS DEBUG] === BEFORE SAVE COMPARISON ===`);
    console.log(`[ORDERS DEBUG] isPaid: ${originalIsPaid} → true`);
    console.log(
      `[ORDERS DEBUG] paidAt: ${originalPaidAt} → ${paymentCompletedAt}`,
    );
    console.log(
      `[ORDERS DEBUG] paymentId: ${originalPaymentId} → ${paymentId}`,
    );
    console.log(`[ORDERS DEBUG] status: ${originalStatus} → RECEIVED`);

    try {
      console.log(`[ORDERS DEBUG] Attempting to save order...`);

      // BYPASS MONGOOSE - Use direct MongoDB update to avoid middleware issues
      console.log(
        `[ORDERS DEBUG] Using direct MongoDB update to bypass middleware...`,
      );

      const updateResult = await this.orderModel.updateOne(
        { _id: new Types.ObjectId(orderId) },
        {
          $set: {
            status: 'RECEIVED',
            'paymentInfo.isPaid': true,
            'paymentInfo.paidAt': paymentCompletedAt,
            'paymentInfo.paymentId': paymentId,
            receivedAt: paymentCompletedAt,
            pendingExpiry: null,
            updatedAt: new Date(),
          },
        },
      );

      console.log(`[ORDERS DEBUG] Direct MongoDB update result:`, updateResult);

      // Fetch the updated document
      const updatedOrder = await this.orderModel.findById(
        new Types.ObjectId(orderId),
      );
      console.log(
        `[ORDERS DEBUG] ✅ VNPAY order updated with direct MongoDB operation!`,
      );

      // Verify the saved data
      const freshOrder = await this.orderModel.findById(
        new Types.ObjectId(orderId),
      );
      console.log(`[ORDERS DEBUG] === FRESH FETCH FROM DB ===`);
      console.log(
        `[ORDERS DEBUG] Fresh order payment info:`,
        JSON.stringify(freshOrder.paymentInfo, null, 2),
      );
      console.log(`[ORDERS DEBUG] Fresh order status: ${freshOrder.status}`);

      console.log(`[ORDERS DEBUG] ===== handlePaymentCompleted END =====`);
      return updatedOrder;
    } catch (saveError) {
      console.log(`[ORDERS DEBUG] ❌ UPDATE ERROR:`, saveError);
      console.log(`[ORDERS DEBUG] Error name: ${saveError.name}`);
      console.log(`[ORDERS DEBUG] Error message: ${saveError.message}`);
      if (saveError.errInfo) {
        console.log(
          `[ORDERS DEBUG] Error info:`,
          JSON.stringify(saveError.errInfo, null, 2),
        );
      }
      throw saveError;
    }
  }
}
