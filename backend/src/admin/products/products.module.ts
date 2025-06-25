import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductsController } from './products.controller';
import { AdminProductsService } from './products.service';
import { Product, ProductSchema } from '../../products/schemas/product.schema';
import { UploadModule } from '../../upload/upload.module';
import { UploadService } from '../../upload/upload.service';
import { ActivityLogsModule } from '../activity-log/activity-log.module';
import { ProductActivityLogService } from '../activity-log/activity-log.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema }
    ]),
    UploadModule,
    ConfigModule,
    ActivityLogsModule // Uncomment if you need activity logs

  ],
  controllers: [ProductsController],  providers: [
    {
      provide: AdminProductsService,
      useFactory: (productModel, configService, uploadService, productActivityLogService) => {
        return new AdminProductsService(productModel, configService, uploadService, productActivityLogService);
      },
      inject: [
        getModelToken(Product.name),
        ConfigService,
        UploadService,
        ProductActivityLogService // Sửa: inject class thay vì string
      ]
    }
  ],
  exports: [AdminProductsService]
})
export class ProductsModule {}
