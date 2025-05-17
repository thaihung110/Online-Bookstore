import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'The username of the user' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ description: 'The email of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'The password of the user' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'The role of the user',
    enum: ['user', 'admin'],
    default: 'user',
  })
  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: string;
}
