import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Shop } from '../admin/shop.entity';

@Injectable()
export class ShopAuthorizationService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  async assertShopOwner(userId: string, shopId: string) {
    const shop = await this.shopRepository.findOne({
      where: {
        id: shopId,
      },
      select: {
        id: true,
        user: true,
      },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    if (shop.user?.id !== userId) {
      return new ForbiddenException(
        'You do not have permission to modify this shop',
      );
    }
    return true;
  }
}
