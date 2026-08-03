import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { Category } from '../admin/category.entity';
import { Shop } from '../admin/shop.entity';
import { User } from './user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let categoriesRepo: { findOne: jest.Mock; find: jest.Mock };
  let shopsRepo: { find: jest.Mock; create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    categoriesRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    shopsRepo = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: categoriesRepo,
        },
        {
          provide: getRepositoryToken(Shop),
          useValue: shopsRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('creates a shop linked to the current user and category', async () => {
    categoriesRepo.findOne.mockResolvedValue({ id: 'category-1' });
    shopsRepo.save.mockResolvedValue({ id: 'shop-1' });

    const result = await service.createShopForUser('user-1', {
      name: 'My Shop',
      description: 'Nice place',
      address: '123 Main St',
      imageUrl: 'https://example.com/banner.png',
      categoryId: 'category-1',
    });

    expect(categoriesRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'category-1' },
    });
    expect(shopsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        categoryId: 'category-1',
      }),
    );
    expect(result).toEqual(expect.objectContaining({ id: 'shop-1' }));
  });
});
