import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument, CartItem } from './schemas/cart.schema';
import { AddItemToCartDto } from './dto/add-item-to-cart.dto';
import { UsersService } from '../users/users.service'; // To ensure user exists
import { BooksService } from '../books/books.service'; // To ensure book exists

@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    private readonly usersService: UsersService, // Inject UsersService
    private readonly booksService: BooksService, // Inject BooksService
  ) {}

  async getCart(userId: string): Promise<CartDocument> {
    await this.usersService.findById(userId); // Ensure user exists
    let cart = await this.cartModel
      .findOne({ user: userId as any })
      .populate('items.book', 'title price coverImage stock');

    if (!cart) {
      const newCart = new this.cartModel({ user: userId, items: [] });
      await newCart.save();
      // Re-fetch to populate after save
      cart = await this.cartModel
        .findOne({ user: userId as any })
        .populate('items.book', 'title price coverImage stock');
      if (!cart) {
        // This should ideally not happen if save was successful
        throw new NotFoundException('Failed to create or retrieve cart.');
      }
    }
    return cart;
  }

  async addItem(
    userId: string,
    addItemToCartDto: AddItemToCartDto,
  ): Promise<CartDocument> {
    const { bookId, quantity } = addItemToCartDto;
    await this.usersService.findById(userId); // Ensure user exists
    const book = await this.booksService.findOne(bookId); // Ensure book exists

    const cart = await this.getCart(userId);
    const bookObjectId = new Types.ObjectId(bookId);

    const existingItemIndex = cart.items.findIndex((item) =>
      ((item.book as any)._id ?? (item.book as any)).equals(bookObjectId),
    );

    let currentQuantityInCart = 0;
    if (existingItemIndex > -1) {
      currentQuantityInCart = cart.items[existingItemIndex].quantity;
    }

    if (!book || book.stock < currentQuantityInCart + quantity) {
      throw new NotFoundException(
        `Book with ID "${bookId}" not found or not enough stock. Available: ${book.stock}, Requested: ${currentQuantityInCart + quantity}`,
      );
    }

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ book: bookObjectId, quantity } as any); // Cast to any for Mongoose to handle ObjectId types
    }

    await cart.save();
    return this.getCart(userId); // Return populated cart
  }

  async removeItem(userId: string, bookId: string): Promise<CartDocument> {
    await this.usersService.findById(userId); // Ensure user exists
    await this.booksService.findOne(bookId); // Ensure book exists

    const cart = await this.getCart(userId);
    const bookObjectId = new Types.ObjectId(bookId);

    cart.items = cart.items.filter(
      (item) =>
        !((item.book as any)._id ?? (item.book as any)).equals(bookObjectId),
    );

    await cart.save();
    return this.getCart(userId); // Return populated cart
  }

  async updateItemQuantity(
    userId: string,
    bookId: string,
    quantity: number,
  ): Promise<CartDocument> {
    if (quantity <= 0) {
      throw new NotFoundException(
        'Quantity must be greater than 0. To remove item, use delete endpoint.',
      );
    }
    await this.usersService.findById(userId);
    const book = await this.booksService.findOne(bookId);
    if (!book || book.stock < quantity) {
      throw new NotFoundException(
        `Book with ID "${bookId}" not found or not enough stock. Available: ${book.stock}, Requested: ${quantity}`,
      );
    }

    const cart = await this.getCart(userId);
    const bookObjectId = new Types.ObjectId(bookId);
    const itemIndex = cart.items.findIndex((item) =>
      ((item.book as any)._id ?? (item.book as any)).equals(bookObjectId),
    );

    if (itemIndex === -1) {
      throw new NotFoundException(
        `Book with ID "${bookId}" not found in cart.`,
      );
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<CartDocument> {
    await this.usersService.findById(userId); // Ensure user exists
    const cart = await this.getCart(userId);
    cart.items = [];
    await cart.save();
    return this.getCart(userId); // Return populated (empty) cart
  }
}
