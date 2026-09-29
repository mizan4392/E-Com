import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/order.entity';
import { DeliveryStatus, OrderItem } from '../orders/order-item.entity';
import { Product } from '../admin/product.entity';
import { ProductReview } from './product-review.entity';
import { User } from '../users/user.entity';
import { UpsertProductReviewDto } from './dto/product-review.dto';

export type ProductReviewView = {
  id: string;
  rating: number;
  message: string;
  reviewerName: string;
  createdAt: string;
};

export type ProductReviewList = {
  data: ProductReviewView[];
  total: number;
  currentPage: number;
  totalPages: number;
};

export type OrderReviewItemView = {
  orderItemId: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  rating: number | null;
  message: string | null;
  updatedAt: string | null;
};

@Injectable()
export class ProductReviewsService {
  constructor(
    @InjectRepository(ProductReview)
    private readonly reviewsRepo: Repository<ProductReview>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
  ) {}

  async listProductReviews(
    productId: string,
    page: number,
    limit: number,
  ): Promise<ProductReviewList> {
    const productExists = await this.productsRepo.existsBy({ id: productId });
    if (!productExists) {
      throw new NotFoundException('Product not found');
    }

    const currentPage = Math.max(1, page);
    const pageLimit = Math.min(50, Math.max(1, limit));
    const [reviews, total] = await this.reviewsRepo.findAndCount({
      where: { productId },
      select: {
        id: true,
        rating: true,
        message: true,
        reviewerName: true,
        createdAt: true,
      },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (currentPage - 1) * pageLimit,
      take: pageLimit,
    });

    return {
      data: reviews,
      total,
      currentPage,
      totalPages: Math.max(1, Math.ceil(total / pageLimit)),
    };
  }

  async listOrderReviews(
    orderId: string,
    userId: string,
  ): Promise<OrderReviewItemView[]> {
    await this.findReviewableOrder(orderId, userId);
    const items = await this.orderItemsRepo.find({
      where: { orderId, deliveryStatus: DeliveryStatus.DELIVERED },
      order: { id: 'ASC' },
    });
    const productIds = [
      ...new Set(items.map((item) => item.productId).filter(Boolean)),
    ] as string[];
    if (productIds.length === 0) {
      return [];
    }

    const products = await this.productsRepo.find({
      where: { id: In(productIds) },
      relations: { shop: { user: true } },
    });
    const eligibleProductIds = new Set(
      products
        .filter((product) => product.shop?.user?.id !== userId)
        .map((product) => product.id),
    );
    const reviewableItems = items.filter(
      (item) => item.productId && eligibleProductIds.has(item.productId),
    );
    if (reviewableItems.length === 0) {
      return [];
    }

    const reviews = await this.reviewsRepo.find({
      where: { orderItemId: In(reviewableItems.map((item) => item.id)) },
    });
    const reviewsByItem = new Map(
      reviews.map((review) => [review.orderItemId, review]),
    );

    return reviewableItems.map((item) => {
      const review = reviewsByItem.get(item.id);
      return {
        orderItemId: item.id,
        productId: item.productId!,
        productName: item.name,
        imageUrl: item.imageUrl ?? null,
        rating: review?.rating ?? null,
        message: review?.message ?? null,
        updatedAt: review?.updatedAt ?? null,
      };
    });
  }

  async upsertOrderItemReview(
    orderId: string,
    orderItemId: string,
    userId: string,
    dto: UpsertProductReviewDto,
  ): Promise<OrderReviewItemView> {
    return this.ordersRepo.manager.transaction(async (manager) => {
      const ordersRepo = manager.getRepository(Order);
      const orderItemsRepo = manager.getRepository(OrderItem);
      const productsRepo = manager.getRepository(Product);
      const reviewsRepo = manager.getRepository(ProductReview);

      const order = await ordersRepo.findOne({
        where: { id: orderId, user: { id: userId } },
        relations: { user: true },
      });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      this.assertReviewableOrder(order);

      const item = await orderItemsRepo.findOne({
        where: {
          id: orderItemId,
          orderId,
          deliveryStatus: DeliveryStatus.DELIVERED,
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (!item?.productId) {
        throw new BadRequestException('This delivered item cannot be reviewed');
      }

      const productWithShop = await productsRepo.findOne({
        where: { id: item.productId },
        relations: { shop: { user: true } },
      });
      if (!productWithShop) {
        throw new NotFoundException('Product not found');
      }
      if (productWithShop.shop?.user?.id === userId) {
        throw new ForbiddenException('You cannot review your own product');
      }

      const product = await productsRepo.findOne({
        where: { id: item.productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const existingReview = await reviewsRepo.findOne({
        where: { orderItemId },
      });
      const rating = Math.min(5, Math.max(1, dto.rating));
      const message = dto.message.trim();
      const reviewerName = getReviewerName(order.user);

      if (existingReview) {
        existingReview.rating = rating;
        existingReview.message = message;
        existingReview.reviewerId = userId;
        existingReview.reviewerName = reviewerName;
        await reviewsRepo.save(existingReview);
      } else {
        const review = reviewsRepo.create({
          productId: product.id,
          orderItemId: item.id,
          reviewerId: userId,
          reviewerName,
          rating,
          message,
        });
        await reviewsRepo.save(review);
      }

      const aggregate = await reviewsRepo
        .createQueryBuilder('review')
        .select('AVG(review."rating")', 'rating')
        .addSelect('COUNT(review.id)', 'reviewCount')
        .where('review."productId" = :productId', { productId: product.id })
        .getRawOne<{ rating: string | null; reviewCount: string }>();
      product.rating = roundRating(Number(aggregate?.rating ?? 0));
      product.reviewCount = Number(aggregate?.reviewCount ?? 0);
      await productsRepo.save(product);
      const savedReview = await reviewsRepo.findOneByOrFail({ orderItemId });
      return {
        orderItemId: item.id,
        productId: product.id,
        productName: item.name,
        imageUrl: item.imageUrl ?? null,
        rating: savedReview.rating,
        message: savedReview.message,
        updatedAt: savedReview.updatedAt,
      };
    });
  }

  private async findReviewableOrder(
    orderId: string,
    userId: string,
  ): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId, user: { id: userId } },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    this.assertReviewableOrder(order);
    return order;
  }

  private assertReviewableOrder(order: Order): void {
    if (order.status !== OrderStatus.PAID || !order.buyerConfirmedAt) {
      throw new BadRequestException(
        'Reviews are available after you confirm receipt',
      );
    }
  }
}

function roundRating(value: number): number {
  return Math.round(value * 100) / 100;
}

function getReviewerName(user?: User | null): string {
  if (!user) return 'Verified buyer';
  const firstName = user.firstName?.trim();
  const lastInitial = user.lastName?.trim().charAt(0);
  if (firstName && lastInitial) return `${firstName} ${lastInitial}.`;
  return firstName || 'Verified buyer';
}
