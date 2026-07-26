import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payload = await this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET || 'admin-secret',
    });
    return this.adminService.changePassword(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
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
      imageUrl?: string;
    },
  ) {
    return this.adminService.createProduct(body);
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
      imageUrl?: string;
    },
  ) {
    return this.adminService.updateProduct(id, body);
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
