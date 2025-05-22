import { Module } from '@nestjs/common';
import { AdminUsersModule } from './users';
import { AdminBooksModule } from './books';
import { AdminOrdersModule } from './orders';

@Module({
  imports: [AdminUsersModule, AdminBooksModule, AdminOrdersModule],
})
export class AdminModule {}
