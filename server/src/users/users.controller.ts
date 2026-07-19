import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { AuthGuard } from '../auth/AuthGuard';
import type { AuthRequest } from '../auth/AuthGuard';

interface ClerkAuth {
  userId?: string;
  sub?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  [key: string]: any;
}

interface ClerkRequest extends Request {
  clerkAuth?: ClerkAuth;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Protected route, requires a valid Clerk token passed by the client (Authorization: Bearer <token>)
  @UseGuards(ClerkAuthGuard)
  @Get('me')
  async me(@Req() req: ClerkRequest) {
    // clerk auth guard will attach `clerkAuth` to the request
    const clerkAuth = req.clerkAuth;
    console.log('Authenticated user with clerkAuth: `me route`', clerkAuth);
    if (!clerkAuth || !clerkAuth.userId) return null;

    return this.usersService.findByClerkId(clerkAuth.userId);
  }

  @UseGuards(AuthGuard)
  @Post('sync')
  sync(@Req() req: AuthRequest, @Body() body: { userId: string }) {
    const user = req.user;
    console.log('Syncing user with user:', user);
    console.log('Syncing user with body:', body);
    if (!user) return null;

    // user may contain the token payload with `sub` or `userId` depending on verification
    // const userId = clerkAuth.userId || clerkAuth.sub;
    // if (!userId) return null;

    // const payload = {
    //   firstName: clerkAuth.firstName ?? undefined,
    //   lastName: clerkAuth.lastName ?? undefined,
    //   email: clerkAuth.email ?? undefined,
    //   raw: clerkAuth,
    // };
    // console.log('Syncing user with payload:', payload);
    // return this.usersService.createOrUpdateFromClerk(userId, payload);
  }
}
