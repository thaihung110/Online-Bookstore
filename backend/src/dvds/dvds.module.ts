import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DVD, DVDSchema } from './schemas/DVD.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Product.name, 
        schema: ProductSchema,
        discriminators: [
          { name: DVD.name, schema: DVDSchema }
        ]
      }
    ])  ],
  providers: [],
  exports: [MongooseModule]
})
export class DVDsModule {}
