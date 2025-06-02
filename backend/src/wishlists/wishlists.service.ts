import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Document } from 'mongoose';
import {
  Wishlist,
  WishlistDocument,
  WishlistItem,
} from './schemas/wishlist.schema';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { Book, BookDocument } from '../books/schemas/book.schema';
import { UploadService } from '../upload/upload.service';

interface WishlistResponse {
  _id: string;
  userId: string;
  items: Array<{
    _id: string;
    book: any;
    addedAt: Date;
  }>;
  totalItems: number;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class WishlistsService {
  constructor(
    @InjectModel(Wishlist.name) private wishlistModel: Model<WishlistDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Get or create a user's wishlist
   */
  async getOrCreateWishlist(userId: string): Promise<WishlistDocument> {
    let wishlist = await this.wishlistModel.findOne({ userId });

    if (!wishlist) {
      wishlist = new this.wishlistModel({
        userId,
        items: [],
      });
      await wishlist.save();
    }

    return wishlist;
  }

  /**
   * Get a user's wishlist with populated book details
   */
  async getUserWishlist(userId: string): Promise<WishlistResponse> {
    const wishlist = await this.getOrCreateWishlist(userId);

    // Populate the book details for each item in the wishlist
    await wishlist.populate({
      path: 'items.bookId',
      model: 'Book',
      select: 'title author price coverImage stock',
    });

    // Process cover images for all books and format the response
    const processedItems = await Promise.all(
      wishlist.items.map(async (item) => {
        const book = item.bookId as any;
        if (book && book.coverImage) {
          book.coverImage = await this.uploadService.processImageUrl(book.coverImage);
        }
        return {
          _id: (item as any)._id.toString(),
          book: book,
          addedAt: item.addedAt,
        };
      })
    );

    return {
      _id: wishlist._id ? wishlist._id.toString() : '',
      userId: wishlist.userId.toString(),
      items: processedItems,
      totalItems: wishlist.items.length,
      createdAt: (wishlist as any).createdAt,
      updatedAt: (wishlist as any).updatedAt,
    };
  }

  /**
   * Add an item to the wishlist
   */
  async addToWishlist(
    userId: string,
    addToWishlistDto: AddToWishlistDto,
  ): Promise<Wishlist> {
    const { bookId } = addToWishlistDto;

    // Validate that the book exists
    const bookExists = await this.bookModel.exists({ _id: bookId });
    if (!bookExists) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    // Get or create the user's wishlist
    const wishlist = await this.getOrCreateWishlist(userId);

    // Check if the book is already in the wishlist
    const isBookInWishlist = wishlist.items.some(
      (item) => item.bookId.toString() === bookId,
    );

    if (isBookInWishlist) {
      throw new ConflictException('Book is already in the wishlist');
    }

    // Add the book to the wishlist
    wishlist.items.push({
      bookId,
      addedAt: new Date(),
    } as WishlistItem);

    return wishlist.save();
  }

  /**
   * Remove an item from the wishlist
   */
  async removeFromWishlist(userId: string, bookId: string): Promise<Wishlist> {
    const wishlist = await this.getOrCreateWishlist(userId);

    // Find the index of the book in the wishlist
    const itemIndex = wishlist.items.findIndex(
      (item) => item.bookId.toString() === bookId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException(
        `Book with ID ${bookId} not found in wishlist`,
      );
    }

    // Remove the book from the wishlist
    wishlist.items.splice(itemIndex, 1);

    return wishlist.save();
  }

  /**
   * Clear the entire wishlist
   */
  async clearWishlist(userId: string): Promise<void> {
    const wishlist = await this.getOrCreateWishlist(userId);
    wishlist.items = [];
    await wishlist.save();
  }
}
