import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Book, BookDocument } from '../../books/schemas/book.schema';
import { CreateBookDto } from '../../books/dto/create-book.dto';
import { UpdateBookDto } from '../../books/dto/update-book.dto';
import { UploadService } from '../../upload/upload.service';
import { 
  AdminProductsService,
  ProductFilters,
  ProductListResponse
} from '../products/products.service';
import { ProductActivityLogService } from '../activity-log/activity-log.service';


export interface BookFilters extends ProductFilters{
  page: number;
  limit: number;
  search?: string;
  category?: string;
  author?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: string;
  isAvailableRush?: boolean;
  sortOrder?: 'asc' | 'desc';
}

export interface BookListResponse {
  books: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AdminBooksService extends AdminProductsService<Book, BookDocument> {
  protected readonly logger = new Logger(AdminBooksService.name);
  // private readonly VND_TO_USD_RATE: number;

  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    protected readonly configService: ConfigService,
    protected readonly uploadService: UploadService,
    protected readonly productActivityLogService: ProductActivityLogService,
  ) {

    super(bookModel, configService, uploadService, productActivityLogService);
    // this.VND_TO_USD_RATE =1;
  }

  // Helper method to process image URLs without currency conversion (admin panel uses USD directly)
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

  async findAll(filters: BookFilters): Promise<BookListResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      author,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const query: any = {};


    query.productType = 'BOOK';
    query.isAvailable = true;
    // Apply filters
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (author) {
      query.author = { $regex: author, $options: 'i' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        query.price.$lte = maxPrice;
      }
    }

    if (inStock !== undefined) {
      query.stock = inStock ? { $gt: 0 } : { $lte: 0 };
    }

    // Count total documents
    const total = await this.bookModel.countDocuments(query);

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch paginated books
    const books = await this.bookModel
      .find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    // Process books with async image URL processing
    const processedBooks = await Promise.all(
      books.map(book => this.processBookData(book))
    );

    return {
      books: processedBooks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // async findById(id: string): Promise<Book> {
  //   const book = await this.bookModel.findById(id).exec();
  //   if (!book) {
  //     throw new NotFoundException(`Book with ID ${id} not found`);
  //   }
  //   return await this.processBookData(book);
  // }

  // async create(createBookDto: CreateBookDto): Promise<Book> {
  //   // Check if book with ISBN already exists
  //   if (createBookDto.isbn) {
  //     const existingBook = await this.bookModel
  //       .findOne({ isbn: createBookDto.isbn })
  //       .exec();
  //     if (existingBook) {
  //       throw new BadRequestException('Book with this ISBN already exists');
  //     }
  //   }

  //   // Handle coverImageUrl field - use it as coverImage if coverImage is not provided
  //   const bookData = { ...createBookDto };
  //   if (!bookData.coverImage && bookData.coverImageUrl) {
  //     bookData.coverImage = bookData.coverImageUrl;
  //   }

  //   // Remove coverImageUrl from the data as it's not part of the schema
  //   delete bookData.coverImageUrl;

  //   const newBook = new this.bookModel(bookData);
  //   const savedBook = await newBook.save();
  //   return await this.processBookData(savedBook);
  // }

  // async update(id: string, updateBookDto: UpdateBookDto): Promise<Book> {
  //   // Check if book exists
  //   await this.findById(id);

  //   // If ISBN is being updated, check if it's not already in use
  //   if (updateBookDto.isbn) {
  //     const existingBook = await this.bookModel
  //       .findOne({ isbn: updateBookDto.isbn })
  //       .exec();
  //     if (existingBook && existingBook.id !== id) {
  //       throw new BadRequestException(
  //         'Another book with this ISBN already exists',
  //       );
  //     }
  //   }

  //   // Handle coverImageUrl field - use it as coverImage if coverImage is not provided
  //   const updateData = { ...updateBookDto };
  //   if (!updateData.coverImage && updateData.coverImageUrl) {
  //     updateData.coverImage = updateData.coverImageUrl;
  //   }

  //   // Remove coverImageUrl from the data as it's not part of the schema
  //   delete updateData.coverImageUrl;

  //   // Use findById + save to trigger pre-save hooks
  //   const bookToUpdate = await this.bookModel.findById(id).exec();
  //   if (!bookToUpdate) {
  //     throw new NotFoundException(`Book with ID ${id} not found`);
  //   }

  //   // Update the book with new data
  //   Object.assign(bookToUpdate, updateData);
  //   const updatedBook = await bookToUpdate.save();

  //   return await this.processBookData(updatedBook);
  // }

  // async delete(id: string): Promise<void> {
  //   // Check if book exists
  //   await this.findById(id);

  //   const result = await this.bookModel.deleteOne({ _id: id }).exec();
  //   if (result.deletedCount === 0) {
  //     throw new NotFoundException(`Book with ID ${id} not found`);
  //   }
  // }
}
