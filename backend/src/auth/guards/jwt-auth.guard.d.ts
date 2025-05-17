import { AuthGuard } from '@nestjs/passport';

export declare class JwtAuthGuard extends AuthGuard('jwt') {}
