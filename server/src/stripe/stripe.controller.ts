import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import Stripe from 'stripe';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/order.entity';

/**
 * Handles Stripe webhook events to keep order status in sync with
 * Stripe's payment lifecycle:
 *  - checkout.session.completed  -> order marked PAID
 *  - checkout.session.expired    -> order marked PAYMENT_FAILED (or CANCELLED)
 *  - payment_intent.payment_failed -> order marked PAYMENT_FAILED
 */
@Controller('stripe')
export class StripeWebhookController {
  constructor(private readonly ordersService: OrdersService) {}

  private get stripe(): Stripe {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new BadRequestException('Stripe is not configured');
    }
    return new Stripe(secretKey, {
      apiVersion: '2026-08-26.dahlia',
    });
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret is not configured');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Webhook requires raw body');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err);
      throw new BadRequestException(
        `Webhook signature verification failed: ${(err as Error).message}`,
      );
    }

    // Only handle the events we care about
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const sessionId = session.id;
        const paymentIntent = session.payment_intent;

        let paymentIntentId: string | undefined;
        if (typeof paymentIntent === 'string') {
          paymentIntentId = paymentIntent;
        } else if (paymentIntent && typeof paymentIntent === 'object') {
          paymentIntentId = paymentIntent.id;
        }

        await this.ordersService.updateStatusBySession(
          sessionId,
          session.payment_status === 'paid'
            ? OrderStatus.PAID
            : OrderStatus.PENDING,
          paymentIntentId,
          session.amount_total ? session.amount_total / 100 : undefined,
        );
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object;
        await this.ordersService.updateStatusBySession(
          session.id,
          OrderStatus.PAID,
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : undefined,
          session.amount_total ? session.amount_total / 100 : undefined,
        );
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object;
        await this.ordersService.updateStatusBySession(
          session.id,
          OrderStatus.PAYMENT_FAILED,
        );
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        await this.ordersService.updateStatusBySession(
          session.id,
          OrderStatus.CANCELLED,
        );
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        // Find the order via the checkout session -> payment intent link
        if (paymentIntent.metadata?.orderId) {
          await this.ordersService.markFailedByOrderId(
            paymentIntent.metadata.orderId,
          );
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        if (paymentIntent.metadata?.orderId) {
          await this.ordersService.markPaidByOrderId(
            paymentIntent.metadata.orderId,
            paymentIntent.id,
            paymentIntent.amount ? paymentIntent.amount / 100 : undefined,
          );
        }
        break;
      }

      default:
        // Ignore other event types
        break;
    }

    return { received: true };
  }

  @Get()
  returnOk() {
    return 'ok';
  }
}
