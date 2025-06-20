import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UpdateUserDto } from '../../users/dto/update-user.dto';
import { UserFilters, UserListResponse } from './types';

export const ADMIN_USERS_SERVICE = 'ADMIN_USERS_SERVICE';

export interface IAdminUsersService {
  findAll(filters: UserFilters): Promise<UserListResponse>;
  findById(id: string): Promise<User>;
  create(createUserDto: CreateUserDto): Promise<User>;
  update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}

export type AdminUsersServiceModel = Model<UserDocument>;
