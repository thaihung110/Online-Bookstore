import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Returns all users', type: [User] })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns a user by ID', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.usersService.delete(id);
  }

  @Post(':userId/wishlist/:bookId')
  @ApiOperation({ summary: 'Add a book to user wishlist' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'bookId', description: 'Book ID' })
  @ApiResponse({
    status: 200,
    description: 'Book added to wishlist',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'User or book not found' })
  async addToWishlist(
    @Param('userId') userId: string,
    @Param('bookId') bookId: string,
  ): Promise<User> {
    return this.usersService.addToWishlist(userId, bookId);
  }

  @Delete(':userId/wishlist/:bookId')
  @ApiOperation({ summary: 'Remove a book from user wishlist' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'bookId', description: 'Book ID' })
  @ApiResponse({
    status: 200,
    description: 'Book removed from wishlist',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'User or book not found' })
  async removeFromWishlist(
    @Param('userId') userId: string,
    @Param('bookId') bookId: string,
  ): Promise<User> {
    return this.usersService.removeFromWishlist(userId, bookId);
  }
}
