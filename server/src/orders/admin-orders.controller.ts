import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard';
import { AdminOrdersService } from './admin-orders.service';
import {
  ListAdminOrdersQueryDto,
  OrderStatusCountsQueryDto,
  type AdminOrderDetailDto,
  type AdminOrderListItemDto,
  type OrderStatusCountsDto,
} from './dto/admin-orders.dto';
import type { PaginatedResponse } from '../common/pagination-query.dto';

/**
 * Read-only order administration.
 *
 * Guarded by {@link AdminGuard}, which verifies the bearer JWT *and* loads the
 * user to confirm `raw.userType === 'admin'`. That second check is what keeps
 * sellers out: a seller holds a valid token for the same signing secret, so
 * verifying the signature alone would let every seller call these endpoints
 * and read every customer's order across every shop.
 *
 * Every handler is a single delegation — validation happens via the DTOs on
 * `app.setGlobalPrefix`'s global `ValidationPipe`, and data access plus mapping
 * belong to the service.
 */
@Controller('admin/orders')
@UseGuards(AdminGuard)
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  /**
   * `GET /admin/orders` — paginated, filterable order list.
   *
   * Declared **before** `status-counts` is irrelevant to routing (both are
   * static segments), but it is declared before `:id` because a static path
   * always wins over a parameter in Express: declaring `@Get(':id')` first
   * would let `/admin/orders/status-counts` match the parameter and be parsed
   * as a UUID.
   */
  @Get()
  listOrders(
    @Query() query: ListAdminOrdersQueryDto,
  ): Promise<PaginatedResponse<AdminOrderListItemDto>> {
    return this.adminOrdersService.listOrders(query);
  }

  /**
   * `GET /admin/orders/status-counts` — per-status tallies for the list tabs.
   *
   * Takes the same validated DTO as a filtered list request, so a malformed
   * `shopId` or `dateFrom` is rejected identically on both endpoints and the
   * tabs can never be counting a different filter set than the rows.
   */
  @Get('status-counts')
  getStatusCounts(
    @Query() query: OrderStatusCountsQueryDto,
  ): Promise<OrderStatusCountsDto> {
    return this.adminOrdersService.getStatusCounts(query);
  }

  /**
   * `GET /admin/orders/:id` — full detail for one order.
   *
   * `ParseUUIDPipe` rejects a malformed id with 400 instead of spending a
   * query on it, and — because Postgres would otherwise raise a
   * `22P02 invalid input syntax for type uuid` — stops a junk parameter from
   * surfacing as a 500.
   */
  @Get(':id')
  getOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<AdminOrderDetailDto> {
    return this.adminOrdersService.getOrderDetail(id);
  }
}
