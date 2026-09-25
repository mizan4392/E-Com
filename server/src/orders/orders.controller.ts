import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../auth/AuthGuard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders.dto';
import { User } from '../users/user.entity';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: User) {
    return this.ordersService.createOrder(dto, user);
  }

  /**
   * Order history for the signed-in user, newest first.
   * Supports `?page=`, `?limit=` and `?status=` (all validated by the DTO).
   */
  @Get()
  listOrders(@Query() query: ListOrdersQueryDto, @CurrentUser() user: User) {
    return this.ordersService.listOrders(user.id, {
      page: query.page,
      limit: query.limit,
      status: query.status,
    });
  }

  @Get(':id')
  getOrder(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ordersService.getOrder(id, user.id);
  }

  @Post(':id/retry-payment')
  retryPayment(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ordersService.retryPayment(id, user.id);
  }
}
