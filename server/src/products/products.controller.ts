import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get(':id')
  getProductDetails(@Param('id') id: string) {
    console.log('id', id);
    return this.productsService.getProductDetails(id);
  }
}
