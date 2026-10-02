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

  async updateProfile(
    userId: string,
    profile: Pick<User, 'address' | 'phone'>,
  ) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.address = profile.address?.trim();
    user.phone = profile.phone?.trim();
    return this.usersRepo.save(user);
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
      // Explicit order. Without it Postgres returns rows in whatever order the
      // plan happens to produce, which is not stable between calls.
      //
      // This matters because the seller dashboard auto-selects `shops[0]` on
      // load. With no ORDER BY that first shop was effectively random, so a
      // seller with a mix of selling and never-sold shops would often land on
      // a zero-sales shop and conclude the dashboard was broken. Newest first
      // is also the useful default: a seller's most recent shop is the one they
      // almost always want to look at.
      order: { createdAt: 'DESC' },
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
