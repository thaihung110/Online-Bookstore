import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUserByEmail = await this.findByEmail(createUserDto.email);
    if (existingUserByEmail) {
      throw new BadRequestException('Email already in use');
    }

    // Check if user with username already exists
    const existingUserByUsername = await this.findByUsername(
      createUserDto.username,
    );
    if (existingUserByUsername) {
      throw new BadRequestException('Username already taken');
    }

    const newUser = new this.userModel(createUserDto);
    const savedUser = await newUser.save();
    const user = savedUser.toObject() as any;
    user.password = undefined;
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Check if the user exists
    await this.findById(id);

    // If email is being updated, check it's not in use
    if (updateUserDto.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('Email already in use');
      }
    }

    // If username is being updated, check it's not in use
    if (updateUserDto.username) {
      const existingUser = await this.findByUsername(updateUserDto.username);
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
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }



  async addLoyaltyPoints(userId: string, points: number): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.loyaltyPoints += points;
    await user.save();

    return this.findById(userId);
  }

  async useLoyaltyPoints(userId: string, points: number): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.loyaltyPoints < points) {
      throw new BadRequestException('Not enough loyalty points');
    }

    user.loyaltyPoints -= points;
    await user.save();

    return this.findById(userId);
  }
}
