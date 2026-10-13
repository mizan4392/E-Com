import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { ListAdminProductsQueryDto } from '../products/dto/list-products.dto';
import { PauseProductDto } from '../products/dto/pause-product.dto';
import { ProductStatus } from '../products/product.entity';

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
  async products(@Query() query: ListAdminProductsQueryDto) {
    return this.adminService.listProducts(query);
  }

  @UseGuards(AdminGuard)
  @Get('products/status-counts')
  async productStatusCounts(@Query() query: ListAdminProductsQueryDto) {
    return this.adminService.productStatusCounts({
      shopId: query.shopId,
      categoryId: query.categoryId,
      search: query.search,
    });
  }

  @UseGuards(AdminGuard)
  @Get('products/shops')
  async productShops() {
    return this.adminService.listProductShops();
  }

  @UseGuards(AdminGuard)
  @Get('products/categories')
  async productCategories() {
    return this.adminService.listProductCategories();
  }

  @UseGuards(AdminGuard)
  @Patch('products/:id/pause')
  async pauseProduct(@Param('id') id: string, @Body() body: PauseProductDto) {
    return this.adminService.pauseProduct(id, body.pauseNote);
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
