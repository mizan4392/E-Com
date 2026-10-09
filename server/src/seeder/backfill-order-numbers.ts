/**
 * One-off maintenance script: boots the Nest app and assigns `orderNumber` /
 * `primaryShopId` to any order created before those columns existed.
 *
 * Both columns are nullable only so `synchronize: true` can add them to a
 * populated table. Leaving them null is not harmless — the admin Orders list
 * would render a blank reference for those orders and the `search` filter
 * (which matches on `orderNumber`) could never find them. Runs against the live
 * DataSource, so it also picks up rows inserted by `npm run seed:orders`.
 *
 * Safe to re-run: it only touches rows that are still null.
 */
import { NestFactory } from '@nestjs/core';
import { config } from 'dotenv';
import { AppModule } from '../app.module';
import { AdminOrdersRepository } from '../orders/admin-orders.repository';

config();

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });

  try {
    const repository = app.get(AdminOrdersRepository, { strict: false });

    const updated = await repository.backfillLegacyColumns();
    console.log('BACKFILLED_ORDERS', updated);

    // Confirm nothing was missed, so re-running is cheap to reason about.
    console.log('TOTAL_ORDERS', await repository.countOrders({}));

    // Raw GROUP BY buckets — the zero-fill into a `OrderStatusCountsDto` lives
    // in the service, so print what the query actually returned.
    const buckets = await repository.countByStatus({});
    console.log('STATUS_BUCKETS', JSON.stringify(buckets));
  } finally {
    await app.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e: unknown) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  });
