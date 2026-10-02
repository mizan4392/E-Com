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
   * Every KPI the owner sees BEFORE choosing a shop: lifetime totals summed
   * across all of their shops, plus a per-shop breakdown used to label the
   * selector.
   *
   * Deliberately independent of `:id` — the portfolio header renders on a page
   * where no shop has been chosen yet, so it must not require one.
   */
  @Get('analytics/portfolio')
  @UseGuards(AuthGuard)
  getPortfolio(@CurrentUser() user: User) {
    return this.shopAnalyticsService.getPortfolioTotals(user.id);
  }

  /**
   * Seller dashboard CARD data for ONE shop the caller owns.
   *
   * The four KPI tiles and nothing else. Split from the chart data
   * (`/details`) so that selecting a shop paints numbers as soon as ONE flat
   * aggregate returns, instead of waiting on the two grouped scans
   * (`date_trunc` over every line in range) that the chart needs. The tiles
   * are the first thing a seller looks at and the last thing worth blocking on.
   *
   * Ownership is asserted inside the service, from the shop row it has to load
   * anyway, so there is exactly one authorisation path shared with `/details`
   * — see `ShopAnalyticsService.authorize`.
   *
   * `:id/analytics/cards` and `:id/analytics/details` are declared after
   * `@Get(':id')` safely: `:id` matches a single segment and cannot swallow a
   * two-segment path, so there is no literal-vs-parameter ordering hazard here.
   */
  @Get(':id/analytics/cards')
  @UseGuards(AuthGuard)
  getShopCards(
    @Param('id') id: string,
    @Query() query: ShopAnalyticsQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.shopAnalyticsService.getShopCards(user.id, id, query);
  }

  /**
   * Seller dashboard DETAIL data for ONE shop the caller owns: the chart
   * series and the best-seller table.
   *
   * Split from the cards so the two halves load in parallel and neither gates
   * the other. Same `AuthGuard`, same ownership check, same range
   * resolution — the split is about payload size, never about access.
   */
  @Get(':id/analytics/details')
  @UseGuards(AuthGuard)
  getShopDetails(
    @Param('id') id: string,
    @Query() query: ShopAnalyticsQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.shopAnalyticsService.getShopDetails(user.id, id, query);
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
