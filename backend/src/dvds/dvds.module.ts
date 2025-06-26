import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DVD, DVDSchema } from './schemas/dvd.schema';
import { DVDsController } from './dvds.controller';
import { DVDsService } from './dvds.service';
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
        name: DVD.name, 
        schema: DVDSchema,
        collection: 'products' // Specify the collection name if needed
      }
    ]),
    UploadModule
  ],
  controllers: [DVDsController],
  providers: [DVDsService],
  exports: [MongooseModule, DVDsService]
})
export class DVDsModule {}
