import { Injectable } from '@nestjs/common';
import { Product } from '../admin/product.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { InjectRepository } from '@nestjs/typeorm';
import { getPaginationParams, PaginatedResult } from '../common/pagination';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getProductsByShopId(
    shopId: string,
    pageNumber: string | number = 1,
  ): Promise<PaginatedResult<Product>> {
    const { limit, skip } = getPaginationParams(pageNumber, 10);

    const [data, total] = await this.productRepository.findAndCount({
      where: { shop: { id: shopId } },
      relations: { shop: true },
      take: limit,
      skip: skip,
    });

    return {
      data,
      total,
      currentPage: Number(pageNumber),
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
