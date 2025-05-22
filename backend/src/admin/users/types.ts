import { User } from '../../users/schemas/user.schema';
import { FilterQuery, SortOrder } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class UserListResponse {
  @ApiProperty({ type: [User] })
  users: User[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export interface UserFilters extends Omit<UserQueryParams, 'page' | 'limit'> {
  page: number;
  limit: number;
}

export interface UserSortOptions {
  [key: string]: SortOrder;
}

export interface UserFilterQuery extends FilterQuery<User> {
  $or?: Array<{
    username?: { $regex: string; $options: string };
    email?: { $regex: string; $options: string };
  }>;
  role?: string;
  isEmailVerified?: boolean;
}
