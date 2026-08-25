import { User } from "../stores/userStore";
import { Shop } from "../types/shop";

export function formatPrice(price: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(price ?? 0));
}

export const getIsOwner = (shop: Shop | undefined, user: User | null) => {
  return Boolean(
    shop?.user && (user?.id === shop.user.userId || user?.id === shop.user.id),
  );
};
