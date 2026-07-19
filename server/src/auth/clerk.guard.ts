import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { createClerkClient } from '@clerk/backend';

type ClerkClient = ReturnType<typeof createClerkClient>;

interface ClerkConfig {
  secretKey?: string;
  publishableKey?: string;
  jwtKey?: string;
}

function getClerkConfig(): ClerkConfig {
  return {
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey:
      process.env.CLERK_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    jwtKey: process.env.CLERK_JWT_KEY,
  };
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly clerkClient: ClerkClient;

  constructor() {
    const clerkConfig = getClerkConfig();
    this.clerkClient = createClerkClient({
      secretKey: clerkConfig.secretKey,
      publishableKey: clerkConfig.publishableKey,
    });
  }

  private getAuthOptions() {
    const { secretKey, publishableKey, jwtKey } = getClerkConfig();

    if (!secretKey || !publishableKey) {
      console.log(
        'Clerk authentication is not configured. Set CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY (or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).',
      );
      throw new UnauthorizedException(
        'Clerk authentication is not configured. Set CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY (or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).',
      );
    }

    return {
      secretKey,
      publishableKey,
      jwtKey,
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // define a request type that includes clerkAuth to avoid unsafe any access
    type ClerkAuth = Record<string, any> & {
      userId?: string;
      sessionId?: string;
    };

    interface ClerkRequest extends Request {
      clerkAuth?: ClerkAuth;
    }

    const req = context.switchToHttp().getRequest<ClerkRequest>();

    try {
      const authOptions = this.getAuthOptions();
      const forwardedProto = req.headers['x-forwarded-proto'];
      const protocol = Array.isArray(forwardedProto)
        ? forwardedProto[0]
        : forwardedProto || req.protocol || 'http';
      const host = req.get('host') || 'localhost';
      const url = `${protocol}://${host}${req.originalUrl || req.url || '/'}`;
      console.log('ClerkAuthGuard: Authenticating request to URL:', url);
      const clerkRequest = new Request(url, {
        method: req.method,
        headers: req.headers as HeadersInit,
      });

      const result = await this.clerkClient.authenticateRequest(clerkRequest, {
        ...authOptions,

        // authorizedParties: process.env.AUTHORIZED_PARTIES
        //   ? process.env.AUTHORIZED_PARTIES.split(',')
        //   : undefined,
      });
      if (!result || !result.isAuthenticated) {
        throw new UnauthorizedException('Not authenticated');
      }

      // attach helpful auth info to request for controllers
      const auth = result.toAuth();
      console.log('ClerkAuthGuard: Authenticated request with auth:', auth);
      req.clerkAuth = {
        ...auth,
        userId: auth.userId,
        sessionId: auth.sessionId,
      } as ClerkAuth;

      return true;
    } catch (error) {
      console.log('ClerkAuthGuard: Authentication failed with error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      console.error('Clerk auth error:', error);
      throw new UnauthorizedException('Invalid Clerk token');
    }
  }
}
