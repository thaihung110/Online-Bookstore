import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UpdateUserDto } from '../../users/dto/update-user.dto';
import { UserFilters, UserListResponse } from './types';

export declare class AdminUsersService {
  private readonly userModel: Model<UserDocument>;
  constructor(userModel: Model<UserDocument>);

  findAll(filters: UserFilters): Promise<UserListResponse>;
  findById(id: string): Promise<User>;
  create(createUserDto: CreateUserDto): Promise<User>;
  update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}
