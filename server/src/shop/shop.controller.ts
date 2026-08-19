import { Controller, Get, Param, Query } from '@nestjs/common';
import { ShopService } from './shop.service';
import { Shop } from '../admin/shop.entity';
import { Product } from '../admin/product.entity';
import { PaginatedResult } from '../common/pagination';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  async getAllShops(
    @Query('page') page?: number,
  ): Promise<{ data: Shop[]; page: number }> {
    return this.shopService.getAllShops(page);
  }

  @Get(':id')
  async getShopById(@Param('id') id: string): Promise<Shop | null> {
    return this.shopService.getShopById(id);
  }

  @Get(':id/products')
  async getShopProducts(
    @Param('id') id: string,
    @Query('page') page?: string,
  ): Promise<PaginatedResult<Product>> {
    return this.shopService.getShopProducts(id, Number(page) || 1);
  }
}
