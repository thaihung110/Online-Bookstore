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

    const newBook = new this.bookModel(bookData);
    const savedBook = await newBook.save();
    return await this.processBookData(savedBook);
  }

  async findAll(
    queryDto: QueryBookDto,
  ): Promise<{ books: Book[]; total: number; page: number; limit: number }> {
    this.logger.log(`Finding books with filters: ${JSON.stringify(queryDto)}`);

    try {
      const filter: any = {};

      // Search term (match title or description or author)
      if (queryDto.search) {
        filter['$or'] = [
          { title: { $regex: queryDto.search, $options: 'i' } },
          { description: { $regex: queryDto.search, $options: 'i' } },
          { author: { $regex: queryDto.search, $options: 'i' } },
        ];
      }

      // Author filter (case-insensitive)
      if (queryDto.author) {
        filter.author = { $regex: queryDto.author, $options: 'i' };
      }

      // Genres filter (match any of the provided genres)
      if (queryDto.genres && queryDto.genres.length > 0) {
        this.logger.log(
          `BooksService: Filtering by genres: ${JSON.stringify(queryDto.genres)}`,
        );

        // DEBUG: In ra một số sách mẫu để xem thực sự có các thể loại này không
        this.logger.log('DEBUGGING GENRES FILTER:');

        // Đảm bảo queryDto.genres là array
        const genresArray = Array.isArray(queryDto.genres)
          ? queryDto.genres
          : [queryDto.genres];

        // Lấy tất cả sách để xem cấu trúc genres và nội dung
        const allBooks = await this.bookModel
          .find()
          .select('title genres')
          .lean();
        this.logger.log(`Total books found: ${allBooks.length}`);

        // Log the first 10 books with their genres for debugging
        const sampleBooks = allBooks.slice(0, 10);
        this.logger.log(`Sample books: ${JSON.stringify(sampleBooks)}`);

        // Look for exact genre matches in the dataset
        for (const genre of genresArray) {
          const exactMatches = allBooks.filter((book) =>
            book.genres && Array.isArray(book.genres) && book.genres.some(
              (bookGenre) => bookGenre.toLowerCase() === genre.toLowerCase(),
            ),
          );
          this.logger.log(
            `Books with EXACT match for genre "${genre}": ${exactMatches.length}`,
          );
          if (exactMatches.length > 0) {
            this.logger.log(
              `Example matches: ${JSON.stringify(exactMatches.slice(0, 3).map((b) => b.title))}`,
            );
          }

          // Compare with partial matches
          const partialMatches = allBooks.filter((book) =>
            book.genres && Array.isArray(book.genres) && book.genres.some((bookGenre) =>
              bookGenre.toLowerCase().includes(genre.toLowerCase()),
            ),
          );
          this.logger.log(
            `Books with PARTIAL match for genre "${genre}": ${partialMatches.length}`,
          );
          if (
            partialMatches.length > 0 &&
            partialMatches.length !== exactMatches.length
          ) {
            this.logger.log(
              `Example partial matches: ${JSON.stringify(partialMatches.slice(0, 3).map((b) => b.title))}`,
            );
          }
        }

        // Thử các cách khác nhau để query
        for (const genre of genresArray) {
          // Exact match
          const exactCount = await this.bookModel.countDocuments({
            genres: genre,
          });
          // Case insensitive exact
          const caseInsensitiveCount = await this.bookModel.countDocuments({
            genres: { $regex: new RegExp(`^${genre}$`, 'i') },
          });
          // Case insensitive contains
          const containsCount = await this.bookModel.countDocuments({
            genres: { $regex: new RegExp(genre, 'i') },
          });

          this.logger.log(
            `Genre "${genre}": exact=${exactCount}, case-insensitive exact=${caseInsensitiveCount}, contains=${containsCount}`,
          );
        }

        // Sử dụng phương pháp tìm kiếm phù hợp nhất dựa trên kết quả thử nghiệm
        const caseInsensitiveExactMatchCount =
          await this.bookModel.countDocuments({
            $or: genresArray.map((genre) => ({
              genres: { $regex: new RegExp(`^${genre}$`, 'i') },
            })),
          });

        this.logger.log(
          `Case-insensitive exact match count: ${caseInsensitiveExactMatchCount}`,
        );

        // Nếu không tìm thấy kết quả chính xác, sử dụng tìm kiếm một phần
        if (caseInsensitiveExactMatchCount === 0) {
          this.logger.log('No exact matches found, trying partial matching');
          filter.$or = genresArray.map((genre) => ({
            genres: { $regex: new RegExp(genre, 'i') },
          }));
        } else {
          filter.$or = genresArray.map((genre) => ({
            genres: { $regex: new RegExp(`^${genre}$`, 'i') },
          }));
        }

        this.logger.log(`Final filter object: ${JSON.stringify(filter)}`);
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
      .aggregate([
        {
          $match: {
            stock: { $gt: 0 }, // Còn hàng
            isAvailable: true, // Có sẵn để bán
            $expr: { $gt: ["$originalPrice", "$price"] } // originalPrice > price (có giảm giá)
          }
        },
        {
          $addFields: {
            // Tính discount rate
            discountRate: {
              $multiply: [
                {
                  $divide: [
                    { $subtract: ["$originalPrice", "$price"] },
                    "$originalPrice"
                  ]
                },
                100
              ]
            }
          }
        },
        {
          $sort: { discountRate: -1 } // Sắp xếp theo discount rate giảm dần
        },
        {
          $limit: safeLimit
        }
      ])
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
      const book = await this.bookModel.findById(id).exec();
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
    const result = await this.bookModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
    return { deleted: true };
  }

  async getAllGenres(): Promise<string[]> {
    this.logger.log('Getting all unique genres');
    try {
      const booksCount = await this.bookModel.countDocuments();
      this.logger.log(`Total books in collection: ${booksCount}`);

      const sampleBooks = await this.bookModel.find().limit(5).select('genres');
      this.logger.log(
        `Sample books genres: ${JSON.stringify(sampleBooks.map((book) => book.genres))}`,
      );

      const rawGenres = await this.bookModel.distinct('genres').exec();
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

      const commonGenres = genres.slice(0, Math.min(5, genres.length));
      for (const genre of commonGenres) {
        const count = await this.bookModel.countDocuments({
          genres: { $regex: new RegExp(`^${genre}$`, 'i') },
        });
        this.logger.log(`Genre "${genre}" has ${count} books`);
      }

      return genres;
    } catch (error) {
      this.logger.error(`Error getting genres: ${error.message}`, error.stack);
      return [
        'Fiction',
        'Non-Fiction',
        'Science Fiction',
        'Fantasy',
        'Mystery',
      ];
    }
  }
}

// Helper function để kiểm tra xem chuỗi có được viết hoa chữ cái đầu không
function isCapitalized(str: string | undefined): boolean {
  if (!str) return false;
  return /^[A-Z]/.test(str);
}
