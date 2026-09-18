"use server";

import { clampQuantity } from "@/lib/cart/item";
import { getCartProducts } from "@/lib/data/products";
import type { VerifiedCartLine } from "@/lib/types";

/**
 * Cart verification.
 *
 * The cart lives in localStorage, so the browser's copy of a price, name or
 * stock flag can never be trusted. Before checkout we re-read the products and
 * return server-authoritative lines plus the ids that are out of stock or no
 * longer published — that is what makes the out-of-stock rule enforceable from
 * the UI, a refresh, or any hand-edited localStorage.
 */

export type CartLineInput = {
  productId: string;
  size: string | null;
  color: string | null;
  quantity: number;
};

export type CartCheckResult =
  | { ok: true; lines: VerifiedCartLine[]; unavailableIds: string[] }
  | { ok: false; error: string };

const LOOKUP_ERROR =
  "We could not check product availability just now. Please try again.";

export async function checkCartItems(items: CartLineInput[]): Promise<CartCheckResult> {
  if (items.length === 0) return { ok: true, lines: [], unavailableIds: [] };

  try {
    const products = await getCartProducts(items.map((item) => item.productId));
    const byId = new Map(products.map((product) => [product.id, product]));

    const lines: VerifiedCartLine[] = [];
    const unavailableIds: string[] = [];

    items.forEach((item) => {
      const product = byId.get(item.productId);

      // Gone entirely (deleted, hidden or no longer readable) or out of stock.
      if (!product || !product.in_stock) {
        unavailableIds.push(item.productId);
        return;
      }

      lines.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: clampQuantity(item.quantity),
        size: item.size,
        color: item.color,
      });
    });

    return { ok: true, lines, unavailableIds };
  } catch (error) {
    console.error("[cart] availability check failed:", error);
    return { ok: false, error: LOOKUP_ERROR };
  }
}
