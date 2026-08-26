import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '../admin/product.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { InjectRepository } from '@nestjs/typeorm';
import { getPaginationParams, PaginatedResult } from '../common/pagination';
import { User } from '../users/user.entity';
import { ShopAuthorizationService } from '../shop/shopAuthorization.service';
import { UploadFileService } from '../uploadFile.service';
import { UpdateProductDto } from './dto/update-product.dto';
import type { Multer } from 'multer';
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly shopAuth: ShopAuthorizationService,
    private readonly fileUploadService: UploadFileService,
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

  async getProductDetails(productId: string) {
    return this.productRepository.findOne({
      where: {
        id: productId,
      },
      relations: {
        shop: {
          category: true,
        },
      },
    });
  }

  async update(
    id: string,
    updateData: UpdateProductDto,
    files: Multer[],
    user: User,
  ): Promise<Product> {
    const updatePayload: Partial<Product> = {};
    const product = await this.productRepository.findOne({
      where: { id },
      relations: {
        shop: true,
      },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    if (product?.shop?.id) {
      await this.shopAuth.assertShopOwner(user?.id, product?.shop?.id);
    }

    if (updateData?.deleteImageUrls?.length) {
      updatePayload.imageUrl = (product?.imageUrl ?? []).filter(
        (imgUrl) => !updateData?.deleteImageUrls?.includes(imgUrl),
      );
    }
    if (files && files.length > 0) {
      // Handle file uploads - upload and collect URLs
      const newImageUrls: string[] = [];
      for (const file of files) {
        const fileUrls = await this.fileUploadService.uploadToExternalApi(file);
        if (fileUrls?.length) {
          newImageUrls.push(...(fileUrls ?? []));
        }
      }
      updatePayload.imageUrl = [...(product?.imageUrl ?? []), ...newImageUrls];
    }

    // Update product with provided fields
    Object.assign(product, updatePayload);

    return this.productRepository.save(product);
  }
}
