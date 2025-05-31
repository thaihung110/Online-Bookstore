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

    return cart;
  }

  async addItem(
    userId: string,
    addItemDto: AddItemToCartDto,
  ): Promise<CartDocument> {
    const { bookId, quantity } = addItemDto;

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
      return total + item.priceAtAdd * item.quantity;
    }, 0);
  }

  // Atomic add item method to prevent race conditions
  async addItemAtomic(
    userId: string,
    addItemDto: AddItemToCartDto,
  ): Promise<CartDocument> {
    const { bookId, quantity } = addItemDto;

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
}
