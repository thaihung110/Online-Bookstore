import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(user: any) {
    // MongoDB returns _id which we need to safely access
    const userId = user._id ? user._id.toString() : '';

    const payload = {
      email: user.email,
      sub: userId,
      role: user.role,
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: userId,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    const newUser = (await this.usersService.create(createUserDto)) as any;

    // MongoDB returns _id which we need to safely access
    const userId = newUser._id ? newUser._id.toString() : '';

    const payload = {
      email: newUser.email,
      sub: userId,
      role: newUser.role,
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: userId,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
      },
    };
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getUserFromToken(token: string): Promise<User> {
    const decoded = await this.verifyToken(token);
    return this.usersService.findById(decoded.sub);
  }
}
