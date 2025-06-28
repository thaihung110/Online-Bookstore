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
import { ProductsService } from '../products/products.service';
import { CartsService } from '../carts/carts.service';
import { BookDocument } from '../books/schemas/book.schema';
import { ProductDocument } from '../products/schemas/product.schema';
import { CartItem } from '../carts/schemas/cart.schema';
import { UploadService } from '../upload/upload.service';
import { calculateOrderTotal } from '../shared/price-calculator';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly usersService: UsersService,
    private readonly booksService: BooksService,
    private readonly productsService: ProductsService,
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
      console.log(
        '[Orders Service] Looking for product with ID:',
        itemDto.productId,
      );
      console.log('[Orders Service] About to call productsService.findOne...');

      let product: ProductDocument;
      try {
        product = (await this.productsService.findOne(
          itemDto.productId,
        )) as ProductDocument;
        console.log(
          '[Orders Service] Successfully found product:',
          product._id,
          product.title,
        );
      } catch (error) {
        console.error(
          '[Orders Service] Error in productsService.findOne:',
          error,
        );
        throw error;
      }
      if (!product) {
        throw new NotFoundException(
          `Product with ID "${itemDto.productId}" not found.`,
        );
      }
      if (product.stock < itemDto.quantity) {
        throw new BadRequestException(
          `Not enough stock for product "${product.title}". Available: ${product.stock}, Requested: ${itemDto.quantity}`,
        );
      }
      // Use the original MongoDB _id, not the processed product.id
      const productObjectId = new Types.ObjectId(itemDto.productId);
      console.log(
        '[Orders Service] Using product ObjectId:',
        productObjectId.toString(),
      );

      processedOrderItems.push({
        product: productObjectId as any, // Use original MongoDB _id
        productType: product.productType || 'Product', // Get actual productType from product
        quantity: itemDto.quantity,
        price: product.price || product.originalPrice,
        discount: 0, // Products don't have discountRate
        title: product.title,
        author: '', // Products may not have author
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

      // Stock was already reserved when items were added to cart
      // So we don't need to decrement stock here anymore
      console.log(
        '[Orders Service] Stock was already reserved from cart, skipping stock update',
      );

      // Clear the user's cart after successful order creation
      // This will NOT restore stock since items are now part of confirmed order
      await this.cartsService.clearCartWithoutStockRestore(userId);

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
      productId: (cartItem.product as any)._id
        ? (cartItem.product as any)._id.toString()
        : cartItem.product.toString(),
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
      .populate('user', 'username email')
      .populate('items.product', 'title author price coverImage')
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
      .populate('items.product', 'title coverImage')
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

    // Process cover images for all products in order items
    if (order.items) {
      await Promise.all(
        order.items.map(async (item: any) => {
          if (item.product && item.product.coverImage) {
            item.product.coverImage = await this.uploadService.processImageUrl(
              item.product.coverImage,
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

  // Cancel order method - simplified version
  async cancelOrder(orderId: string, reason: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(new Types.ObjectId(orderId));
    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    if (
      ['SHIPPED', 'DELIVERED', 'REFUNDED', 'CANCELED'].includes(order.status)
    ) {
      throw new BadRequestException(
        `Cannot cancel order with status: ${order.status}`,
      );
    }

    // Restore stock for all items in the canceled order
    for (const item of order.items) {
      await this.productsService.update(item.product.toString(), {
        $inc: { stock: item.quantity },
      } as any);
      console.log(
        `[ORDERS] Restored ${item.quantity} stock for product ${item.product}`,
      );
    }

    const canceledAt = new Date();

    await this.orderModel.updateOne(
      { _id: new Types.ObjectId(orderId) },
      {
        $set: {
          status: 'CANCELED',
          canceledAt,
          cancelReason: reason,
          updatedAt: new Date(),
        },
      },
    );

    return this.orderModel.findById(new Types.ObjectId(orderId));
  }

  // Update order status method - with proper validation
  async updateOrderStatus(
    orderId: string,
    status: string,
    updatedBy?: string,
  ): Promise<OrderDocument> {
    console.log(
      '[Orders Service] Updating order status:',
      orderId,
      'to',
      status,
    );

    const order = await this.orderModel.findById(new Types.ObjectId(orderId));
    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    console.log('[Orders Service] Current order status:', order.status);

    // Validate status transition using the same logic as admin service
    if (!this.isValidStatusTransition(order.status, status)) {
      console.log(
        '[Orders Service] Invalid status transition from',
        order.status,
        'to',
        status,
      );
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${status}`,
      );
    }

    console.log('[Orders Service] Status transition is valid');

    await this.orderModel.updateOne(
      { _id: new Types.ObjectId(orderId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
          ...(updatedBy && { updatedBy }),
        },
      },
    );

    const updatedOrder = await this.orderModel.findById(
      new Types.ObjectId(orderId),
    );
    console.log(
      '[Orders Service] Order status updated successfully:',
      updatedOrder.status,
    );

    return updatedOrder;
  }

  // Status transition validation - same as admin service
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
      '[Orders Service] Checking transition from',
      currentStatus,
      'to',
      newStatus,
    );
    console.log(
      '[Orders Service] Valid transitions for',
      currentStatus,
      ':',
      validTransitions[currentStatus],
    );

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  // Find orders by status
  async findOrdersByStatus(status: string): Promise<OrderDocument[]> {
    return this.orderModel.find({ status }).sort({ createdAt: -1 }).exec();
  }

  // Cancel expired orders (for scheduler) - simplified version
  async cancelExpiredOrders(): Promise<number> {
    const now = new Date();

    const expiredOrders = await this.orderModel.find({
      status: 'PENDING',
      pendingExpiry: { $lt: now },
    });

    console.log(
      `[ORDERS] Found ${expiredOrders.length} expired orders to cancel`,
    );

    let canceledCount = 0;
    for (const order of expiredOrders) {
      try {
        await this.cancelOrder(
          order._id.toString(),
          'Order expired - payment not completed within 24 hours',
        );
        canceledCount++;
        console.log(`[ORDERS] Canceled expired order: ${order._id}`);
      } catch (error) {
        console.error(
          `[ORDERS] Failed to cancel expired order ${order._id}:`,
          error,
        );
      }
    }

    return canceledCount;
  }

  // Find orders expiring soon (for scheduler notifications)
  async findOrdersExpiringSoon(
    hoursBeforeExpiry: number = 2,
  ): Promise<OrderDocument[]> {
    const now = new Date();
    const soonExpiry = new Date(
      now.getTime() + hoursBeforeExpiry * 60 * 60 * 1000,
    );

    return this.orderModel
      .find({
        status: 'PENDING',
        pendingExpiry: {
          $gte: now,
          $lte: soonExpiry,
        },
      })
      .exec();
  }
}
