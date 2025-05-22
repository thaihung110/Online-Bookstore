import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users';
import { AuthModule } from './auth';
import { BooksModule } from './books';
import { CartsModule } from './carts';
import { OrdersModule } from './orders';
import { WishlistsModule } from './wishlists/wishlists.module';
import { PaymentsModule } from './payments/payments.module';
import { BooksUpdater } from './scripts/update-books';
import { Book, BookSchema } from './books/schemas/book.schema';

@Module({
  imports: [
    // Configure environment variables
    ConfigModule.forRoot({
      isGlobal: true, // Make config available throughout the application
      envFilePath: '.env', // Specify the path to the .env file
    }),

    // Configure MongoDB connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    }),

    MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),

    // Feature modules
    UsersModule,
    AuthModule,
    BooksModule,
    CartsModule,
    OrdersModule,
    WishlistsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService, BooksUpdater],
})
export class AppModule {}
