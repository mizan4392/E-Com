import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import type { Multer } from 'multer';
import { UsersService } from './users.service';

import { AuthGuard, CurrentUser } from '../auth/AuthGuard';
import type { AuthRequest } from '../auth/AuthGuard';
import { User } from './user.entity';
import { Shop } from '../admin/shop.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
  @Patch('me')
  updateProfile(@Body() body: UpdateProfileDto, @CurrentUser() user: User) {
    return this.usersService.updateProfile(user.id, body);
  }

  @UseGuards(AuthGuard)
  @Get('categories')
  categories() {
    return this.usersService.listCategories();
  }

  @UseGuards(AuthGuard)
  @Get('me/shops')
  async myShops(@Req() req: AuthRequest, @CurrentUser() user: User) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.usersService.listShopsForUser(user.id);
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post('me/shops')
  createMyShop(
    @Body() body: Partial<Shop> & { categoryId?: string },
    @UploadedFile() file: Multer.File,
    @CurrentUser() user: User,
  ) {
    // const userId = req.user?.userId;
    // if (!userId) {
    //   throw new UnauthorizedException('Unauthorized');
    // }
    return this.usersService.createShopForUser(user.id, body, file);
  }

  @UseGuards(AuthGuard)
  @Post('sync')
  sync(@Req() req: AuthRequest, @Body() body: Partial<User>) {
    if (!req.user || !req.user.userId) {
      console.error('Sync failed: No user found in request');
      return null;
    }

    const userPayload: Partial<User> = {
      firstName: body?.firstName || req.user.firstName,
      lastName: body?.lastName || req.user.lastName,
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
