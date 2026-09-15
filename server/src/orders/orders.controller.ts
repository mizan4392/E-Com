import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../auth/AuthGuard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../users/user.entity';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: User) {
    return this.ordersService.createOrder(dto, user);
  }

  @Get()
  listOrders(@CurrentUser() user: User) {
    return this.ordersService.listOrders(user.userId);
  }

  @Get(':id')
  getOrder(@Param('id') id: string, @CurrentUser() user: User) {
    console.log('id ', id);
    return this.ordersService.getOrder(id, user.id);
  }

  @Post(':id/retry-payment')
  retryPayment(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ordersService.retryPayment(id, user.id);
  }
}
