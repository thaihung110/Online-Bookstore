import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CD, CDSchema } from './schemas/cd.schema';
import { CDsController } from './cds.controller';
import { CDsService } from './cds.service';
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
        name: CD.name, 
        schema: CDSchema,
        collection: 'products' // Specify the collection name if needed
      }
    ]),
    UploadModule
  ],
  controllers: [CDsController],
  providers: [CDsService],
  exports: [MongooseModule, CDsService]
})
export class CDsModule {}
