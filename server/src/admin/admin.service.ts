import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { FindOptionsWhere, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../category/category.entity';
import { Product, ProductStatus } from '../products/product.entity';
import { Shop } from '../shop/shop.entity';
import {
  normalizePagination,
  type PaginatedResponse,
} from '../common/pagination-query.dto';
import type { ListAdminProductsQueryDto } from '../products/dto/list-products.dto';

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

  /**
   * Paginated, filterable product list for the admin panel.
   *
   * Mirrors the admin orders list: shop/category filters are equality matches on
   * indexed FK columns, `search` is a case-insensitive prefix match on the
   * product name, and `sortBy`/`sortOrder` are whitelisted enums. A blank
   * `sortBy` defaults to `createdAt DESC` (newest first), which is what the
   * admin list page renders by default.
   */
  async listProducts(
    query: ListAdminProductsQueryDto = {},
  ): Promise<PaginatedResponse<Product>> {
    const { page, limit, skip } = normalizePagination(query);

    const where: FindOptionsWhere<Product> = {};
    if (query.status) where.status = query.status;
    if (query.shopId) where.shopId = query.shopId;
    if (query.categoryId) where.category = { id: query.categoryId };

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const [data, total] = await this.productsRepo.findAndCount({
      where,
      relations: { shop: true, category: true },
      order: { [sortBy]: sortOrder },
      take: limit,
      skip,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Per-status tally of products, scoped by the same shop/category/search
   * filters the list uses (but not by status itself — a count broken down by
   * the status you already filtered to is either that one number or zero).
   */
  async productStatusCounts(
    query: {
      shopId?: string;
      categoryId?: string;
      search?: string;
    } = {},
  ): Promise<{ ALL: number; ACTIVE: number; PAUSED: number }> {
    const qb = this.productsRepo.createQueryBuilder('product');

    const base = qb.select('COUNT(*)', 'count').where('1=1');

    if (query.shopId) {
      base.andWhere('product."shopId" = :shopId', { shopId: query.shopId });
    }
    if (query.categoryId) {
      base.andWhere('product."categoryId" = :categoryId', {
        categoryId: query.categoryId,
      });
    }
    if (query.search) {
      base.andWhere(
        '(product."name" ILIKE :search OR product."description" ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const all = Number((await base.getRawOne<{ count: string }>())?.count ?? 0);
    const active = Number(
      (
        await base
          .andWhere('product."status" = :status', {
            status: ProductStatus.ACTIVE,
          })
          .getRawOne<{ count: string }>()
      )?.count ?? 0,
    );
    const paused = Number(
      (
        await base
          .andWhere('product."status" = :status', {
            status: ProductStatus.PAUSED,
          })
          .getRawOne<{ count: string }>()
      )?.count ?? 0,
    );

    return { ALL: all, ACTIVE: active, PAUSED: paused };
  }

  /** Shops for the filter dropdown. */
  async listProductShops() {
    return this.shopsRepo.find({
      order: { name: 'ASC' },
      select: { id: true, name: true },
    });
  }

  /** Categories for the filter dropdown. */
  async listProductCategories() {
    return this.categoriesRepo.find({
      order: { name: 'ASC' },
      select: { id: true, name: true },
    });
  }

  /**
   * Pauses (or unpauses) a product and records the admin's note.
   *
   * `status` is sent by the client as the target state; `pauseNote` is the
   * reason text. When unpausing the note is cleared, so a product that returns
   * to the catalogue does not carry stale "out of stock" copy.
   */
  async pauseProduct(id: string, pauseNote: string) {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.status = ProductStatus.PAUSED;
    product.pauseNote = pauseNote;

    await this.productsRepo.save(product);
    return this.productsRepo.findOne({
      where: { id },
      relations: { shop: true, category: true },
    });
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
