import { randomBytes } from 'crypto';

/**
 * Prefix on every generated order number.
 *
 * Makes an order number instantly recognisable in a support ticket or a seller
 * conversation, and leaves room for other document types to use distinct
 * prefixes later.
 */
const ORDER_NUMBER_PREFIX = 'ORD';

/** Hex characters taken from the order UUID when backfilling. */
const BACKFILL_UUID_CHARS = 8;

/**
 * Builds a human-readable, collision-resistant order number.
 *
 * Shape: `ORD-<year>-<12 hex chars>`, e.g. `ORD-2026-9F3A7C1B2E40`.
 *
 * **Why a random suffix rather than a zero-padded sequence.** The intuitive
 * design is `ORD-2026-00001`, `ORD-2026-00002`, … which requires a per-year
 * counter. Getting that counter right under concurrency means either a
 * dedicated sequence in Postgres (a schema object this project does not
 * otherwise use — schema changes here are `synchronize: true`) or a
 * read-modify-write that races and produces duplicates. A unique-constraint
 * violation on a customer-facing identifier is a far worse failure than an
 * order number that is merely not consecutive.
 *
 * `randomBytes(6)` gives 48 bits of entropy — roughly 2.8e14 combinations — so
 * collisions are negligible, and it costs no coordination or extra round-trip.
 * The year prefix is kept purely so a human can still eyeball roughly when an
 * order was placed.
 *
 * The unique index on `orderNumber` remains the actual guarantee; this only
 * makes violations vanishingly unlikely rather than impossible.
 */
export function generateOrderNumber(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const suffix = randomBytes(6).toString('hex').toUpperCase();
  return `${ORDER_NUMBER_PREFIX}-${year}-${suffix}`;
}

/**
 * Derives a stable order number for a pre-existing order during backfill.
 *
 * Backfilled rows have no natural counter, so this is keyed off the order's
 * own UUID and creation date, which keeps it **deterministic**: re-running the
 * backfill produces the same number for the same order instead of churning
 * every identifier on each run.
 *
 * Two different orders therefore always produce two different numbers, even
 * when created within the same millisecond, because the tail comes from the
 * UUID rather than from a timestamp.
 */
export function deriveOrderNumber(order: {
  id: string;
  createdAt?: string | Date | null;
}): string {
  const created = order.createdAt ? new Date(order.createdAt) : new Date();
  const year = Number.isNaN(created.getTime())
    ? new Date().getUTCFullYear()
    : created.getUTCFullYear();

  // Strip the UUID dashes and take a fixed-length slice as the unique tail.
  const uuidPart = order.id
    .replace(/-/g, '')
    .slice(0, BACKFILL_UUID_CHARS)
    .toUpperCase();

  return `${ORDER_NUMBER_PREFIX}-${year}-${uuidPart}`;
}
