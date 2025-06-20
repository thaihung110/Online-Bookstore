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

export declare class AdminBooksService {
  private bookModel;
  constructor(bookModel: Model<BookDocument>);
  findAll(filters: BookFilters): Promise<BookListResponse>;
  findById(id: string): Promise<Book>;
  create(createBookDto: CreateBookDto): Promise<Book>;
  update(id: string, updateBookDto: UpdateBookDto): Promise<Book>;
  delete(id: string): Promise<void>;
}
