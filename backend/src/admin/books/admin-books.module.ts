import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AdminBooksController } from './admin-books.controller';
import { AdminBooksService } from './admin-books.service';
import { Book, BookSchema } from '../../books/schemas/book.schema';
import { UploadModule } from '../../upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),
    ConfigModule,
    UploadModule,
  ],
  controllers: [AdminBooksController],
  providers: [AdminBooksService],
  exports: [AdminBooksService],
})
export class AdminBooksModule {}
