import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { User, UserSchema } from '../../users/schemas/user.schema';
import { ADMIN_USERS_SERVICE } from './admin-users.service.types';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AdminUsersController],
  providers: [
    AdminUsersService,
    {
      provide: ADMIN_USERS_SERVICE,
      useClass: AdminUsersService,
    },
  ],
  exports: [AdminUsersService, ADMIN_USERS_SERVICE],
})
export class AdminUsersModule {}
