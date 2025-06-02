import {
  Injectable,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      this.logger.debug(`Attempting to validate user with email: ${email}`);
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        this.logger.debug(`User with email ${email} not found`);
        return null;
      }

      if (user.password !== password) {
        this.logger.debug(`Invalid password for user with email: ${email}`);
        return null;
      }

      this.logger.debug(`User with email: ${email} validated successfully`);
      return user;
    } catch (error) {
      this.logger.error(`Error validating user: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Error validating user credentials',
      );
    }
  }

  async login(user: any) {
    try {
      this.logger.debug(`Generating JWT token for user: ${user.email}`);

      // MongoDB returns _id which we need to safely access
      const userId = user._id ? user._id.toString() : '';

      if (!userId) {
        this.logger.error('User ID is missing or invalid');
        throw new InternalServerErrorException('Invalid user data');
      }

      const payload = {
        email: user.email,
        sub: userId,
        role: user.role,
      };

      const token = this.jwtService.sign(payload);

      if (!token) {
        this.logger.error('Failed to generate JWT token');
        throw new InternalServerErrorException('Token generation failed');
      }

      this.logger.debug(
        `JWT token generated successfully for user: ${user.email}`,
      );

      return {
        token,
        user: {
          id: userId,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(`Error during login: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Login process failed');
    }
  }

  async register(createUserDto: CreateUserDto) {
    try {
      this.logger.debug(
        `Registering new user with email: ${createUserDto.email}`,
      );

      const newUser = (await this.usersService.create(createUserDto)) as any;

      // MongoDB returns _id which we need to safely access
      const userId = newUser._id ? newUser._id.toString() : '';

      if (!userId) {
        this.logger.error('Failed to get ID for new user');
        throw new InternalServerErrorException('User registration incomplete');
      }

      const payload = {
        email: newUser.email,
        sub: userId,
        role: newUser.role,
      };

      const token = this.jwtService.sign(payload);

      if (!token) {
        this.logger.error('Failed to generate JWT token for new user');
        throw new InternalServerErrorException('Token generation failed');
      }

      this.logger.debug(`User registered successfully: ${createUserDto.email}`);

      return {
        token,
        user: {
          id: userId,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error during registration: ${error.message}`,
        error.stack,
      );
      // Re-throw the error if it's already a NestJS HttpException (like BadRequestException)
      if (error.status) {
        throw error;
      }
      throw new InternalServerErrorException('Registration process failed');
    }
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getUserFromToken(token: string): Promise<User> {
    try {
      const decoded = await this.verifyToken(token);
      return this.usersService.findById(decoded.sub);
    } catch (error) {
      this.logger.error(`Error getting user from token: ${error.message}`);
      throw error; // Re-throw so the original exception is preserved
    }
  }
}
