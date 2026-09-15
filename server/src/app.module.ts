import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { UploadFileService } from './uploadFile.service';
import { ShopModule } from './shop/shop.module';
import { ProductsModule } from './products/products.module';
import { ShopAuthorizationService } from './shop/shopAuthorization.service';
import { Shop } from './admin/shop.entity';
import { CategoryModule } from './category/category.module';
import { OrdersModule } from './orders/orders.module';
import { StripeModule } from './stripe/stripe.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT || 5432),
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'ecom',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Shop]),
    UsersModule,
    AuthModule,
    AdminModule,
    ShopModule,
    ProductsModule,
    CategoryModule,
    OrdersModule,
    StripeModule,
  ],
  controllers: [AppController],
  providers: [AppService, UploadFileService, ShopAuthorizationService],
  exports: [UploadFileService, ShopAuthorizationService],
})
export class AppModule {}
