/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Shop } from '../admin/shop.entity';

import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { Product } from '../admin/product.entity';
import { PaginatedResult } from '../common/pagination';
import { UpdateShopDto } from './shop.dto';

import { UploadFileService } from '../uploadFile.service';

import type { File as MulterFile } from 'multer';
import { ShopAuthorizationService } from './shopAuthorization.service';
import { User } from '../users/user.entity';
@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Shop) private readonly shopRepository: Repository<Shop>,
    private readonly productsService: ProductsService,
    private readonly fileUploadService: UploadFileService,
    private readonly shopAuthorizationService: ShopAuthorizationService,
  ) {}

  async getAllShops(
    page?: number | string,
    search?: string,
    categoryId?: string,
    sortBy?: 'newest' | 'oldest',
  ): Promise<{
    data: Shop[];
    page: number;
    total: number;
    totalPages: number;
  }> {
    const limit = 15;
    const pageNumber = Number(page) || 1;
    const skip = Math.max(0, pageNumber - 1) * limit;

    const queryBuilder = this.shopRepository
      .createQueryBuilder('shop')
      .leftJoinAndSelect('shop.user', 'user')
      .leftJoinAndSelect('shop.category', 'category');

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere(
        '(shop.name ILIKE :search OR shop.address ILIKE :search OR shop.description ILIKE :search OR category.name ILIKE :search)',
        { search: searchTerm },
      );
    }

    if (categoryId && categoryId.trim()) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId });
    }

    if (sortBy === 'oldest') {
      queryBuilder.orderBy('shop.createdAt', 'ASC');
    } else {
      queryBuilder.orderBy('shop.createdAt', 'DESC');
    }

    const [shops, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return { data: shops, page: pageNumber, total, totalPages };
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

  async updateShop(
    payload: Partial<UpdateShopDto>,
    file: MulterFile,
    user: User,
  ) {
    if (payload?.id) {
      await this.shopAuthorizationService.assertShopOwner(user.id, payload?.id);
    }
    const updatedPayload: any = {};
    Object.keys(payload).map((key: string) => {
      if (payload[key]) {
        updatedPayload[key] = payload[key];
      }
    });
    if (file) {
      const fileUrl = await this.fileUploadService.uploadToExternalApi(file);
      if (fileUrl?.length) {
        updatedPayload['imageUrl'] = fileUrl[0];
      }
    }

    delete updatedPayload.id;
    if (Object.keys(updatedPayload)?.length) {
      console.log('updatedPayload', updatedPayload);
      return this.shopRepository.update(
        { id: payload.id },
        { ...updatedPayload },
      );
    }

    return new HttpException('No data found to Update.', HttpStatus.OK);
  }

  async deleteShop(shopId: string, user: User) {
    const shop = await this.shopRepository.findOne({
      where: {
        id: shopId,
      },
    });

    if (!shop) {
      return new NotFoundException('Shop Notfound');
    }
    await this.shopAuthorizationService.assertShopOwner(user.id, shop.id);

    return this.shopRepository.delete({
      id: shop.id,
    });
  }
}
