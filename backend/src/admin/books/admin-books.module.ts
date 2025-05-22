import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminBooksController } from './admin-books.controller';
import { AdminBooksService } from './admin-books.service';
import { Book, BookSchema } from '../../books/schemas/book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),
  ],
  controllers: [AdminBooksController],
  providers: [AdminBooksService],
  exports: [AdminBooksService],
})
export class AdminBooksModule {}
