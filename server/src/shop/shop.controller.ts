import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { Shop } from '../admin/shop.entity';
import { Product } from '../admin/product.entity';
import { PaginatedResult } from '../common/pagination';
import { AuthGuard, CurrentUser } from '../auth/AuthGuard';
import { FileInterceptor } from '@nestjs/platform-express';

import type { Multer } from 'multer';
import { UpdateShopDto } from './shop.dto';
import { ShopAnalyticsQueryDto } from './dto/shop-analytics-query.dto';
import { ShopAnalyticsService } from './shopAnalytics.service';
import { User } from '../users/user.entity';

@Controller('shop')
export class ShopController {
  constructor(
    private readonly shopService: ShopService,
    private readonly shopAnalyticsService: ShopAnalyticsService,
  ) {}

  @Get()
  async getAllShops(
    @Query('page') page?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sortBy') sortBy?: 'newest' | 'oldest',
  ): Promise<{
    data: Shop[];
    page: number;
    total: number;
    totalPages: number;
  }> {
    return this.shopService.getAllShops(page, search, categoryId, sortBy);
  }

  @Get(':id')
  async getShopById(@Param('id') id: string): Promise<Shop | null> {
    return this.shopService.getShopById(id);
  }

  /**
   * Seller dashboard metrics for ONE shop the caller owns.
   *
   * Ownership is asserted server-side before any aggregation runs. Without
   * that check any authenticated user could read any shop's revenue by
   * guessing its id.
   *
   * Deliberately scoped to one shop and one range: portfolio-wide figures live
   * on `/shop/analytics/portfolio` so that switching shops in the dashboard
   * does not re-fetch numbers that do not change when the shop changes.
   *
   * MUST be declared before the `:id` routes below — NestJS matches in
   * declaration order, and a literal segment has to win over the `:id`
   * parameter or `analytics` is parsed as a shop id.
   */
  @Get('analytics/portfolio')
  @UseGuards(AuthGuard)
  getPortfolio(@CurrentUser() user: User) {
    return this.shopAnalyticsService.getPortfolioTotals(user.id);
  }

  @Get(':id/analytics')
  @UseGuards(AuthGuard)
  async getShopAnalytics(
    @Param('id') id: string,
    @Query() query: ShopAnalyticsQueryDto,
    @CurrentUser() user: User,
  ) {
    await this.shopAnalyticsService.assertShopOwnership(user.id, id);

    return this.shopAnalyticsService.getShopAnalytics(user.id, id, query);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  deleteShop(@Param('id') shopId: string, @CurrentUser() user: User) {
    return this.shopService.deleteShop(shopId, user);
  }

  @Get(':id/products')
  async getShopProducts(
    @Param('id') id: string,
    @Query('page') page?: string,
  ): Promise<PaginatedResult<Product>> {
    return this.shopService.getShopProducts(id, Number(page) || 1);
  }

  @UseGuards(AuthGuard)
  @Patch()
  @UseInterceptors(FileInterceptor('file'))
  updateShop(
    @Body() body: UpdateShopDto,
    @UploadedFile() file: Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.shopService.updateShop(body, file, user);
  }
}
