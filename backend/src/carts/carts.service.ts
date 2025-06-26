import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema as MongooseSchema, Types } from 'mongoose';
import { Cart, CartDocument, CartItem } from './schemas/cart.schema';
import { AddItemToCartDto } from './dto/add-item-to-cart.dto';
import { UsersService } from '../users/users.service';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { calculateOrderTotal } from '../shared/price-calculator';

@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly usersService: UsersService,
  ) {}

  async getCart(userId: string): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ user: userId }).populate({
      path: 'items.product',
      model: 'Product',
    });

    if (!cart) {
      cart = await this.cartModel.create({
        user: userId,
        items: [],
        appliedCouponCode: null,
        appliedGiftCardCode: null,
        loyaltyPointsToUse: 0,
        subtotal: 0,
        shippingCost: 0,
        taxAmount: 0,
        total: 0,
      });

      // Populate the newly created cart
      cart = await this.cartModel.findById(cart._id).populate({
        path: 'items.product',
        model: 'Product',
      });
    }

    // Recalculate cart totals to ensure accuracy
    await this.recalculateCartTotals(cart);
    await cart.save();

    return cart;
  }

  async addItem(
    userId: string,
    addItemDto: AddItemToCartDto,
  ): Promise<CartDocument> {
    const { productId, quantity, isTicked = true } = addItemDto;

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    // Convert productId to ObjectId
    const productObjectId = new Types.ObjectId(productId);

    // Validate product existence
    const product = await this.productModel.findById(productObjectId);
    if (!product || !product.isAvailable) {
      throw new NotFoundException(
        `Product with ID "${productId}" not found or not available`,
      );
    }

    // Find cart with atomic update capabilities
    const cart = await this.cartModel.findOne({ user: userId });

    if (!cart) {
      // Validate stock for new cart
      if (product.stock < quantity) {
        throw new BadRequestException(
          `Not enough stock. Available: ${product.stock}, Requested: ${quantity}`,
        );
      }

      // Reserve stock by decrementing it
      await this.productModel.findByIdAndUpdate(
        productObjectId,
        { $inc: { stock: -quantity } },
        { new: true },
      );

      // Create new cart with the item
      const newCart = await this.cartModel.create({
        user: userId,
        items: [
          {
            product: productObjectId,
            quantity: quantity,
            priceAtAdd: product.price,
            isTicked: isTicked,
          },
        ],
        appliedCouponCode: null,
        appliedGiftCardCode: null,
        loyaltyPointsToUse: 0,
        subtotal: 0,
        shippingCost: 0,
        taxAmount: 0,
        total: 0,
      });

      const populatedCart = await this.cartModel
        .findById(newCart._id)
        .populate({
          path: 'items.product',
          model: 'Product',
        });

      // Recalculate totals for new cart
      await this.recalculateCartTotals(populatedCart);
      await populatedCart.save();

      return populatedCart;
    }

    // Find if the product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productObjectId.toString(),
    );

    if (existingItemIndex > -1) {
      // Update existing item quantity
      const currentQuantity = cart.items[existingItemIndex].quantity;
      const newQuantity = currentQuantity + quantity;

      // Validate stock (checking available stock)
      if (product.stock < quantity) {
        throw new BadRequestException(
          `Not enough stock. Available: ${product.stock}, Current in cart: ${currentQuantity}, Requested additional: ${quantity}`,
        );
      }

      // Reserve additional stock
      await this.productModel.findByIdAndUpdate(
        productObjectId,
        { $inc: { stock: -quantity } },
        { new: true },
      );

      // Update quantity using MongoDB update operators
      await this.cartModel.findOneAndUpdate(
        {
          user: userId,
          'items.product': productObjectId,
        },
        {
          $inc: {
            'items.$.quantity': quantity,
          },
          $set: {
            'items.$.priceAtAdd': product.price,
          },
        },
        { new: true },
      );
    } else {
      // Validate stock for new item
      if (product.stock < quantity) {
        throw new BadRequestException(
          `Not enough stock. Available: ${product.stock}, Requested: ${quantity}`,
        );
      }

      // Reserve stock for new item
      await this.productModel.findByIdAndUpdate(
        productObjectId,
        { $inc: { stock: -quantity } },
        { new: true },
      );

      // Add new item using MongoDB update operators
      await this.cartModel.findOneAndUpdate(
        { user: userId },
        {
          $push: {
            items: {
              product: productObjectId,
              quantity: quantity,
              priceAtAdd: product.price,
              isTicked: isTicked,
            },
          },
        },
        { new: true },
      );
    }

    // Return fully populated cart with recalculated totals
    const updatedCart = await this.cartModel
      .findOne({ user: userId })
      .populate({
        path: 'items.product',
        model: 'Product',
      });

    await this.recalculateCartTotals(updatedCart);
    await updatedCart.save();

    return updatedCart;
  }

  async removeItem(userId: string, productId: string): Promise<CartDocument> {
    // Convert productId to ObjectId for consistent comparison
    const productObjectId = new Types.ObjectId(productId);

    // Get cart without population first for accurate comparison
    const cart = await this.cartModel.findOne({ user: userId });

    if (!cart) {
      throw new NotFoundException(`Cart not found`);
    }

    // Find the item to get its quantity before removing
    const itemToRemove = cart.items.find(
      (item) => item.product.toString() === productObjectId.toString(),
    );

    if (!itemToRemove) {
      throw new NotFoundException(
        `Product with ID "${productId}" not found in cart`,
      );
    }

    // Restore stock back to product
    await this.productModel.findByIdAndUpdate(
      productObjectId,
      { $inc: { stock: itemToRemove.quantity } },
      { new: true },
    );

    // Remove the item using MongoDB pull operation
    await this.cartModel.findOneAndUpdate(
      { user: userId },
      {
        $pull: {
          items: { product: productObjectId },
        },
      },
      { new: true },
    );

    // Return populated cart with recalculated totals
    const updatedCart = await this.cartModel
      .findOne({ user: userId })
      .populate({
        path: 'items.product',
        model: 'Product',
      });

    await this.recalculateCartTotals(updatedCart);
    await updatedCart.save();

    return updatedCart;
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartDocument> {
    if (quantity <= 0) {
      throw new BadRequestException(
        'Quantity must be greater than 0. To remove item, use delete endpoint.',
      );
    }

    // Convert productId to ObjectId for consistent comparison
    const productObjectId = new Types.ObjectId(productId);

    // Validate product existence and stock
    const product = await this.productModel.findById(productObjectId);
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    // Check stock
    if (product.stock < quantity) {
      throw new BadRequestException(
        `Not enough stock. Available: ${product.stock}, Requested: ${quantity}`,
      );
    }

    // Get cart without population first
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Find the item to get current quantity
    const currentItem = cart.items.find(
      (item) => item.product.toString() === productObjectId.toString(),
    );

    if (!currentItem) {
      throw new NotFoundException(
        `Product with ID "${productId}" not found in cart`,
      );
    }

    const currentQuantity = currentItem.quantity;
    const quantityDifference = quantity - currentQuantity;

    // Check if we have enough stock for the increase
    if (quantityDifference > 0 && product.stock < quantityDifference) {
      throw new BadRequestException(
        `Not enough stock. Available: ${product.stock}, Requested additional: ${quantityDifference}`,
      );
    }

    // Update stock based on quantity change
    if (quantityDifference !== 0) {
      await this.productModel.findByIdAndUpdate(
        productObjectId,
        { $inc: { stock: -quantityDifference } }, // Negative because we reserve when increase
        { new: true },
      );
    }

    // Update quantity using MongoDB update operator
    const result = await this.cartModel.findOneAndUpdate(
      {
        user: userId,
        'items.product': productObjectId,
      },
      {
        $set: {
          'items.$.quantity': quantity,
          'items.$.priceAtAdd': product.price,
        },
      },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException('Failed to update item quantity');
    }

    // Recalculate subtotal
    await this.recalculateSubtotal(result);
    await result.save();

    // Return populated cart
    return this.cartModel.findById(result._id).populate({
      path: 'items.product',
      model: 'Product',
    });
  }

  async clearCart(userId: string): Promise<CartDocument> {
    await this.usersService.findById(userId);

    // Get current cart to restore stock before clearing
    const currentCart = await this.cartModel.findOne({ user: userId });

    if (currentCart && currentCart.items.length > 0) {
      // Restore stock for all items in cart
      for (const item of currentCart.items) {
        await this.productModel.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { new: true },
        );
      }
    }

    // Use atomic update for better performance
    const clearedCart = await this.cartModel.findOneAndUpdate(
      { user: userId },
      {
        items: [],
        appliedCouponCode: null,
        appliedGiftCardCode: null,
        loyaltyPointsToUse: 0,
        subtotal: 0,
        shippingCost: 0,
        taxAmount: 0,
        total: 0,
        updatedAt: new Date(),
      },
      { new: true, upsert: true },
    );

    return this.cartModel.findById(clearedCart._id).populate('items.product');
  }

  // Clear cart without restoring stock (used when order is confirmed)
  async clearCartWithoutStockRestore(userId: string): Promise<CartDocument> {
    await this.usersService.findById(userId);

    // Use atomic update for better performance - DO NOT restore stock
    const clearedCart = await this.cartModel.findOneAndUpdate(
      { user: userId },
      {
        items: [],
        appliedCouponCode: null,
        appliedGiftCardCode: null,
        loyaltyPointsToUse: 0,
        subtotal: 0,
        shippingCost: 0,
        taxAmount: 0,
        total: 0,
        updatedAt: new Date(),
      },
      { new: true, upsert: true },
    );

    return this.cartModel.findById(clearedCart._id).populate('items.product');
  }

  // Helper method to recalculate cart totals using universal price calculator
  private async recalculateCartTotals(cart: CartDocument): Promise<void> {
    // Prepare cart items for calculation (only ticked items)
    const cartItems = cart.items
      .filter((item) => item.isTicked)
      .map((item) => ({
        quantity: item.quantity,
        priceAtAdd: item.priceAtAdd,
      }));

    // Use universal price calculator
    const calculation = calculateOrderTotal(cartItems);

    // Update cart with calculated values
    cart.subtotal = parseFloat(calculation.subtotal.toFixed(2));
    cart.shippingCost = parseFloat(calculation.shippingCost.toFixed(2));
    cart.taxAmount = parseFloat(calculation.taxAmount.toFixed(2));
    cart.discount = 0;
    cart.total = parseFloat(calculation.total.toFixed(2));
  }

  // Legacy method for backward compatibility
  private async recalculateSubtotal(cart: CartDocument): Promise<void> {
    await this.recalculateCartTotals(cart);
  }

  // Simplified addToCart method - delegates to addItem
  async addToCart(userId: string, addItemDto: AddItemToCartDto): Promise<Cart> {
    return this.addItem(userId, addItemDto);
  }

  // Validate cart items for stock and price changes
  async validateCart(userId: string): Promise<{
    isValid: boolean;
    issues: Array<{
      productId: string;
      type: 'stock' | 'price' | 'unavailable';
      message: string;
      currentStock?: number;
      requestedQuantity?: number;
      currentPrice?: number;
      cartPrice?: number;
    }>;
  }> {
    const cart = await this.cartModel.findOne({ user: userId }).populate({
      path: 'items.product',
      model: 'Product',
    });

    if (!cart) {
      return { isValid: true, issues: [] };
    }

    const issues = [];

    for (const item of cart.items) {
      const product = item.product as any; // Populated product object

      if (!product) {
        issues.push({
          productId: item.product.toString(),
          type: 'unavailable' as const,
          message: 'This product is no longer available',
        });
        continue;
      }

      // Check stock availability (NOTE: stock in cart is already reserved, so we only check if product is out of stock completely)
      if (!product.isAvailable) {
        issues.push({
          productId: product._id.toString(),
          type: 'unavailable' as const,
          message: 'Product is no longer available',
        });
      }

      // Check price changes (allow small floating point differences)
      const priceDifference = Math.abs(product.price - item.priceAtAdd);
      if (priceDifference > 0.01) {
        const priceChange =
          product.price > item.priceAtAdd ? 'increased' : 'decreased';
        issues.push({
          productId: product._id.toString(),
          type: 'price' as const,
          message: `Price has ${priceChange} from $${(item.priceAtAdd / 23000).toFixed(2)} to $${(product.price / 23000).toFixed(2)}`,
          currentPrice: product.price,
          cartPrice: item.priceAtAdd,
        });
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  // Method to cleanup duplicate items (call this once to fix existing data)
  async cleanupDuplicateItems(userId: string): Promise<CartDocument> {
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Group items by productId and merge quantities
    const mergedItems = new Map();

    for (const item of cart.items) {
      const productId = item.product.toString();

      if (mergedItems.has(productId)) {
        // Add quantity to existing item
        const existing = mergedItems.get(productId);
        existing.quantity += item.quantity;
        // Keep the latest price
        existing.priceAtAdd = item.priceAtAdd;
      } else {
        // First occurrence of this productId
        mergedItems.set(productId, {
          product: item.product,
          quantity: item.quantity,
          priceAtAdd: item.priceAtAdd,
          isTicked: item.isTicked,
        });
      }
    }

    // Replace cart items with merged items
    cart.items = Array.from(mergedItems.values());

    // Recalculate subtotal
    await this.recalculateSubtotal(cart);

    await cart.save();
    return this.cartModel.findById(cart._id).populate('items.product');
  }

  async updateItemInCart(
    userId: string,
    productId: string,
    updateDto: { quantity?: number; isTicked?: boolean },
  ): Promise<CartDocument> {
    const productObjectId = new Types.ObjectId(productId);

    // Use atomic update with MongoDB operators instead of loading and saving
    const updateFields: any = {};

    if (updateDto.quantity !== undefined) {
      if (updateDto.quantity < 1) {
        throw new BadRequestException('Quantity must be >= 1');
      }
      updateFields['items.$.quantity'] = updateDto.quantity;
    }

    if (updateDto.isTicked !== undefined) {
      updateFields['items.$.isTicked'] = updateDto.isTicked;
    }

    // Perform atomic update
    const result = await this.cartModel.findOneAndUpdate(
      {
        user: userId,
        'items.product': productObjectId,
      },
      {
        $set: updateFields,
      },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException('Item not found in cart');
    }

    // Recalculate cart totals
    await this.recalculateCartTotals(result);
    await result.save();

    // Return populated cart
    return this.cartModel.findById(result._id).populate({
      path: 'items.product',
      model: 'Product',
    });
  }
}
