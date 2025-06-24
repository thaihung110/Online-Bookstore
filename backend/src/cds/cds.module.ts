import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CD, CDSchema } from './schemas/cd.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Product.name, 
        schema: ProductSchema,
        discriminators: [
          { name: CD.name, schema: CDSchema }
        ]
      }
    ])  ],
  providers: [],
  exports: [MongooseModule]
})
export class CDsModule {}
