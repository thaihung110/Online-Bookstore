import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from '../../books/schemas/book.schema';
import { CreateBookDto } from '../../books/dto/create-book.dto';
import { UpdateBookDto } from '../../books/dto/update-book.dto';

export interface BookFilters {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  author?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: string;
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
export class AdminBooksService {
  constructor(@InjectModel(Book.name) private bookModel: Model<BookDocument>) {}

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
      query.stockQuantity = inStock ? { $gt: 0 } : { $lte: 0 };
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

    return {
      books,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Book> {
    const book = await this.bookModel.findById(id).exec();
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return book;
  }

  async create(createBookDto: CreateBookDto): Promise<Book> {
    // Check if book with ISBN already exists
    if (createBookDto.isbn) {
      const existingBook = await this.bookModel
        .findOne({ isbn: createBookDto.isbn })
        .exec();
      if (existingBook) {
        throw new BadRequestException('Book with this ISBN already exists');
      }
    }

    const newBook = new this.bookModel(createBookDto);
    return newBook.save();
  }

  async update(id: string, updateBookDto: UpdateBookDto): Promise<Book> {
    // Check if book exists
    await this.findById(id);

    // If ISBN is being updated, check if it's not already in use
    if (updateBookDto.isbn) {
      const existingBook = await this.bookModel
        .findOne({ isbn: updateBookDto.isbn })
        .exec();
      if (existingBook && existingBook.id !== id) {
        throw new BadRequestException(
          'Another book with this ISBN already exists',
        );
      }
    }

    const updatedBook = await this.bookModel
      .findByIdAndUpdate(id, updateBookDto, { new: true })
      .exec();

    if (!updatedBook) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return updatedBook;
  }

  async delete(id: string): Promise<void> {
    // Check if book exists
    await this.findById(id);

    const result = await this.bookModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
  }
}
