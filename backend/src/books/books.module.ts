import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from './schemas/book.schema';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { UpdateBooksController } from './update-books.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),
  ],
  controllers: [BooksController, UpdateBooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
