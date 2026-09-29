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
import { User } from '../users/user.entity';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

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
