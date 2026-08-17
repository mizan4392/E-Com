import { config } from 'dotenv';
config();

import bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../admin/category.entity';
import { Shop } from '../admin/shop.entity';
import { Product } from '../admin/product.entity';
import { users, categories, shops, products } from './seed.data';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT || 5432),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'ecom',
  entities: [User, Category, Shop, Product],
  synchronize: true,
  logging: false,
});

async function main() {
  try {
    await AppDataSource.initialize();

    const userRepo = AppDataSource.getRepository(User);
    const categoryRepo = AppDataSource.getRepository(Category);
    const shopRepo = AppDataSource.getRepository(Shop);
    const productRepo = AppDataSource.getRepository(Product);

    const shouldClear =
      process.argv.includes('--clear') || process.env.SEED_CLEAR === 'true';

    if (shouldClear) {
      console.log(
        '⚠️ Clearing seed tables because --clear / SEED_CLEAR=true was provided',
      );
      await AppDataSource.query(`
        TRUNCATE TABLE "products", "shops", "categories", "users"
        RESTART IDENTITY CASCADE;
      `);
    } else {
      console.log(
        'ℹ️ Safe seed mode: preserving current local tables and updating matching seed records.',
      );
    }

    const createdUsers: User[] = [];

    for (const seedUser of users) {
      const existing = await userRepo.findOne({
        where: [{ email: seedUser.email }, { userId: seedUser.userId }],
      });

      const password = seedUser.password || '12345';
      const hashedPassword = await bcrypt.hash(password, 10);

      if (existing) {
        Object.assign(existing, {
          userId: seedUser.userId,
          firstName: seedUser.firstName,
          lastName: seedUser.lastName,
          email: seedUser.email,
          password: hashedPassword,
          imageUrl: seedUser.imageUrl,
          raw: {
            ...existing.raw,
            userType: 'user',
          },
        });
        const saved = await userRepo.save(existing);
        createdUsers.push(saved);
      } else {
        const user = userRepo.create({
          userId: seedUser.userId,
          firstName: seedUser.firstName,
          lastName: seedUser.lastName,
          email: seedUser.email,
          password: hashedPassword,
          imageUrl: seedUser.imageUrl,
          raw: {
            userType: 'user',
          },
        });

        const saved = await userRepo.save(user);
        createdUsers.push(saved);
      }
    }

    const createdCategories: Category[] = [];

    for (const categorySeed of categories) {
      const existingCategory = await categoryRepo.findOne({
        where: [
          { name: categorySeed.name },
          { slug: categorySeed.name.toLowerCase() },
        ],
      });

      if (existingCategory) {
        Object.assign(existingCategory, {
          name: categorySeed.name,
          slug: categorySeed.name.toLowerCase().replace(/\s+/g, '-'),
          description: categorySeed.description,
          imageUrl: categorySeed.image,
        });
        const saved = await categoryRepo.save(existingCategory);
        createdCategories.push(saved);
      } else {
        const category = categoryRepo.create({
          name: categorySeed.name,
          slug: categorySeed.name.toLowerCase().replace(/\s+/g, '-'),
          description: categorySeed.description,
          imageUrl: categorySeed.image,
        });

        const saved = await categoryRepo.save(category);
        createdCategories.push(saved);
      }
    }

    const catMap = new Map(
      createdCategories.map((category) => [category.name, category]),
    );

    const createdShops: Shop[] = [];

    for (const shopSeed of shops) {
      const category = catMap.get(shopSeed.category);
      const owner = createdUsers.find((user) => user.raw?.userType === 'user');

      const existingShop = await shopRepo.findOne({
        where: { name: shopSeed.name },
      });

      if (existingShop) {
        Object.assign(existingShop, {
          name: shopSeed.name,
          slug: shopSeed.name.toLowerCase().replace(/\s+/g, '-'),
          description: shopSeed.description ?? shopSeed.name,
          address: shopSeed.location,
          imageUrl: shopSeed.image,
          user: { id: owner?.id ?? createdUsers[0]?.id ?? undefined },
          category: { id: category?.id ?? undefined },
        });
        const saved = await shopRepo.save(existingShop);
        createdShops.push(saved);
      } else {
        const shop = shopRepo.create({
          name: shopSeed.name,
          slug: shopSeed.name.toLowerCase().replace(/\s+/g, '-'),
          description: shopSeed.description ?? shopSeed.name,
          address: shopSeed.location,
          imageUrl: shopSeed.image,
          user: { id: owner?.id ?? createdUsers[0]?.id ?? undefined },
          category: { id: category?.id ?? undefined },
        });

        const saved = await shopRepo.save(shop);
        createdShops.push(saved);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const shopMap = new Map(createdShops.map((shop) => [shop.name, shop]));

    for (const productSeed of products) {
      const matchingShop =
        createdShops[products.indexOf(productSeed) % createdShops.length];

      const existingProduct = await productRepo.findOne({
        where: { name: productSeed.name },
      });

      if (existingProduct) {
        Object.assign(existingProduct, {
          name: productSeed.name,
          slug: productSeed.slug,
          description: productSeed.description,
          category: productSeed.category,
          price: productSeed.price,
          stock: productSeed.stock,
          imageUrl: productSeed.imageUrl,
          shop: matchingShop ?? undefined,
        });

        await productRepo.save(existingProduct);
      } else {
        const product = productRepo.create({
          name: productSeed.name,
          slug: productSeed.slug,
          description: productSeed.description,
          category: productSeed.category,
          price: productSeed.price,
          stock: productSeed.stock,
          imageUrl: productSeed.imageUrl,
          shop: matchingShop ?? undefined,
        });

        await productRepo.save(product);
      }
    }

    console.log('✅ Seed completed successfully');
    console.log(
      `Created ${createdUsers.length} users, ${createdCategories.length} categories, ${createdShops.length} shops, and ${products.length} products.`,
    );
  } catch (error) {
    console.error('❌ Seed failed');
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main();
