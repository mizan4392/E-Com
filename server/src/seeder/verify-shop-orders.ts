/**
 * One-off maintenance script: boots the Nest app so TypeORM `synchronize`
 * creates/updates the `order_items` table, then backfills it from the legacy
 * `orders.items` JSON snapshot. Safe to re-run.
 */
import { NestFactory } from '@nestjs/core';
import { config } from 'dotenv';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { ShopOrdersService } from '../orders/shop-orders.service';
import { Order } from '../orders/order.entity';
import { OrderItem, DeliveryStatus } from '../orders/order-item.entity';
import { Shop } from '../admin/shop.entity';
import { ProductReview } from '../products/product-review.entity';

config();

/**
 * `catch` gives us `unknown`; reach for an HTTP status without resorting to
 * `any` so the `no-unsafe-*` lint rules stay satisfied.
 */
function describeError(e: unknown): string {
  const name = e instanceof Error ? e.constructor.name : typeof e;
  const status =
    typeof e === 'object' && e !== null && 'status' in e
      ? String(e.status)
      : '';
  return status ? `${name} ${status}` : name;
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });

  const shopOrders = app.get(ShopOrdersService, { strict: false });
  const inserted = await shopOrders.backfillOrderItems();
  console.log('BACKFILLED_ROWS', inserted);

  const repo = app.get<Repository<OrderItem>>(getRepositoryToken(OrderItem));
  console.log('ORDER_ITEMS_TOTAL', await repo.count());

  const ds = app.get<DataSource>(getDataSourceToken());

  // Find the shop owners so we can drive the seller endpoints with real data.
  const shopOwners = await ds.query(
    `select u.id, u.email, count(s.id)::int shops
       from shops s join users u on u.id = s."userId"
      group by u.id, u.email having count(s.id) > 0
      order by shops desc limit 3`,
  );
  console.log('OWNERS', JSON.stringify(shopOwners));

  const summaryMap = await shopOrders.getShopOrderSummaryMap(
    shopOwners[0]?.id ?? '',
  );
  console.log('SUMMARY_MAP_SHOPS', Object.keys(summaryMap).length);

  for (const owner of shopOwners) {
    const summary = await shopOrders.getShopOrderSummary(owner.id);
    console.log(`SUMMARY[${owner.email}]`, JSON.stringify(summary));

    const list = await shopOrders.listShopOrders(owner.id, { limit: 3 });
    console.log(
      `LIST[${owner.email}] total=${list.total} rows=${list.data.length} pages=${list.totalPages}`,
    );
    for (const row of list.data) {
      console.log(
        `  - order=${row.orderId.slice(0, 8)} shops=${row.shopCount} ` +
          `items=${row.itemCount} amt=${row.shopAmount} ` +
          `delivery=${row.deliveryStatus} isNew=${row.isNew} ` +
          `cust=${row.customerName}`,
      );
    }
  }

  // --- Read-only checks: order-grain pagination and new-only filtering ---
  if (shopOwners.length > 0) {
    const ownerId = shopOwners[0].id as string;
    const firstPage = await shopOrders.listShopOrders(ownerId, { limit: 2 });
    const secondPage = await shopOrders.listShopOrders(ownerId, {
      limit: 2,
      page: 2,
    });
    const firstIds = new Set(firstPage.data.map((row) => row.orderId));
    const overlap = secondPage.data.some((row) => firstIds.has(row.orderId));
    const newOnly = await shopOrders.listShopOrders(ownerId, {
      limit: 50,
      newOnly: true,
    });
    console.log('PAGINATION_CHECK', {
      total: firstPage.total,
      firstPageRows: firstPage.data.length,
      secondPageRows: secondPage.data.length,
      duplicateOrderAcrossPages: overlap,
    });
    console.log('NEW_ONLY_CHECK', {
      rows: newOnly.data.length,
      allAreNew: newOnly.data.every((row) => row.isNew),
    });
    // The core guarantee: one card per order even when the basket spans
    // several of the caller's own shops.
    console.log('ONE_ROW_PER_ORDER_CHECK', {
      rows: newOnly.data.length,
      distinctOrders: new Set(newOnly.data.map((row) => row.orderId)).size,
      multiShopOrders: newOnly.data.filter((row) => row.shopCount > 1).length,
    });

    // Exercise the first-action/badge contract in a transaction that is
    // always rolled back, so the smoke test never changes real order state.
    const target = newOnly.data[0];
    const targetShopId = target?.items[0]?.shopId ?? undefined;
    if (target) {
      const queryRunner: QueryRunner = ds.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const txService = new ShopOrdersService(
          queryRunner.manager.getRepository(Order),
          queryRunner.manager.getRepository(OrderItem),
          queryRunner.manager.getRepository(Shop),
          queryRunner.manager.getRepository(ProductReview),
        );
        const before = await txService.getShopOrderSummary(
          ownerId,
          targetShopId,
        );
        const acted = await txService.updateOrderDeliveryStatus(
          ownerId,
          target.orderId,
          targetShopId,
          DeliveryStatus.SHIPPED,
        );
        const shippedList = await txService.listShopOrders(ownerId, {
          shopId: targetShopId,
          deliveryStatus: DeliveryStatus.SHIPPED,
          limit: 50,
        });
        const after = await txService.getShopOrderSummary(
          ownerId,
          targetShopId,
        );
        console.log('FIRST_ACTION_CHECK', {
          isNewAfterAction: acted.isNew,
          beforeNewPaid: before.newPaid,
          afterNewPaid: after.newPaid,
        });
        console.log('SHIPPED_STATUS_CHECK', {
          updateResponseStatus: acted.deliveryStatus,
          containsUpdatedOrder: shippedList.data.some(
            (row) => row.orderId === target.orderId,
          ),
          filteredStatus: shippedList.data.find(
            (row) => row.orderId === target.orderId,
          )?.deliveryStatus,
        });
      } finally {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
      }
    }
  }

  // --- Verify non-owner isolation ---
  console.log('--- authorization check ---');
  try {
    await shopOrders.listShopOrders(shopOwners[0].id, {
      shopId: '00000000-0000-0000-0000-000000000000',
    });
    console.log('BAD: no error for unknown shop');
  } catch (e) {
    console.log('unknown shop ->', describeError(e));
  }

  const other = await ds.query(
    `select s.id from shops s where s."userId" <> $1 limit 1`,
    [shopOwners[0].id],
  );
  if (other.length > 0) {
    try {
      await shopOrders.listShopOrders(shopOwners[0].id, {
        shopId: other[0].id,
      });
      console.log('BAD: non-owner was allowed');
    } catch (e) {
      console.log('non-owner shop ->', describeError(e));
    }
  }

  await app.close();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('FAIL', e);
    process.exit(1);
  });
