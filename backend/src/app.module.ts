import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
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
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './upload/upload.module';
import { BooksUpdater } from './scripts/update-books';
import { Book, BookSchema } from './books/schemas/book.schema';
import { RecommendProxyMiddleware } from './proxy/recommend-proxy.middleware';

@Module({
  imports: [
    // Configure environment variables and currency settings
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        () => ({
          currency: {
            base: process.env.CURRENCY_BASE || 'USD',
            vndToUsdRate: parseInt(process.env.VND_TO_USD_RATE, 10) || 25000,
          },
          database: {
            uri: process.env.MONGO_URI,
          },
          r2: {
            accessKey: process.env.CF_R2_ACCESS_KEY,
            secretKey: process.env.CF_R2_SECRET_KEY,
            endpoint: process.env.CF_R2_ENDPOINT,
            bucketName: process.env.CF_BUCKET_NAME,
            region: process.env.CF_R2_REGION,
          },
        }),
      ],
    }),

    // Configure MongoDB connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('database.uri');
        console.log('MongoDB Connection URI:', uri);
        return {
          uri,
          useNewUrlParser: true,
          useUnifiedTopology: true,
          retryWrites: true,
          w: 'majority',
          connectTimeoutMS: 30000,
          socketTimeoutMS: 30000,
        };
      },
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
    AdminModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    BooksUpdater,
    {
      provide: 'CURRENCY_CONFIG',
      useFactory: (configService: ConfigService) => ({
        baseRate: configService.get<number>('currency.vndToUsdRate'),
        currency: configService.get<string>('currency.base'),
      }),
      inject: [ConfigService],
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RecommendProxyMiddleware)
      .forRoutes({ path: 'api/recommend/*', method: RequestMethod.ALL });
  }
}
