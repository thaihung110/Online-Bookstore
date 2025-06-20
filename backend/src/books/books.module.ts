import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from './schemas/book.schema';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { UpdateBooksController } from './update-books.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),
    UploadModule,
  ],
  controllers: [BooksController, UpdateBooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
