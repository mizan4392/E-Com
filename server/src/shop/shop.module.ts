import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { Shop } from '../admin/shop.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [TypeOrmModule.forFeature([Shop]), ProductsModule],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}
