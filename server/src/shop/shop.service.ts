/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Shop } from '../admin/shop.entity';

import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { Product } from '../admin/product.entity';
import { PaginatedResult } from '../common/pagination';
import { UpdateShopDto } from './shop.dto';

import { UploadFileService } from '../uploadFile.service';

import type { File as MulterFile } from 'multer';
@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Shop) private readonly shopRepository: Repository<Shop>,
    private readonly productsService: ProductsService,
    private readonly fileUploadService: UploadFileService,
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

  async updateShop(payload: UpdateShopDto, file: MulterFile) {
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
}
