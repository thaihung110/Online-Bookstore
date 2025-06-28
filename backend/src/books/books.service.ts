import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from './schemas/book.schema';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { QueryBookDto, SortField, SortOrder } from './dto/query-book.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    private readonly uploadService: UploadService,
  ) {}

  // Helper method to process book data (prices are already in USD, just process image URLs)
  private async processBookData(book: any): Promise<any> {
    if (!book) return null;
    const bookObj = book.toObject ? book.toObject() : { ...book };

    // Process image URL using UploadService
    const coverImage = await this.uploadService.processImageUrl(bookObj.coverImage);

    // Ensure price values are valid numbers
    const originalPrice = bookObj.originalPrice || 0;
    const discountRate = bookObj.discountRate || 0;
    const price = bookObj.price || (originalPrice * (1 - discountRate / 100));

    return {
      ...bookObj,
      coverImage,
      originalPrice,
      discountRate,
      price,
    };
  }

  async create(createBookDto: CreateBookDto): Promise<Book> {
    // Handle coverImageUrl field - use it as coverImage if coverImage is not provided
    const bookData = { ...createBookDto };
    if (!bookData.coverImage && bookData.coverImageUrl) {
      bookData.coverImage = bookData.coverImageUrl;
    }

    // Remove coverImageUrl from the data as it's not part of the schema
    delete bookData.coverImageUrl;

    // Set productType explicitly
    const bookWithType = { ...bookData, productType: 'BOOK' };

    const newBook = new this.bookModel(bookWithType);
    const savedBook = await newBook.save();
    return await this.processBookData(savedBook);
  }

  async findAll(
    queryDto: QueryBookDto,
  ): Promise<{ books: Book[]; total: number; page: number; limit: number }> {
    this.logger.log(`Finding books with filters: ${JSON.stringify(queryDto)}`);

    try {
      const filter: any = { productType: 'BOOK' };

      // Search term (match title, author, description, publisher, or isbn)
      if (queryDto.search) {
        filter['$or'] = [
          { title: { $regex: queryDto.search, $options: 'i' } },
          { author: { $regex: queryDto.search, $options: 'i' } },
          { description: { $regex: queryDto.search, $options: 'i' } },
          { publisher: { $regex: queryDto.search, $options: 'i' } },
          { isbn: { $regex: queryDto.search, $options: 'i' } },
        ];
      }

      // Author filter (case-insensitive)
      if (queryDto.author) {
        filter.author = { $regex: queryDto.author, $options: 'i' };
      }

      // Genre filter (match any of the provided genres)
      if (queryDto.genres && queryDto.genres.length > 0) {
        this.logger.log(
          `BooksService: Filtering by genres: ${JSON.stringify(queryDto.genres)}`,
        );

        const genresArray = Array.isArray(queryDto.genres)
          ? queryDto.genres
          : [queryDto.genres];

        filter.genres = {
          $in: genresArray.map((genre) => new RegExp(`^${genre}$`, 'i')),
        };
      }

      // Price range filter (prices are stored in USD)
      if (queryDto.minPrice !== undefined || queryDto.maxPrice !== undefined) {
        filter.price = {};
        if (queryDto.minPrice !== undefined) {
          filter.price.$gte = queryDto.minPrice;
        }
        if (queryDto.maxPrice !== undefined) {
          filter.price.$lte = queryDto.maxPrice;
        }
      }

      // Publication year range filter
      if (queryDto.minYear !== undefined || queryDto.maxYear !== undefined) {
        filter.publicationYear = {};
        if (queryDto.minYear !== undefined) {
          filter.publicationYear.$gte = queryDto.minYear;
        }
        if (queryDto.maxYear !== undefined) {
          filter.publicationYear.$lte = queryDto.maxYear;
        }
      }

      // In stock filter (stock > 0)
      if (queryDto.inStock) {
        filter.stock = { $gt: 0 };
      }

      // On sale filter (discountRate > 0)
      if (queryDto.onSale) {
        filter.discountRate = { $gt: 0 };
      }

      // Minimum discount rate filter
      if (queryDto.minDiscountRate !== undefined) {
        filter.discountRate = filter.discountRate || {};
        filter.discountRate.$gte = queryDto.minDiscountRate;
      }

      // Pagination
      const page = queryDto.page || 1;
      const limit = queryDto.limit || 10;
      const skip = (page - 1) * limit;

      // Handle sorting
      const sortBy = queryDto.sortBy || SortField.CREATED_AT;
      const sortOrder = queryDto.sortOrder || SortOrder.DESC;
      const sort: any = {};
      sort[sortBy] = sortOrder === SortOrder.ASC ? 1 : -1;

      this.logger.log(`Applying filter: ${JSON.stringify(filter)}`);
      this.logger.log(`Sorting by: ${JSON.stringify(sort)}`);

      // Execute the query with filters, pagination, and sorting
      const [books, total] = await Promise.all([
        this.bookModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
        this.bookModel.countDocuments(filter).exec(),
      ]);

      this.logger.log(
        `Found ${books.length} books out of ${total} total matches`,
      );

      // Process image URLs before returning (prices are already in USD)
      const transformedBooks = await Promise.all(
        books.map((book) => this.processBookData(book))
      );

      return {
        books: transformedBooks,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Error finding books: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findFeatured(limit: number = 6): Promise<Book[]> {
    this.logger.log(`Finding featured books with limit: ${limit}`);
    try {
      // Đảm bảo limit nằm trong khoảng hợp lệ
      const safeLimit = Math.min(Math.max(1, limit), 20);
      if (safeLimit !== limit) {
        this.logger.warn(`Adjusted limit from ${limit} to ${safeLimit}`);
      }

      // Lấy sách có discount rate cao nhất và còn hàng
      const books = await this.bookModel
        .find({
          productType: 'BOOK', // Only get books
          discountRate: { $gt: 0 }, // Chỉ lấy sách đang giảm giá
          stock: { $gt: 0 }, // Chỉ lấy sách còn hàng
        })
        .sort({ discountRate: -1 }) // Sắp xếp theo discount rate giảm dần
        .limit(safeLimit)
        .exec();

      this.logger.log(`Found ${books.length} featured books`);

      // Process image URLs before returning (prices are already in USD)
      return await Promise.all(
        books.map((book) => this.processBookData(book))
      );
    } catch (error) {
      this.logger.error(
        `Error finding featured books: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findOne(id: string): Promise<Book> {
    console.log('[Books Service] findOne called with ID:', id);
    console.log('[Books Service] ID type:', typeof id);
    console.log('[Books Service] ID length:', id.length);

    try {
      const book = await this.bookModel.findOne({ _id: id, productType: 'BOOK' }).exec();
      console.log('[Books Service] MongoDB query result:', book ? 'Found' : 'Not found');

      if (!book) {
        console.log('[Books Service] Book not found, throwing NotFoundException');
        throw new NotFoundException(`Book with ID "${id}" not found`);
      }

      console.log('[Books Service] Found book:', book._id, book.title);
      const processedBook = await this.processBookData(book);
      console.log('[Books Service] Processed book successfully');
      return processedBook;
    } catch (error) {
      console.error('[Books Service] Error in findOne:', error);
      throw error;
    }
  }

  async update(id: string, updateBookDto: UpdateBookDto): Promise<Book> {
    // Handle coverImageUrl field - use it as coverImage if coverImage is not provided
    const updateData = { ...updateBookDto };
    if (!updateData.coverImage && updateData.coverImageUrl) {
      updateData.coverImage = updateData.coverImageUrl;
    }

    // Remove coverImageUrl from the data as it's not part of the schema
    delete updateData.coverImageUrl;

    // Use findById + save to trigger pre-save hooks
    const bookToUpdate = await this.bookModel.findById(id).exec();
    if (!bookToUpdate) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }

    // Update the book with new data
    Object.assign(bookToUpdate, updateData);
    const updatedBook = await bookToUpdate.save();
    return await this.processBookData(updatedBook);
  }

  async remove(id: string): Promise<{ deleted: boolean; message?: string }> {
    const result = await this.bookModel.deleteOne({ _id: id, productType: 'BOOK' }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
    return { deleted: true };
  }

  async getAllGenres(): Promise<string[]> {
    this.logger.log('Getting all unique book genres');
    try {
      const booksCount = await this.bookModel.countDocuments({ productType: 'BOOK' });
      this.logger.log(`Total books in collection: ${booksCount}`);

      const rawGenres = await this.bookModel.distinct('genres', { productType: 'BOOK' }).exec();
      this.logger.log(
        `Found ${rawGenres.length} raw genres: ${JSON.stringify(rawGenres)}`,
      );

      const genreMap = new Map<string, string>();
      const validGenres = rawGenres.filter(
        (genre) =>
          genre && typeof genre === 'string' && genre.trim().length > 0,
      );

      validGenres.forEach((genre) => {
        const normalizedGenre = genre.trim();
        const lowerGenre = normalizedGenre.toLowerCase();

        if (
          !genreMap.has(lowerGenre) ||
          (!isCapitalized(genreMap.get(lowerGenre)) &&
            isCapitalized(normalizedGenre))
        ) {
          genreMap.set(lowerGenre, normalizedGenre);
        }
      });

      const genres = Array.from(genreMap.values()).sort();
      this.logger.log(
        `Normalized ${genres.length} unique genres: ${JSON.stringify(genres)}`,
      );

      return genres;
    } catch (error) {
      this.logger.error(`Error getting genres: ${error.message}`, error.stack);
      return [
        'Fiction',
        'Non-Fiction',
        'Science Fiction',
        'Mystery',
        'Romance',
        'Biography',
        'Fantasy',
        'History',
        'Children',
        'Self-Help',
        'Business',
        'Education',
        'Health',
        'Travel',
        'Cooking',
      ];
    }
  }

  async getBooksByIds(ids: string[]): Promise<Book[]> {
    this.logger.log(`Getting books by IDs: ${JSON.stringify(ids)}`);
    try {
      const books = await this.bookModel
        .find({
          _id: { $in: ids },
          productType: 'BOOK',
        })
        .exec();

      return await Promise.all(
        books.map((book) => this.processBookData(book))
      );
    } catch (error) {
      this.logger.error(`Error getting books by IDs: ${error.message}`, error.stack);
      throw error;
    }
  }
}

// Helper function to check if string is capitalized
function isCapitalized(str: string | undefined): boolean {
  if (!str) return false;
  return /^[A-Z]/.test(str);
}