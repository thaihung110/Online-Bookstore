import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
    this.logger.log('LocalStrategy initialized');
  }

  async validate(email: string, password: string): Promise<any> {
    this.logger.debug(`Attempting to validate user with email: ${email}`);

    try {
      const user = await this.authService.validateUser(email, password);
      if (!user) {
        this.logger.debug(`Authentication failed for email: ${email}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      this.logger.debug(`User with email: ${email} authenticated successfully`);
      return user;
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`, error.stack);

      // If the error is already a NestJS exception, re-throw it
      if (error.status) {
        throw error;
      }

      // Otherwise, throw a generic auth error
      throw new InternalServerErrorException('Authentication process failed');
    }
  }
}
