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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Shop)
    private readonly shopsRepo: Repository<Shop>,
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
    return this.shopsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async createShopForUser(
    userId: string,
    payload: Partial<Shop> & { categoryId?: string },
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

    const shop = this.shopsRepo.create({
      ...payload,
      userId,
      categoryId: payload.categoryId,
    });

    return this.shopsRepo.save(shop);
  }
}
