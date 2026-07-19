import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { User } from '../users/user.entity';

export type AuthRequest = Request & { user?: Partial<User> };

interface JwtPayload {
  email: string;
  name: string;
  imageUrl: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      console.log('AuthGuard: No token found in request headers');
      throw new UnauthorizedException('Unauthorized');
    }

    try {
      console.log('AuthGuard: Verifying JWT token:', token);
      console.log('AuthGuard: Verifying JWT token:', process.env.CLERK_JWT_KEY);
      const jwtService = this.jwtService as {
        verifyAsync(
          token: string,
          options: { publicKey?: string; algorithms: string[] },
        ): Promise<JwtPayload>;
      };
      const payload = await jwtService.verifyAsync(token, {
        publicKey: process.env.CLERK_JWT_KEY || '',
        algorithms: ['RS256'],
      });
      console.log('AuthGuard: JWT payload verified:', payload);
      // cast to Partial<User> to allow mapping JWT fields that may not exactly match User entity
      request['user'] = {
        email: payload.email,
        name: payload.name,
        imageUrl: payload.imageUrl,
      } as unknown as Partial<User>;
    } catch (e) {
      console.log('AuthGuard: JWT verification failed with error:', e);
      throw new UnauthorizedException('Unauthorized');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Partial<User> | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();

    return request.user;
  },
);
