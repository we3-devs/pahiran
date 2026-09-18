"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { cartItemKey, clampQuantity, MAX_QUANTITY } from "@/lib/cart/item";
import type { CartItem } from "@/lib/types";

export { cartItemKey, MAX_QUANTITY } from "@/lib/cart/item";

export type NewCartItem = Omit<CartItem, "key">;

type CartState = {
  items: CartItem[];
  addItem: (item: NewCartItem) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  clear: () => void;
};

/** Cart is client-only and persisted in localStorage — never stored in Supabase. */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const key = cartItemKey(item);
          const existing = state.items.find((entry) => entry.key === key);

          if (existing) {
            return {
              items: state.items.map((entry) =>
                entry.key === key
                  ? {
                      ...entry,
                      quantity: Math.min(MAX_QUANTITY, entry.quantity + item.quantity),
                      // Keep the freshest name/price the storefront knows about.
                      name: item.name,
                      price: item.price,
                      image: item.image,
                      slug: item.slug,
                    }
                  : entry,
              ),
            };
          }

          return { items: [...state.items, { ...item, key, quantity: clampQuantity(item.quantity) }] };
        }),

      removeItem: (key) => set((state) => ({ items: state.items.filter((item) => item.key !== key) })),

      // Quantities never drop below 1 here: removing a line is always an
      // explicit action (`removeItem`), never a side effect of tapping "−".
      setQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.key === key ? { ...item, quantity: clampQuantity(quantity) } : item,
          ),
        })),

      increment: (key) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.key === key
              ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + 1) }
              : item,
          ),
        })),

      decrement: (key) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.key === key ? { ...item, quantity: clampQuantity(item.quantity - 1) } : item,
          ),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: "store-cart",
      version: 1,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
