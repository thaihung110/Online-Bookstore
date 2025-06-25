import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DVD, DVDSchema } from './schemas/DVD.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Product.name, 
        schema: ProductSchema
      },
      {
        name: DVD.name, 
        schema: DVDSchema,
        collection: 'AN_test'
      }
    ])  ],
  providers: [],
  exports: [MongooseModule]
})
export class DVDsModule {}
