import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Product } from '../admin/product.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { InjectRepository } from '@nestjs/typeorm';
import { getPaginationParams, PaginatedResult } from '../common/pagination';
import { User } from '../users/user.entity';
import { ShopAuthorizationService } from '../shop/shopAuthorization.service';
import { UploadFileService } from '../uploadFile.service';
import { CreateProductDto, UpdateProductDto } from './dto/update-product.dto';
import type { Multer } from 'multer';
import { getChangedValues } from '../../util/function';
import { ShopService } from '../shop/shop.service';
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly shopAuth: ShopAuthorizationService,
    @Inject(forwardRef(() => ShopService))
    private readonly shopService: ShopService,
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
  ) {
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
    //deleting image operation
    if (updateData?.deleteImageUrls?.length) {
      if (Array.isArray(updateData?.deleteImageUrls)) {
        updatePayload.imageUrl = (product?.imageUrl ?? []).filter(
          (imgUrl) => !updateData?.deleteImageUrls?.includes(imgUrl),
        );
      } else {
        updatePayload.imageUrl = (product?.imageUrl ?? []).filter(
          (img) => img !== updateData?.deleteImageUrls,
        );
      }
    }

    //fileUpload operation
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
    console.log('updatePayload', updatePayload);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { categoryId, deleteImageUrls, ...rest } = updateData;
    const payload: Partial<Product> = getChangedValues(product, {
      ...rest,
      ...updatePayload,
    });

    if (categoryId) {
      payload.category = { id: categoryId };
    }
    return this.productRepository.update(id, { ...payload });
  }

  async deleteProduct(productId: string, user: User) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: {
        shop: true,
      },
    });

    if (!product) {
      return new NotFoundException('Product not found');
    }
    if (product?.shop?.id) {
      await this.shopAuth.assertShopOwner(user?.id, product?.shop?.id);
    }

    return this.productRepository.delete({ id: product?.id });
  }

  async addProductToShop(
    shopId: string,
    payload: CreateProductDto,
    files: Multer[],
    user: User,
  ) {
    const shop = await this.shopService.getShopById(shopId);

    if (!shop) {
      return new NotFoundException('Shop NotFound');
    }
    await this.shopAuth.assertShopOwner(user?.id, shop.id);

    //fileUpload operation
    const newImageUrls: string[] = [];

    if (files && files.length > 0) {
      // Handle file uploads - upload and collect URLs
      for (const file of files) {
        const fileUrls = await this.fileUploadService.uploadToExternalApi(file);
        if (fileUrls?.length) {
          newImageUrls.push(...(fileUrls ?? []));
        }
      }
    }

    const { category, ...payloadRest } = payload;
    return this.productRepository.save({
      ...payloadRest,
      imageUrl: newImageUrls,
      category: { id: category },
      shop: {
        id: shop.id,
      },
    });
  }
}
