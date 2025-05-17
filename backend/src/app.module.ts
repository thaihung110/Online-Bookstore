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

    // Feature modules
    UsersModule,
    AuthModule,
    BooksModule,
    CartsModule,
    OrdersModule,
    WishlistsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
