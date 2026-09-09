import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  Delete,
  Post,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { ProductsService } from './products.service';
import { AuthGuard, CurrentUser } from '../auth/AuthGuard';
import { CreateProductDto, UpdateProductDto } from './dto/update-product.dto';
import type { Multer } from 'multer';
import { User } from '../users/user.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('popular')
  getPopularProducts() {
    return this.productsService.getPopularProducts();
  }

  @Get(':id')
  getProductDetails(@Param('id') id: string) {
    return this.productsService.getProductDetails(id);
  }

  @Post(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('file', 10))
  addProductToShop(
    @Param('id') id: string,
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Array<Multer>,
    @CurrentUser() user: User,
  ) {
    return this.productsService.addProductToShop(
      id,
      createProductDto,
      files,
      user,
    );
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('file', 10))
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Array<Multer>,
    @CurrentUser() user: User,
  ) {
    return this.productsService.update(id, updateProductDto, files, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  deleteProduct(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productsService.deleteProduct(id, user);
  }
}
