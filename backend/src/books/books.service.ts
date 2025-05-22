import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from './schemas/book.schema';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { QueryBookDto, SortField, SortOrder } from './dto/query-book.dto';

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(@InjectModel(Book.name) private bookModel: Model<BookDocument>) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    const newBook = new this.bookModel(createBookDto);
    return newBook.save();
  }

  async findAll(
    queryDto: QueryBookDto,
  ): Promise<{ books: Book[]; total: number; page: number; limit: number }> {
    this.logger.log(`Finding books with filters: ${JSON.stringify(queryDto)}`);

    try {
      // Build the filter object
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
            book.genres.some(
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
            book.genres.some((bookGenre) =>
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
        // 1. Thử sử dụng tìm kiếm chính xác không phân biệt chữ hoa/thường
        const caseInsensitiveExactMatchCount =
          await this.bookModel.countDocuments({
            $or: genresArray.map((genre) => ({
              genres: { $regex: new RegExp(`^${genre}$`, 'i') },
            })),
          });

        this.logger.log(
          `Case-insensitive exact match count: ${caseInsensitiveExactMatchCount}`,
        );

        // 2. Nếu không tìm thấy kết quả, sử dụng phương pháp tìm kiếm một phần
        if (caseInsensitiveExactMatchCount === 0) {
          this.logger.log('No exact matches found, trying partial matching');
          filter.$or = genresArray.map((genre) => ({
            genres: { $regex: new RegExp(genre, 'i') },
          }));
        } else {
          // Sử dụng phương pháp tìm kiếm chính xác không phân biệt chữ hoa/thường
          filter.$or = genresArray.map((genre) => ({
            genres: { $regex: new RegExp(`^${genre}$`, 'i') },
          }));
        }

        this.logger.log(`Final filter object: ${JSON.stringify(filter)}`);
      }

      // Price range filter
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

      return {
        books,
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

      const books = await this.bookModel
        .find({ isFeatured: true })
        .limit(safeLimit)
        .exec();
      this.logger.log(`Found ${books.length} featured books`);
      return books;
    } catch (error) {
      this.logger.error(
        `Error finding featured books: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.bookModel.findById(id).exec();
    if (!book) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto): Promise<Book> {
    const updatedBook = await this.bookModel
      .findByIdAndUpdate(id, updateBookDto, { new: true })
      .exec();
    if (!updatedBook) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
    return updatedBook;
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
      // Kiểm tra có dữ liệu nào trong collection không
      const booksCount = await this.bookModel.countDocuments();
      this.logger.log(`Total books in collection: ${booksCount}`);

      // Lấy một số sách để kiểm tra
      const sampleBooks = await this.bookModel.find().limit(5).select('genres');
      this.logger.log(
        `Sample books genres: ${JSON.stringify(sampleBooks.map((book) => book.genres))}`,
      );

      // Sử dụng MongoDB distinct để lấy tất cả giá trị duy nhất của trường genres
      const rawGenres = await this.bookModel.distinct('genres').exec();
      this.logger.log(
        `Found ${rawGenres.length} raw genres: ${JSON.stringify(rawGenres)}`,
      );

      // Chuẩn hóa thể loại (đảm bảo không trùng lặp khi chỉ khác case)
      const genreMap = new Map<string, string>();

      // Xử lý cẩn thận với các null/undefined/empty values
      const validGenres = rawGenres.filter(
        (genre) =>
          genre && typeof genre === 'string' && genre.trim().length > 0,
      );

      validGenres.forEach((genre) => {
        // Chuẩn hóa: loại bỏ khoảng trắng, đảm bảo định dạng nhất quán
        const normalizedGenre = genre.trim();
        // Sử dụng lowercase làm key để tránh trùng lặp chỉ khác case
        const lowerGenre = normalizedGenre.toLowerCase();

        // Ưu tiên giữ lại version có chữ hoa ở đầu mỗi từ
        if (
          !genreMap.has(lowerGenre) ||
          (!isCapitalized(genreMap.get(lowerGenre)) &&
            isCapitalized(normalizedGenre))
        ) {
          genreMap.set(lowerGenre, normalizedGenre);
        }
      });

      // Chuyển về mảng và sắp xếp
      const genres = Array.from(genreMap.values()).sort();
      this.logger.log(
        `Normalized ${genres.length} unique genres: ${JSON.stringify(genres)}`,
      );

      // Debug: Kiểm tra số lượng sách theo từng thể loại đã chuẩn hóa
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
      // Fallback khi có lỗi
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
