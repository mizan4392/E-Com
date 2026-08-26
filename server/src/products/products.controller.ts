import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { ProductsService } from './products.service';
import { AuthGuard, CurrentUser } from '../auth/AuthGuard';
import { UpdateProductDto } from './dto/update-product.dto';
import type { Multer } from 'multer';
import { User } from '../users/user.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get(':id')
  getProductDetails(@Param('id') id: string) {
    console.log('id', id);
    return this.productsService.getProductDetails(id);
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
    console.log('Id', id);
    console.log('payload', updateProductDto);
    console.log('files', files);
    return true;
    // return this.productsService.update(id, updateProductDto, files, user);
  }
}
