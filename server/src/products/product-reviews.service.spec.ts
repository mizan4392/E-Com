import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/order.entity';
import { DeliveryStatus, OrderItem } from '../orders/order-item.entity';
import { Product } from '../admin/product.entity';
import { ProductReview } from './product-review.entity';
import { ProductReviewsService } from './product-reviews.service';

describe('ProductReviewsService', () => {
  const orderId = 'order-id';
  const itemId = 'item-id';
  const productId = 'product-id';
  const userId = 'buyer-id';
  const order = {
    id: orderId,
    status: OrderStatus.PAID,
    buyerConfirmedAt: '2026-09-01T00:00:00.000Z',
    user: { id: userId, firstName: 'Ada', lastName: 'Lovelace' },
  };
  const item = {
    id: itemId,
    orderId,
    productId,
    name: 'Headphones',
    imageUrl: null,
    deliveryStatus: DeliveryStatus.DELIVERED,
  };

  function createHarness(
    product: Product,
    existingReview: ProductReview | null,
  ) {
    const orderRepository = {
      findOne: jest.fn().mockResolvedValue(order),
    };
    const orderItemRepository = {
      findOne: jest.fn().mockResolvedValue(item),
    };
    const productRepository = {
      findOne: jest.fn().mockResolvedValue(product),
      save: jest.fn((value: unknown) => Promise.resolve(value)),
    };
    const reviewRepository = {
      findOne: jest.fn().mockResolvedValue(existingReview),
      findOneByOrFail: jest.fn(),
      create: jest.fn(
        (value: Partial<ProductReview>) =>
          ({
            ...value,
            id: 'review-id',
            createdAt: '2026-09-01T00:00:00.000Z',
            updatedAt: '2026-09-01T00:00:00.000Z',
          }) as ProductReview,
      ),
      save: jest.fn((value: unknown) => Promise.resolve(value)),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          rating: '5',
          reviewCount: existingReview ? '2' : '1',
        }),
      })),
    };
    const repositories = new Map<unknown, unknown>([
      [Order, orderRepository],
      [OrderItem, orderItemRepository],
      [Product, productRepository],
      [ProductReview, reviewRepository],
    ]);
    const transactionManager = {
      getRepository: jest.fn((entity: unknown) => repositories.get(entity)),
    };
    const ordersRepository = {
      manager: {
        transaction: jest.fn(
          (callback: (manager: unknown) => Promise<unknown>) =>
            callback(transactionManager),
        ),
      },
    };
    const savedReview = existingReview ?? {
      id: 'review-id',
      orderItemId: itemId,
      rating: 5,
      message: 'Excellent sound quality',
      reviewerName: 'Ada L.',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };
    reviewRepository.findOneByOrFail.mockResolvedValue(savedReview);

    const service = new ProductReviewsService(
      reviewRepository as unknown as Repository<ProductReview>,
      productRepository as unknown as Repository<Product>,
      ordersRepository as unknown as Repository<Order>,
      orderItemRepository as unknown as Repository<OrderItem>,
    );

    return { service, productRepository, reviewRepository, orderRepository };
  }

  it('creates one verified review and updates the product aggregate', async () => {
    const product = { id: productId, rating: 0, reviewCount: 0 } as Product;
    const { service, productRepository, reviewRepository } = createHarness(
      product,
      null,
    );

    await service.upsertOrderItemReview(orderId, itemId, userId, {
      rating: 5,
      message: 'Excellent sound quality',
    });

    expect(reviewRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        orderItemId: itemId,
        productId,
        reviewerId: userId,
        reviewerName: 'Ada L.',
        rating: 5,
      }),
    );
    expect(product.rating).toBe(5);
    expect(product.reviewCount).toBe(1);
    expect(productRepository.save).toHaveBeenCalledWith(product);
  });

  it('updates an existing review without increasing the review count', async () => {
    const product = { id: productId, rating: 4, reviewCount: 2 } as Product;
    const existingReview = {
      id: 'review-id',
      orderItemId: itemId,
      rating: 3,
      message: 'Good',
      reviewerName: 'Ada L.',
      updatedAt: '2026-09-01T00:00:00.000Z',
    } as ProductReview;
    const { service, productRepository, reviewRepository } = createHarness(
      product,
      existingReview,
    );

    await service.upsertOrderItemReview(orderId, itemId, userId, {
      rating: 5,
      message: 'Excellent sound quality',
    });

    expect(existingReview.rating).toBe(5);
    expect(existingReview.message).toBe('Excellent sound quality');
    expect(product.rating).toBe(5);
    expect(product.reviewCount).toBe(2);
    expect(reviewRepository.create).not.toHaveBeenCalled();
    expect(productRepository.save).toHaveBeenCalledWith(product);
  });

  it('rejects review submission before the buyer confirms receipt', async () => {
    const product = { id: productId, rating: 0, reviewCount: 0 } as Product;
    const { service, orderRepository, reviewRepository } = createHarness(
      product,
      null,
    );
    orderRepository.findOne.mockResolvedValue({
      ...order,
      buyerConfirmedAt: null,
    });

    await expect(
      service.upsertOrderItemReview(orderId, itemId, userId, {
        rating: 5,
        message: 'Excellent sound quality',
      }),
    ).rejects.toThrow('Reviews are available after you confirm receipt');
    expect(reviewRepository.create).not.toHaveBeenCalled();
  });
});
