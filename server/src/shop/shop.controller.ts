import { Controller, Get, Query } from '@nestjs/common';
import { ShopService } from './shop.service';
import { Shop } from '../admin/shop.entity';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  async getAllShops(
    @Query('page') page?: number,
  ): Promise<{ data: Shop[]; page: number }> {
    return this.shopService.getAllShops(page);
  }
}
