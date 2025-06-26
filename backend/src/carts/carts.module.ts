import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';
import { Cart, CartSchema } from './schemas/cart.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { UsersModule } from '../users';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    UsersModule,
  ],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
