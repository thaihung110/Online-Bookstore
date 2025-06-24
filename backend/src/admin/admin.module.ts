import { Module } from '@nestjs/common';
import { AdminUsersModule } from './users';
import { AdminBooksModule } from './books';
import { AdminOrdersModule } from './orders';
import { ProductsModule } from './products/products.module';
import { CdsModule } from './cds/cds.module';
import { DvdsModule } from './dvds/dvds.module';

@Module({
  imports: [AdminUsersModule, AdminBooksModule, AdminOrdersModule, ProductsModule, CdsModule, DvdsModule],
})
export class AdminModule {}
