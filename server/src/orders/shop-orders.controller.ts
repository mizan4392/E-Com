import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../auth/AuthGuard';
import { ShopOrdersService } from './shop-orders.service';
import { ListShopOrdersQueryDto } from './dto/list-shop-orders.dto';
import {
  UpdateDeliveryStatusDto,
  UpdateOrderDeliveryStatusDto,
} from './dto/update-delivery-status.dto';
import { User } from '../users/user.entity';

/**
 * Seller-facing order management.
 *
 * Kept in its own controller (rather than folded into `OrdersController`)
 * because the audience is inverted: `GET /orders` is "my purchases" scoped to
 * the buyer, this is "my sales" scoped to the shop. Mixing them in one
 * controller makes it far too easy to leak a buyer's history to a seller.
 *
 * Every route is `AuthGuard`-protected and ownership is enforced in
 * `ShopOrdersService.assertShopOwner`.
 */
@Controller('shop-orders')
@UseGuards(AuthGuard)
export class ShopOrdersController {
  constructor(private readonly shopOrdersService: ShopOrdersService) {}

  /**
   * Paginated seller inbox. Omit `shopId` to get every shop the caller owns.
   *
   * `deliveryStatus` matches an order/shop row when any of its lines is in the
   * requested stage. `newOnly=true` restricts to order/shop rows with no
   * seller action recorded yet.
   */
  @Get()
  listShopOrders(
    @Query() query: ListShopOrdersQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.shopOrdersService.listShopOrders(user.id, {
      shopId: query.shopId,
      page: query.page,
      limit: query.limit,
      deliveryStatus: query.deliveryStatus,
      newOnly: query.newOnly,
    });
  }

  /**
   * Badge counters for the My Shop header and each shop card.
   * Optional `shopId` scopes to one shop.
   */
  @Get('summary')
  getSummary(
    @Query('shopId', new ParseUUIDPipe({ optional: true }))
    shopId: string | undefined,
    @CurrentUser() user: User,
  ) {
    return this.shopOrdersService.getShopOrderSummary(user.id, shopId);
  }

  /**
   * Per-shop counters for every shop the caller owns, in one request.
   *
   * Exists so the My Shop page can badge N shop cards without an N+1.
   */
  @Get('summary/by-shop')
  getSummaryByShop(@CurrentUser() user: User) {
    return this.shopOrdersService.getShopOrderSummaryMap(user.id);
  }

  /** One order in full, scoped to a shop the caller owns. */
  @Get(':orderId')
  getShopOrder(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @Query('shopId', new ParseUUIDPipe()) shopId: string,
    @CurrentUser() user: User,
  ) {
    return this.shopOrdersService.getShopOrder(user.id, orderId, shopId);
  }

  /**
   * Bulk-advance every line of this shop in an order to one stage.
   * This is the "Mark as shipped" button.
   */
  @Patch(':orderId/delivery-status')
  updateOrderDeliveryStatus(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @Query('shopId', new ParseUUIDPipe()) shopId: string,
    @Body() dto: UpdateOrderDeliveryStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.shopOrdersService.updateOrderDeliveryStatus(
      user.id,
      orderId,
      shopId,
      dto.deliveryStatus,
    );
  }

  /** Advance a single line, for orders that ship in parts. */
  @Patch(':orderId/items/:itemId/delivery-status')
  updateItemDeliveryStatus(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Query('shopId', new ParseUUIDPipe()) shopId: string,
    @Body() dto: UpdateDeliveryStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.shopOrdersService.updateItemDeliveryStatus(
      user.id,
      orderId,
      itemId,
      shopId,
      dto.deliveryStatus,
    );
  }
}
