import { AdminBooksService } from './admin-books.service';
import { CreateBookDto } from '../../books/dto/create-book.dto';
import { UpdateBookDto } from '../../books/dto/update-book.dto';
import { Book } from '../../books/schemas/book.schema';

export declare class AdminBooksController {
  private readonly adminBooksService;
  constructor(adminBooksService: AdminBooksService);
  findAll(
    page: number,
    limit: number,
    search?: string,
    category?: string,
    author?: string,
    minPrice?: number,
    maxPrice?: number,
    inStock?: boolean,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Promise<any>;
  findById(id: string): Promise<Book>;
  create(createBookDto: CreateBookDto): Promise<Book>;
  update(id: string, updateBookDto: UpdateBookDto): Promise<Book>;
  delete(id: string): Promise<void>;
}
