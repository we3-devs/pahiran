"use client";

import { AlertTriangle, LoaderCircle, Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { QuantityStepper } from "@/components/store/quantity-stepper";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { cartCount, cartSubtotal, useCartStore } from "@/lib/cart/store";
import { useCartAvailability } from "@/lib/cart/use-cart-availability";
import { formatPrice } from "@/lib/format";
import type { CartItem } from "@/lib/types";
import { useIsHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

export function CartView({ currencySymbol }: { currencySymbol: string }) {
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const addItem = useCartStore((state) => state.addItem);
  const hydrated = useIsHydrated();
  const { toast } = useToast();
  const availability = useCartAvailability(items);

  const handleRemove = (item: CartItem) => {
    removeItem(item.key);
    toast("Removed from cart", {
      description: item.name,
      variant: "info",
      action: {
        label: "Undo",
        // Re-adding the same line (with its options) is enough to undo.
        onClick: () =>
          addItem({
            productId: item.productId,
            slug: item.slug,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          }),
      },
    });
  };

  const removeUnavailable = () => {
    const removed = items.filter((item) => availability.statusOf(item.productId) !== "ok");
    removed.forEach((item) => removeItem(item.key));
    toast(
      removed.length === 1 ? "Unavailable item removed" : `${removed.length} unavailable items removed`,
      { variant: "info" },
    );
  };

  if (!hydrated) {
    return (
      <div className="space-y-4">
        {[0, 1].map((row) => (
          <div key={row} className="flex gap-4">
            <Skeleton className="h-28 w-24" />
            <div className="flex-1 space-y-3 py-1">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-4 w-1/5" />
              <Skeleton className="h-9 w-32 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty."
        description="Add something you like and it will show up here."
        action={
          <Link href="/shop" className={buttonVariants({ variant: "dark", size: "lg" })}>
            Continue Shopping
          </Link>
        }
      />
    );
  }

  const total = cartSubtotal(items);
  const count = cartCount(items);
  const blocked = availability.unavailableCount > 0;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-12">
      <div>
        {blocked ? (
          <div
            role="alert"
            className="mb-6 flex flex-wrap items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-[13px] text-amber-950"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {availability.unavailableCount === 1
                  ? "This product is currently out of stock."
                  : `${availability.unavailableCount} products are currently out of stock.`}
              </p>
              <p className="mt-1">
                Please remove{" "}
                {availability.unavailableCount === 1 ? "it" : "them"} before continuing to checkout.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={removeUnavailable}>
              Remove unavailable {availability.unavailableCount === 1 ? "item" : "items"}
            </Button>
          </div>
        ) : null}

        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => {
            const status = availability.statusOf(item.productId);
            const unavailable = status === "out_of_stock";

            return (
              <li key={item.key} className="flex gap-4 py-5">
                <div
                  className={cn(
                    "relative h-28 w-24 shrink-0 overflow-hidden rounded-md bg-surface",
                    unavailable && "opacity-60",
                  )}
                >
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                  ) : null}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-[15px] font-medium">
                        <Link href={`/product/${item.slug}`} className="hover:text-brand">
                          {item.name}
                        </Link>
                      </h2>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(" · ") ||
                          "One size"}
                      </p>
                      <p className="mt-1 text-[13px] text-muted">
                        {formatPrice(item.price, currencySymbol)} each
                      </p>
                      {unavailable ? (
                        <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[12px] font-semibold text-amber-900">
                          <AlertTriangle className="size-3" aria-hidden />
                          Out of stock
                        </p>
                      ) : null}
                    </div>

                    <p className="shrink-0 text-[15px] font-semibold">
                      {formatPrice(item.price * item.quantity, currencySymbol)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <QuantityStepper
                      compact
                      quantity={item.quantity}
                      onChange={(quantity) => setQuantity(item.key, quantity)}
                      unavailable={unavailable}
                    />

                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-red-600"
                    >
                      <Trash className="size-3.5" aria-hidden />
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/shop"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
          >
            Continue Shopping
          </Link>

          {availability.loading ? (
            <p className="flex items-center gap-2 text-[13px] text-muted">
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
              Checking availability…
            </p>
          ) : null}
        </div>
      </div>

      <aside className="mt-8 rounded-xl border border-line bg-surface p-5 lg:mt-0 lg:sticky lg:top-24">
        <h2 className="font-display text-lg">Order Summary</h2>
        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Items ({count})</dt>
            <dd className="font-medium">{formatPrice(total, currencySymbol)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd className="text-muted">Arranged on WhatsApp</dd>
          </div>
        </dl>

        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="text-sm font-medium">Total</span>
          <span className="font-display text-xl font-semibold">
            {formatPrice(total, currencySymbol)}
          </span>
        </div>

        {blocked ? (
          <>
            <Button variant="dark" size="lg" className="mt-5 w-full" disabled>
              Proceed to Checkout
            </Button>
            <p className="mt-2 text-[13px] text-amber-800">
              Remove the unavailable {availability.unavailableCount === 1 ? "item" : "items"} to
              continue.
            </p>
          </>
        ) : (
          <Link
            href="/checkout"
            className={cn(buttonVariants({ variant: "dark", size: "lg" }), "mt-5 w-full")}
          >
            Proceed to Checkout
          </Link>
        )}

        <Link
          href="/shop"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-2 w-full")}
        >
          Continue Shopping
        </Link>
      </aside>

      {/* Sticky checkout bar for phones */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-wide uppercase text-muted">Total</p>
            <p className="text-base font-semibold">{formatPrice(total, currencySymbol)}</p>
          </div>
          {blocked ? (
            <Button variant="dark" size="md" disabled>
              Checkout
            </Button>
          ) : (
            <Link href="/checkout" className={buttonVariants({ variant: "dark", size: "md" })}>
              Checkout
            </Link>
          )}
        </div>
      </div>
      <div aria-hidden className="h-16 lg:hidden" />
    </div>
  );
}
