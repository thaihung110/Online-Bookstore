import { AdminUsersService } from './admin-users.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UpdateUserDto } from '../../users/dto/update-user.dto';
import { User } from '../../users/schemas/user.schema';

export declare class AdminUsersController {
  private readonly adminUsersService;
  constructor(adminUsersService: AdminUsersService);
  findAll(
    page: number,
    limit: number,
    search?: string,
    role?: string,
    isActive?: boolean,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Promise<any>;
  findById(id: string): Promise<User>;
  create(createUserDto: CreateUserDto): Promise<User>;
  update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}
