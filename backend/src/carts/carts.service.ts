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
import { BooksService } from '../books/books.service';
import { Book, BookDocument } from '../books/schemas/book.schema';

@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    private readonly usersService: UsersService,
    private readonly booksService: BooksService,
  ) {}

  async getCart(userId: string): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ user: userId }).populate({
      path: 'items.book',
      model: 'Book',
    });

    if (!cart) {
      cart = await this.cartModel.create({
        user: userId,
        items: [],
        subtotal: 0,
        discount: 0,
      });
    }

    // Debug: Log cart data being returned
    console.log('Debug - getCart returning:', {
      userId,
      cartId: cart._id,
      itemsCount: cart.items.length,
      items: cart.items.map((item) => ({
        bookId: (item.book as any)._id ? (item.book as any)._id.toString() : item.book.toString(),
        quantity: item.quantity,
        priceAtAdd: item.priceAtAdd,
        isTicked: item.isTicked,
      })),
    });

    return cart;
  }

  async addItem(
    userId: string,
    addItemDto: AddItemToCartDto,
  ): Promise<CartDocument> {
    const { bookId, quantity, isTicked = true } = addItemDto;

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    // Convert bookId to ObjectId
    const bookObjectId = new Types.ObjectId(bookId);

    // Validate book existence
    const book = await this.bookModel.findById(bookObjectId);
    if (!book) {
      throw new NotFoundException(`Book with ID "${bookId}" not found`);
    }

    // Find cart with atomic update capabilities
    const cart = await this.cartModel.findOne({ user: userId });

    if (!cart) {
      // Create new cart with the item
      const newCart = await this.cartModel.create({
        user: userId,
        items: [
          {
            book: bookObjectId,
            quantity: quantity,
            priceAtAdd: book.price,
            isTicked: isTicked,
          },
        ],
        subtotal: book.price * quantity,
        discount: 0,
      });

      return this.cartModel.findById(newCart._id).populate({
        path: 'items.book',
        model: 'Book',
      });
    }

    // Find if the book already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.book.toString() === bookObjectId.toString(),
    );

    console.log('Debug - Current cart state:', {
      cartId: cart._id,
      existingItemIndex,
      currentItems: cart.items.map((item) => ({
        bookId: item.book.toString(),
        quantity: item.quantity,
      })),
    });

    if (existingItemIndex > -1) {
      // Update existing item quantity
      const currentQuantity = cart.items[existingItemIndex].quantity;
      const newQuantity = currentQuantity + quantity;

      // Validate stock
      if (book.stock < newQuantity) {
        throw new BadRequestException(
          `Not enough stock. Available: ${book.stock}, Current in cart: ${currentQuantity}, Requested additional: ${quantity}`,
        );
      }

      // Update quantity using MongoDB update operators
      const result = await this.cartModel.findOneAndUpdate(
        {
          user: userId,
          'items.book': bookObjectId,
        },
        {
          $inc: {
            'items.$.quantity': quantity,
            subtotal: book.price * quantity,
          },
          $set: {
            'items.$.priceAtAdd': book.price,
          },
        },
        { new: true },
      );

      console.log('Debug - Updated cart:', {
        success: !!result,
        newQuantity,
        updatedItems: result?.items.map((item) => ({
          bookId: item.book.toString(),
          quantity: item.quantity,
        })),
      });
    } else {
      // Validate stock for new item
      if (book.stock < quantity) {
        throw new BadRequestException(
          `Not enough stock. Available: ${book.stock}, Requested: ${quantity}`,
        );
      }

      // Add new item using MongoDB update operators
      const result = await this.cartModel.findOneAndUpdate(
        { user: userId },
        {
          $push: {
            items: {
              book: bookObjectId,
              quantity: quantity,
              priceAtAdd: book.price,
              isTicked: isTicked,
            },
          },
          $inc: { subtotal: book.price * quantity },
        },
        { new: true },
      );

      console.log('Debug - Added new item:', {
        success: !!result,
        newItem: {
          bookId: bookId,
          quantity: quantity,
        },
      });
    }

    // Return fully populated cart
    return this.cartModel.findOne({ user: userId }).populate({
      path: 'items.book',
      model: 'Book',
    });
  }

  async removeItem(userId: string, bookId: string): Promise<CartDocument> {
    // Convert bookId to ObjectId for consistent comparison
    const bookObjectId = new Types.ObjectId(bookId);

    // Get cart without population first for accurate comparison
    const cart = await this.cartModel.findOne({ user: userId });

    if (!cart) {
      throw new NotFoundException(`Cart not found`);
    }

    console.log('Debug - Remove Item:', {
      bookIdToRemove: bookId,
      bookObjectId: bookObjectId.toString(),
      currentItems: cart.items.map((item) => ({
        bookId: item.book.toString(),
        isMatch: item.book.toString() === bookObjectId.toString(),
      })),
    });

    // Check if item exists using toString() comparison
    const itemExists = cart.items.some((item) => {
      const itemBookId = item.book.toString();
      const targetBookId = bookObjectId.toString();
      console.log('Debug - Comparing IDs:', {
        itemBookId,
        targetBookId,
        isEqual: itemBookId === targetBookId,
      });
      return itemBookId === targetBookId;
    });

    if (!itemExists) {
      throw new NotFoundException(`Book with ID "${bookId}" not found in cart`);
    }

    // Remove item using MongoDB update operator
    const result = await this.cartModel.findOneAndUpdate(
      {
        user: userId,
        'items.book': bookObjectId,
      },
      {
        $pull: {
          items: {
            book: bookObjectId,
          },
        },
      },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException(`Failed to remove item from cart`);
    }

    // Recalculate subtotal
    await this.recalculateSubtotal(result);
    await result.save();

    // Return populated cart
    return this.cartModel.findById(result._id).populate({
      path: 'items.book',
      model: 'Book',
    });
  }

  async updateItemQuantity(
    userId: string,
    bookId: string,
    quantity: number,
  ): Promise<CartDocument> {
    if (quantity <= 0) {
      throw new BadRequestException(
        'Quantity must be greater than 0. To remove item, use delete endpoint.',
      );
    }

    // Convert bookId to ObjectId for consistent comparison
    const bookObjectId = new Types.ObjectId(bookId);

    // Validate book existence and stock
    const book = await this.bookModel.findById(bookObjectId);
    if (!book) {
      throw new NotFoundException(`Book with ID "${bookId}" not found`);
    }

    // Check stock
    if (book.stock < quantity) {
      throw new BadRequestException(
        `Not enough stock. Available: ${book.stock}, Requested: ${quantity}`,
      );
    }

    // Get cart without population first
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    console.log('Debug - Update Quantity:', {
      bookId: bookObjectId.toString(),
      currentItems: cart.items.map((item) => ({
        bookId: item.book.toString(),
        quantity: item.quantity,
        isMatch: item.book.toString() === bookObjectId.toString(),
      })),
    });

    // Check if item exists
    const itemExists = cart.items.some(
      (item) => item.book.toString() === bookObjectId.toString(),
    );

    if (!itemExists) {
      throw new NotFoundException(`Book with ID "${bookId}" not found in cart`);
    }

    // Update quantity using MongoDB update operator
    const result = await this.cartModel.findOneAndUpdate(
      {
        user: userId,
        'items.book': bookObjectId,
      },
      {
        $set: {
          'items.$.quantity': quantity,
          'items.$.priceAtAdd': book.price,
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
      path: 'items.book',
      model: 'Book',
    });
  }

  async clearCart(userId: string): Promise<CartDocument> {
    await this.usersService.findById(userId);
    const cart = await this.getCart(userId);

    cart.items = [];
    cart.subtotal = 0;
    cart.discount = 0;

    await cart.save();
    return this.cartModel.findById(cart._id).populate('items.book');
  }

  // Helper method to recalculate subtotal
  private async recalculateSubtotal(cart: CartDocument): Promise<void> {
    cart.subtotal = cart.items.reduce((total, item) => {
      if (item.isTicked) {
        return total + item.priceAtAdd * item.quantity;
      }
      return total;
    }, 0);
  }

  // Atomic add item method to prevent race conditions
  async addItemAtomic(
    userId: string,
    addItemDto: AddItemToCartDto,
  ): Promise<CartDocument> {
    const { bookId, quantity, isTicked = true } = addItemDto;

    // Validate user and book
    await this.usersService.findById(userId);
    const book = await this.bookModel.findById(bookId);
    if (!book) {
      throw new NotFoundException(`Book with ID "${bookId}" not found`);
    }

    // Check stock
    if (book.stock < quantity) {
      throw new BadRequestException(
        `Not enough stock. Available: ${book.stock}, Requested: ${quantity}`,
      );
    }

    // Try to update existing item first
    const updatedCart = await this.cartModel.findOneAndUpdate(
      {
        user: userId,
        'items.book': new MongooseSchema.Types.ObjectId(bookId),
      },
      {
        $inc: { 'items.$.quantity': quantity },
        $set: { 'items.$.priceAtAdd': book.price },
      },
      { new: true },
    );

    if (updatedCart) {
      // Item was found and updated
      await this.recalculateSubtotal(updatedCart);
      await updatedCart.save();
      return this.cartModel.findById(updatedCart._id).populate('items.book');
    }

    // Item doesn't exist, add new item
    const cartWithNewItem = await this.cartModel.findOneAndUpdate(
      { user: userId },
      {
        $push: {
          items: {
            book: new MongooseSchema.Types.ObjectId(bookId),
            quantity: quantity,
            priceAtAdd: book.price,
            isTicked: isTicked,
          },
        },
      },
      { new: true, upsert: true },
    );

    await this.recalculateSubtotal(cartWithNewItem);
    await cartWithNewItem.save();
    return this.cartModel.findById(cartWithNewItem._id).populate('items.book');
  }

  // Simplified addToCart method - delegates to addItem
  async addToCart(userId: string, addItemDto: AddItemToCartDto): Promise<Cart> {
    return this.addItem(userId, addItemDto);
  }

  // Validate cart items for stock and price changes
  async validateCart(userId: string): Promise<{
    isValid: boolean;
    issues: Array<{
      bookId: string;
      type: 'stock' | 'price' | 'unavailable';
      message: string;
      currentStock?: number;
      requestedQuantity?: number;
      currentPrice?: number;
      cartPrice?: number;
    }>;
  }> {
    const cart = await this.cartModel.findOne({ user: userId }).populate({
      path: 'items.book',
      model: 'Book',
    });

    if (!cart) {
      return { isValid: true, issues: [] };
    }

    const issues = [];

    for (const item of cart.items) {
      const book = item.book as any; // Populated book object

      if (!book) {
        issues.push({
          bookId: item.book.toString(),
          type: 'unavailable' as const,
          message: 'This book is no longer available',
        });
        continue;
      }

      // Check stock availability
      if (book.stock < item.quantity) {
        issues.push({
          bookId: book._id.toString(),
          type: 'stock' as const,
          message: `Only ${book.stock} items available, but ${item.quantity} requested`,
          currentStock: book.stock,
          requestedQuantity: item.quantity,
        });
      }

      // Check price changes (allow small floating point differences)
      const priceDifference = Math.abs(book.price - item.priceAtAdd);
      if (priceDifference > 0.01) {
        const priceChange = book.price > item.priceAtAdd ? 'increased' : 'decreased';
        issues.push({
          bookId: book._id.toString(),
          type: 'price' as const,
          message: `Price has ${priceChange} from $${(item.priceAtAdd / 23000).toFixed(2)} to $${(book.price / 23000).toFixed(2)}`,
          currentPrice: book.price,
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

    // Group items by bookId and merge quantities
    const mergedItems = new Map();

    for (const item of cart.items) {
      const bookId = item.book.toString();

      if (mergedItems.has(bookId)) {
        // Add quantity to existing item
        const existing = mergedItems.get(bookId);
        existing.quantity += item.quantity;
        // Keep the latest price
        existing.priceAtAdd = item.priceAtAdd;
      } else {
        // First occurrence of this bookId
        mergedItems.set(bookId, {
          book: item.book,
          quantity: item.quantity,
          priceAtAdd: item.priceAtAdd,
        });
      }
    }

    // Replace cart items with merged items
    cart.items = Array.from(mergedItems.values());

    // Recalculate subtotal
    await this.recalculateSubtotal(cart);

    await cart.save();
    return this.cartModel.findById(cart._id).populate('items.book');
  }

  async updateItemInCart(
    userId: string,
    bookId: string,
    updateDto: { quantity?: number; isTicked?: boolean },
  ): Promise<CartDocument> {
    const bookObjectId = new Types.ObjectId(bookId);

    console.log('Debug - updateItemInCart called:', {
      userId,
      bookId,
      bookObjectId: bookObjectId.toString(),
      updateDto,
    });

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

    console.log('Debug - updateItemInCart atomic update fields:', updateFields);

    // Perform atomic update
    const result = await this.cartModel.findOneAndUpdate(
      {
        user: userId,
        'items.book': bookObjectId,
      },
      {
        $set: updateFields,
      },
      { new: true }
    );

    if (!result) {
      throw new NotFoundException('Item not found in cart');
    }

    console.log('Debug - updateItemInCart after atomic update:', {
      items: result.items.map((item) => ({
        bookId: item.book.toString(),
        quantity: item.quantity,
        priceAtAdd: item.priceAtAdd,
        isTicked: item.isTicked,
      })),
    });

    // Recalculate subtotal
    await this.recalculateSubtotal(result);
    await result.save();

    console.log('Debug - updateItemInCart after recalculate and save:', {
      items: result.items.map((item) => ({
        bookId: item.book.toString(),
        quantity: item.quantity,
        priceAtAdd: item.priceAtAdd,
        isTicked: item.isTicked,
      })),
    });

    // Return populated cart
    return this.cartModel.findById(result._id).populate({
      path: 'items.book',
      model: 'Book',
    });
  }
}
