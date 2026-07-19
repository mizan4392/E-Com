import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';

import { AuthGuard } from '../auth/AuthGuard';
import type { AuthRequest } from '../auth/AuthGuard';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Protected route, requires a valid Clerk token passed by the client (Authorization: Bearer <token>)
  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Req() req: AuthRequest): Promise<User | null> {
    // clerk auth guard will attach `clerkAuth` to the request
    const userId = req.user?.userId;
    if (!userId) return null;

    return this.usersService.findByClerkUserId(userId);
  }

  @UseGuards(AuthGuard)
  @Post('sync')
  sync(@Req() req: AuthRequest, @Body() body: Partial<User>) {
    console.log('Syncing user with body:', body);
    if (!req.user || !req.user.userId) {
      console.error('Sync failed: No user found in request');
      return null;
    }

    const userPayload: Partial<User> = {
      firstName: body?.firstName,
      lastName: body?.lastName,
      email: body?.email,
      imageUrl: body?.imageUrl,
      raw: {
        userType: 'user',
      },
    };

    return this.usersService.createOrUpdateFromClerk(
      req.user.userId,
      userPayload,
    );
  }
}
