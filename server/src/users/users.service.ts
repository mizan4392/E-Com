import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../admin/category.entity';
import { Shop } from '../admin/shop.entity';
import { User } from './user.entity';
import type { Multer } from 'multer';
import { UploadFileService } from '../uploadFile.service';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Shop)
    private readonly shopsRepo: Repository<Shop>,
    private uploadFileService: UploadFileService,
  ) {}

  async findByClerkUserId(userId: string) {
    return this.usersRepo.findOne({ where: { userId: userId } });
  }

  async findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email: email } });
  }

  async createOrUpdateFromClerk(userId: string, payload: Partial<User>) {
    let user = await this.findByClerkUserId(userId);
    if (!user) {
      user = this.usersRepo.create({ userId, ...payload });
    } else {
      Object.assign(user, payload);
    }
    return this.usersRepo.save(user);
  }

  async listCategories() {
    return this.categoriesRepo.find({ order: { createdAt: 'DESC' } });
  }

  async listShopsForUser(userId: string) {
    const shops = await this.shopsRepo.find({
      where: {
        user: { id: userId },
      },
      relations: {
        user: true,
        category: true,
      },
    });

    return shops;
  }

  async createShopForUser(
    userId: string,
    payload: Partial<Shop> & { categoryId?: string },
    file: Multer.File,
  ) {
    if (!payload.name) {
      throw new BadRequestException('Shop name is required');
    }

    if (!payload.categoryId) {
      throw new BadRequestException('Category is required');
    }

    const category = await this.categoriesRepo.findOne({
      where: { id: payload.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const uploadFile: string[] =
      await this.uploadFileService.uploadToExternalApi(file);
    console.log('uploadFile', uploadFile);
    if (!uploadFile?.length) {
      throw new BadRequestException('Failed to upload shop image');
    }
    const shop = await this.shopsRepo.save({
      ...payload,
      imageUrl: uploadFile[0],
      user: { id: userId },
      category: { id: payload.categoryId },
    });

    return this.shopsRepo.findOne({
      where: { id: shop.id },
      relations: { user: true, category: true },
    });
  }
}
