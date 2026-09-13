import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Snapshot of the product stored in the cart so the cart page can render
 * full details (image, price, stock, shop) without extra API calls.
 */
export type CartProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  stock: number;
  shopId?: string;
  shopName?: string;
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
};

interface CartState {
  items: CartItem[];
  addItem: (product: CartProduct, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  /** Number of distinct products in the cart (not total quantity). */
  getTotalItems: () => number;
  /** Total price of all items (price × quantity summed). */
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity) => {
        set((state) => {
          const existing = state.items.find(
            (item) => item.product.id === product.id,
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? {
                      ...item,
                      quantity: item.quantity + quantity,
                      // Keep the product snapshot fresh
                      product,
                    }
                  : item,
              ),
            };
          }
          return { items: [...state.items, { product, quantity }] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.product.id !== productId)
              : state.items.map((item) =>
                  item.product.id === productId ? { ...item, quantity } : item,
                ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemQuantity: (productId) => {
        return (
          get().items.find((item) => item.product.id === productId)?.quantity ??
          0
        );
      },

      getTotalItems: () => {
        // Count distinct products in the cart (not total quantity).
        return get().items.length;
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + (item.product.price || 0) * item.quantity,
          0,
        );
      },
    }),
    {
      name: "cart-storage",
      version: 1,
      // Migrate the previous persisted shape `{ productId, quantity }`
      // to the new shape `{ product: CartProduct, quantity }`.
      migrate: (persistedState: unknown, version) => {
        if (version >= 1) return persistedState as CartState;

        const old = persistedState as {
          items?: Array<{ productId: string; quantity: number }>;
        };
        return {
          ...old,
          items: (old?.items ?? []).map((item) => ({
            product: {
              id: item.productId,
              name: "",
              price: 0,
              stock: 0,
              imageUrl: "",
            },
            quantity: item.quantity,
          })),
        } as CartState;
      },
    },
  ),
);

export default useCartStore;
