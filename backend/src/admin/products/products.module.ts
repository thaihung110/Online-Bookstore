import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductsController } from './products.controller';
import { AdminProductsService } from './products.service';
import { Product, ProductSchema } from '../../products/schemas/product.schema';
import { UploadModule } from '../../upload/upload.module';
import { UploadService } from '../../upload/upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema }
    ]),
    UploadModule,
    ConfigModule
  ],
  controllers: [ProductsController],  providers: [
    {
      provide: AdminProductsService,
      useFactory: (productModel, configService, uploadService) => {
        return new AdminProductsService(productModel, configService, uploadService);
      },
      inject: [
        getModelToken(Product.name),
        ConfigService,
        UploadService
      ]
    }
  ],
  exports: [AdminProductsService]
})
export class ProductsModule {}
