import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from './category.entity';
import { Product } from './product.entity';
import { Shop } from './shop.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Shop)
    private readonly shopsRepo: Repository<Shop>,
    private readonly jwtService: JwtService,
  ) {}

  async login(payload: { email: string; password: string }) {
    console.log('Login payload:', payload);
    const user = await this.usersRepo.findOne({
      where: { email: payload.email },
    });
    console.log('Found user:', user);
    if (!user || user.raw?.userType !== 'admin') {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      payload.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const token = await this.jwtService.signAsync(
      {
        sub: user.id,
        role: 'admin',
      },
      {
        secret: process.env.JWT_SECRET || 'admin-secret',
        expiresIn: '8h',
      },
    );
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user || user.raw?.userType !== 'admin') {
      throw new UnauthorizedException('Only admins can change password');
    }

    if (!user.password) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      oldPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.usersRepo.save(user);
    return { success: true };
  }

  async getDashboardStats() {
    const [categories, products, shops, todaySales] = await Promise.all([
      this.categoriesRepo.count(),
      this.productsRepo.count(),
      this.shopsRepo.count(),
      // eslint-disable-next-line @typescript-eslint/await-thenable
      0,
    ]);

    return {
      totalSalesToday: todaySales,
      totalNewProducts: 0,
      totalNewShops: 0,
      totalShops: shops,
      totalProducts: products,
      totalCategories: categories,
    };
  }

  async listCategories() {
    const categories = await this.categoriesRepo.find({
      order: { createdAt: 'DESC' },
    });
    return categories;
  }

  async createCategory(payload: Partial<Category>) {
    const category = this.categoriesRepo.create(payload);
    return this.categoriesRepo.save(category);
  }

  async updateCategory(id: string, payload: Partial<Category>) {
    await this.categoriesRepo.update(id, payload);
    return this.categoriesRepo.findOne({ where: { id } });
  }

  async listProducts() {
    return this.productsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createProduct(payload: Partial<Product>) {
    const product = this.productsRepo.create(payload);
    return this.productsRepo.save(product);
  }

  async updateProduct(id: string, payload: Partial<Product>) {
    await this.productsRepo.update(id, payload);
    return this.productsRepo.findOne({ where: { id } });
  }

  async listShops() {
    return this.shopsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createShop(payload: Partial<Shop>) {
    const shop = this.shopsRepo.create(payload);
    return this.shopsRepo.save(shop);
  }

  async updateShop(id: string, payload: Partial<Shop>) {
    await this.shopsRepo.update(id, payload);
    return this.shopsRepo.findOne({ where: { id } });
  }
}
