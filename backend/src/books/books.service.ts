import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from './schemas/book.schema';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(@InjectModel(Book.name) private bookModel: Model<BookDocument>) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    const newBook = new this.bookModel(createBookDto);
    return newBook.save();
  }

  async findAll(
    query?: any,
  ): Promise<{ books: Book[]; total: number; page: number; limit: number }> {
    // Basic query handling for now
    // Add more sophisticated filtering/pagination later based on query object
    // For example: query.genre, query.author, query.page, query.limit
    const filter = {};
    if (query && query.genre) {
      filter['genres'] = query.genre;
    }
    if (query && query.author) {
      filter['author'] = { $regex: query.author, $options: 'i' }; // Case-insensitive search
    }
    // Basic pagination example (can be enhanced)
    const page =
      query && parseInt(query.page, 10) > 0 ? parseInt(query.page, 10) : 1;
    const limit =
      query && parseInt(query.limit, 10) > 0 ? parseInt(query.limit, 10) : 10;
    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
      this.bookModel.find(filter).skip(skip).limit(limit).exec(),
      this.bookModel.countDocuments(filter).exec(),
    ]);

    return {
      books,
      total,
      page,
      limit,
    };
  }

  async findFeatured(limit: number = 6): Promise<Book[]> {
    return this.bookModel.find({ isFeatured: true }).limit(limit).exec();
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
}
