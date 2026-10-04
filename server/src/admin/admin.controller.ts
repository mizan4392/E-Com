import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.adminService.login(body);
  }

  @UseGuards(AdminGuard)
  @Post('change-password')
  async changePassword(
    @Body() body: { oldPassword: string; newPassword: string },
    @Req() req: Request,
  ) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing bearer token');
    }

    const token = authHeader.replace('Bearer ', '');

    // A bad token must be a 401, not an unhandled throw that Nest reports as a
    // 500. `AdminGuard` already verified it on the way in; this re-read only
    // needs the subject id.
    let payload: { sub?: string };
    try {
      payload = await this.jwtService.verifyAsync<{ sub?: string }>(token, {
        secret: process.env.JWT_SECRET || 'admin-secret',
      });
    } catch {
      throw new UnauthorizedException('Admin access required');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Admin access required');
    }

    return this.adminService.changePassword(
      payload.sub,
      body.oldPassword,
      body.newPassword,
    );
  }

  @UseGuards(AdminGuard)
  @Get('dashboard')
  async dashboard() {
    return this.adminService.getDashboardStats();
  }

  @UseGuards(AdminGuard)
  @Get('categories')
  async categories() {
    return this.adminService.listCategories();
  }

  @UseGuards(AdminGuard)
  @Post('categories')
  async createCategory(
    @Body() body: { name: string; slug?: string; description?: string },
  ) {
    return this.adminService.createCategory(body);
  }

  @UseGuards(AdminGuard)
  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; slug?: string; description?: string },
  ) {
    return this.adminService.updateCategory(id, body);
  }

  @UseGuards(AdminGuard)
  @Get('products')
  async products() {
    return this.adminService.listProducts();
  }

  @UseGuards(AdminGuard)
  @Post('products')
  async createProduct(
    @Body()
    body: {
      name: string;
      slug?: string;
      description?: string;
      category?: string;
      price?: number;
      stock?: number;
      imageUrl?: string[];
    },
  ) {
    return this.adminService.createProduct({
      ...body,
      category: {
        id: body.category,
      },
    });
  }

  @UseGuards(AdminGuard)
  @Put('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      slug?: string;
      description?: string;
      category?: string;
      price?: number;
      stock?: number;
      imageUrl?: string[];
    },
  ) {
    return this.adminService.updateProduct(id, {
      ...body,
      category: {
        id: body.category,
      },
    });
  }

  @UseGuards(AdminGuard)
  @Get('shops')
  async shops() {
    return this.adminService.listShops();
  }

  @UseGuards(AdminGuard)
  @Post('shops')
  async createShop(
    @Body()
    body: {
      name: string;
      slug?: string;
      description?: string;
      address?: string;
      imageUrl?: string;
    },
  ) {
    return this.adminService.createShop(body);
  }

  @UseGuards(AdminGuard)
  @Put('shops/:id')
  async updateShop(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      slug?: string;
      description?: string;
      address?: string;
      imageUrl?: string;
    },
  ) {
    return this.adminService.updateShop(id, body);
  }
}
