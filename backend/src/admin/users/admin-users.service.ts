import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UpdateUserDto } from '../../users/dto/update-user.dto';
import {
  UserFilters,
  UserListResponse,
  UserFilterQuery,
  UserSortOptions,
} from './types';
import {
  IAdminUsersService,
  AdminUsersServiceModel,
} from './admin-users.service.types';

@Injectable()
export class AdminUsersService implements IAdminUsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: AdminUsersServiceModel,
  ) {}

  async findAll(filters: UserFilters): Promise<UserListResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const query: UserFilterQuery = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role !== undefined) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isEmailVerified = isActive;
    }

    const total = await this.userModel.countDocuments(query);
    const sort: UserSortOptions = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const users = await this.userModel
      .find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password')
      .exec();

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUserByEmail = await this.userModel
      .findOne({ email: createUserDto.email })
      .exec();
    if (existingUserByEmail) {
      throw new BadRequestException('Email already in use');
    }

    const existingUserByUsername = await this.userModel
      .findOne({ username: createUserDto.username })
      .exec();
    if (existingUserByUsername) {
      throw new BadRequestException('Username already taken');
    }

    const newUser = new this.userModel(createUserDto);
    const savedUser = await newUser.save();
    const userObject = savedUser.toObject();
    delete (userObject as { password?: string }).password;
    return userObject as User;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findById(id);

    if (updateUserDto.email) {
      const existingUser = await this.userModel
        .findOne({ email: updateUserDto.email })
        .exec();
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('Email already in use');
      }
    }

    if (updateUserDto.username) {
      const existingUser = await this.userModel
        .findOne({ username: updateUserDto.username })
        .exec();
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('Username already taken');
      }
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.role === 'admin') {
      const adminCount = await this.userModel.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin user');
      }
    }

    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
