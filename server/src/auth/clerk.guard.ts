import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers?.authorization as string | undefined;

    if (!process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY) {
      throw new UnauthorizedException('Clerk credentials are missing');
    }

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Unauthorized');
    }

    return true;
  }
}
