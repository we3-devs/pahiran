"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CartItem } from "@/lib/types";

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

export function cartItemKey(item: {
  productId: string;
  size?: string | null;
  color?: string | null;
}): string {
  return `${item.productId}::${item.size ?? ""}::${item.color ?? ""}`;
}

export const MAX_QUANTITY = 20;

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
                  ? { ...entry, quantity: Math.min(MAX_QUANTITY, entry.quantity + item.quantity) }
                  : entry,
              ),
            };
          }

          return { items: [...state.items, { ...item, key }] };
        }),

      removeItem: (key) => set((state) => ({ items: state.items.filter((item) => item.key !== key) })),

      setQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items.flatMap((item) => {
            if (item.key !== key) return [item];
            const next = Math.min(MAX_QUANTITY, Math.max(0, Math.floor(quantity)));
            return next === 0 ? [] : [{ ...item, quantity: next }];
          }),
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
          items: state.items.flatMap((item) => {
            if (item.key !== key) return [item];
            const next = item.quantity - 1;
            return next <= 0 ? [] : [{ ...item, quantity: next }];
          }),
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
