import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { Request } from 'express';
import { User } from '../users/user.entity';

export type AuthRequest = Request & { user?: Partial<User> };

@Injectable()
export class ClerkService {
  private clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
  });

  async getUser(clerkUserId: string) {
    return this.clerkClient.users.getUser(clerkUserId);
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private clerkService: ClerkService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Authorization header must use Bearer token',
      );
    }

    const token = authHeader.substring(7);
    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }

    try {
      const verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,

        // Recommended if you have CLERK_JWT_KEY configured
        jwtKey: process.env.CLERK_JWT_KEY,
      });
      const clerkUserId = verifiedToken.sub;
      const clerkUser = await this.clerkService.getUser(clerkUserId);

      if (!clerkUserId) {
        throw new UnauthorizedException('Clerk user ID not found');
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (request as any).user = {
        userId: clerkUserId,
        sessionId: verifiedToken.sid,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        email: clerkUser.emailAddresses[0]?.emailAddress,
      } as Partial<User>;

      return true;
    } catch (error) {
      console.error('Clerk authentication failed:', error);

      throw new UnauthorizedException('Invalid or expired Clerk token');
    }
  }
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Partial<User> | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();

    return request.user;
  },
);
