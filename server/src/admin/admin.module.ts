import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { Category } from './category.entity';
import { Product } from './product.entity';
import { Shop } from './shop.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Category, Product, Shop]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'admin-secret',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  // JwtModule must be exported alongside AdminGuard: any module that imports
  // AdminModule in order to use `@UseGuards(AdminGuard)` builds the guard in
  // *its own* injector, so its `JwtService` dependency has to be re-exported
  // here. Without this, Nest throws UnknownDependenciesException at boot.
  exports: [AdminService, AdminGuard, JwtModule],
})
export class AdminModule {}
