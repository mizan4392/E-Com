import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Category } from './category.entity';
import { Product } from './product.entity';
import { Shop } from './shop.entity';

describe('AdminService', () => {
  let service: AdminService;
  let repo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(User),
          useValue: repo,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            count: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            count: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Shop),
          useValue: {
            count: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'token'),
            verify: jest.fn(() => ({ sub: 'user-id' })),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('rejects non-admin users during login', async () => {
    repo.findOne.mockResolvedValue({
      id: '1',
      email: 'student@example.com',
      password: 'hashed',
      raw: { userType: 'user' },
    });

    await expect(
      service.login({ email: 'student@example.com', password: 'secret' }),
    ).rejects.toThrow('Invalid admin credentials');
  });
});
