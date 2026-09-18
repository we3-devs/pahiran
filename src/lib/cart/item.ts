/**
 * Pure cart helpers, shared by client components and server actions.
 *
 * This module deliberately has no `"use client"` directive: the checkout
 * server action re-derives cart line identities with the exact same rules the
 * browser used, so both sides always agree on what a "line" is.
 */

import type { CartItem, VerifiedCartLine } from "@/lib/types";

export const MAX_QUANTITY = 20;
export const MIN_QUANTITY = 1;

export function cartItemKey(item: {
  productId: string;
  size?: string | null;
  color?: string | null;
}): string {
  return `${item.productId}::${item.size ?? ""}::${item.color ?? ""}`;
}

/** Keeps a quantity inside 1…MAX_QUANTITY, tolerating junk input. */
export function clampQuantity(value: number): number {
  const asNumber = Number.isFinite(value) ? Math.floor(value) : MIN_QUANTITY;
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, asNumber));
}

/**
 * Turns a server-verified line back into a cart item, so the WhatsApp message
 * is built from database values (name, price, image) rather than whatever the
 * browser happens to have in localStorage.
 */
export function verifiedLineToCartItem(line: VerifiedCartLine): CartItem {
  return {
    key: cartItemKey(line),
    productId: line.productId,
    slug: line.slug,
    name: line.name,
    price: line.price,
    image: line.image,
    quantity: clampQuantity(line.quantity),
    size: line.size,
    color: line.color,
  };
}
