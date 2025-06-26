import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from './schemas/book.schema';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { UploadModule } from '../upload/upload.module';
import { Product, ProductSchema } from '../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Product.name, 
        schema: ProductSchema,
      },
      {
        name: Book.name, 
        schema: BookSchema,
        collection: 'products' // Specify the collection name if needed
      }
    ]),
    UploadModule
  ],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [MongooseModule,BooksService]
})
export class BooksModule {}
