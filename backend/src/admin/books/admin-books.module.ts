// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { ConfigModule } from '@nestjs/config';
// import { AdminBooksController } from './admin-books.controller';
// import { AdminBooksService } from './admin-books.service';
// import { Book, BookSchema } from '../../books/schemas/book.schema';
// import { UploadModule } from '../../upload/upload.module';

// @Module({
//   imports: [
//     MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),
//     ConfigModule,
//     UploadModule,
//   ],
//   controllers: [AdminBooksController],
//   providers: [AdminBooksService],
//   exports: [AdminBooksService],
// })
// export class AdminBooksModule {}



import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminBooksController } from './admin-books.controller';
import { AdminBooksService } from './admin-books.service';
import { Book,BookSchema } from '../../books/schemas/book.schema';
import { Product, ProductSchema } from '../../products/schemas/product.schema';
import { UploadModule } from '../../upload/upload.module';
import { UploadService } from '../../upload/upload.service';
import { ActivityLogsModule } from '../activity-log/activity-log.module';;
import { ProductActivityLogService } from '../activity-log/activity-log.service';
import { BooksModule } from '../../books/books.module'; // Assuming you have a BookModule

@Module({
  imports: [
    MongooseModule.forFeature([
      { 
        name: Product.name, 
        schema: ProductSchema,
        discriminators: [
          { name: Book.name, schema: BookSchema }
        ]
      }
    ]),
    UploadModule,
    ConfigModule,
    ActivityLogsModule
  ],
  controllers: [AdminBooksController],
  providers: [
    {
      provide: AdminBooksService,
      useFactory: (bookModel, configService, uploadService,productActivityLogService) => {
        return new AdminBooksService(bookModel, configService, uploadService,productActivityLogService);
      },
      inject: [
        getModelToken(Book.name),
        ConfigService,
        UploadService,
        ProductActivityLogService
      ]
    }
  ],
  exports: [AdminBooksService],
})
export class AdminBooksModule {}
