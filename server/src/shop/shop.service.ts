import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Shop } from '../admin/shop.entity';

import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { Product } from '../admin/product.entity';
import { PaginatedResult } from '../common/pagination';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Shop) private readonly shopRepository: Repository<Shop>,
    private readonly productsService: ProductsService,
  ) {}

  async getAllShops(
    page?: number | string,
  ): Promise<{ data: Shop[]; page: number }> {
    const limit = 15;
    const pageNumber = Number(page) || 1;
    const skip = Math.max(0, pageNumber - 1) * limit;

    const shops = await this.shopRepository.find({
      skip,
      take: limit,
      relations: { user: true, category: true },
    });
    return { data: shops, page: pageNumber };
  }

  getShopById(id: string): Promise<Shop | null> {
    return this.shopRepository.findOne({
      where: { id },
      relations: { user: true, category: true },
    });
  }

  getShopProducts(
    shopId: string,
    page?: number,
  ): Promise<PaginatedResult<Product>> {
    return this.productsService.getProductsByShopId(shopId, Number(page) || 1);
  }
}
