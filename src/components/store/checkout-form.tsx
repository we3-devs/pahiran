"use client";

import { AlertTriangle, LoaderCircle, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { checkCartItems } from "@/lib/actions/cart";
import { verifiedLineToCartItem } from "@/lib/cart/item";
import { cartSubtotal, useCartStore } from "@/lib/cart/store";
import { useCartAvailability } from "@/lib/cart/use-cart-availability";
import { formatPrice } from "@/lib/format";
import type { CartItem, CheckoutDetails, StoreSettings } from "@/lib/types";
import { useIsHydrated } from "@/lib/use-hydrated";
import { hasErrors, validateCheckout, type FieldErrors } from "@/lib/validation";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const EMPTY_DETAILS: CheckoutDetails = { fullName: "", phone: "", address: "", note: "" };

const OUT_OF_STOCK_IN_CART =
  "Some pieces in your cart are out of stock. Remove them from your cart and try again.";

export function CheckoutForm({ settings }: { settings: StoreSettings }) {
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const hydrated = useIsHydrated();
  const availability = useCartAvailability(items);
  const { toast } = useToast();

  const [details, setDetails] = React.useState<CheckoutDetails>(EMPTY_DETAILS);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submittedLink, setSubmittedLink] = React.useState<string | null>(null);
  const [blockedLink, setBlockedLink] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const openWhatsapp = (link: string) => {
    // Deliberately without "noopener": with it, window.open() always returns
    // null per spec, so a successful open would look like a blocked popup.
    // The opener reference is stripped manually instead.
    const opened = window.open(link, "_blank");
    if (opened) {
      try {
        opened.opener = null;
      } catch {
        // Cross-origin set refused — the tab still opened, which is what matters.
      }
    }

    if (!opened) {
      setBlockedLink(link);
      return;
    }

    setBlockedLink(null);
    setSubmittedLink(link);
    // The order now lives in the customer's WhatsApp draft — empty the cart.
    clear();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;

    const nextErrors = validateCheckout(details);
    setErrors(nextErrors);
    setFormError(null);

    if (hasErrors(nextErrors)) {
      document.getElementById(Object.keys(nextErrors)[0])?.focus();
      return;
    }

    if (availability.unavailableCount > 0) {
      setFormError(OUT_OF_STOCK_IN_CART);
      return;
    }

    if (!buildWhatsappLink(items, details, settings)) {
      setFormError(
        "The store has not configured a WhatsApp number yet. Please get in touch another way.",
      );
      return;
    }

    startTransition(async () => {
      // Re-check against the database one last time: the cart lives in
      // localStorage, so this is the moment availability becomes enforceable.
      const verified = await checkCartItems(
        items.map((item) => ({
          productId: item.productId,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        })),
      );

      let orderItems: CartItem[] = items;

      if (verified.ok) {
        if (verified.unavailableIds.length > 0) {
          setFormError(OUT_OF_STOCK_IN_CART);
          toast("Some items are out of stock", {
            variant: "warning",
            action: { label: "View Cart", href: "/cart" },
          });
          return;
        }
        // Build the message from database values — never from localStorage.
        orderItems = verified.lines.map(verifiedLineToCartItem);
      } else {
        // The check itself failed (offline, server hiccup). We do not invent an
        // error and we never claim the order was sent — we just proceed with the
        // customer's own cart so ordering is not blocked by our infrastructure.
        console.warn("[checkout] availability check unavailable, continuing with local cart.");
      }

      const link = buildWhatsappLink(orderItems, details, settings);
      if (!link) {
        setFormError(
          "We could not open WhatsApp for this order. Please try again or contact the store directly.",
        );
        return;
      }

      openWhatsapp(link);
    });
  };

  const blocked = availability.unavailableCount > 0;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-12">
      <div>
        {submittedLink ? (
          <div className="rounded-xl border border-line bg-surface p-6">
            <h2 className="font-display text-xl">Your order is ready in WhatsApp</h2>
            <p className="mt-2 text-sm text-muted">
              Press <strong className="text-ink">Send</strong> in WhatsApp to confirm your order. We
              will reply with delivery details.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={submittedLink}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "primary", size: "md" })}
              >
                Open WhatsApp again
              </a>
              <Link href="/shop" className={buttonVariants({ variant: "outline", size: "md" })}>
                Continue Shopping
              </Link>
            </div>
            <p className="mt-5 text-[13px] text-muted">
              Nothing was saved on this website — your cart has been cleared.
            </p>
          </div>
        ) : hydrated && items.length === 0 ? (
          // Covers arriving at /checkout with nothing in the cart and the
          // refresh-after-order case: the cart was cleared on send.
          <EmptyState
            title="Your cart is empty."
            description="Add a few pieces and come back to check out."
            className="px-4 py-10"
            action={
              <Link href="/shop" className={buttonVariants({ variant: "outline", size: "md" })}>
                Continue Shopping
              </Link>
            }
          />
        ) : (
          <form noValidate onSubmit={handleSubmit} className="space-y-6">
            {blocked ? (
              <div
                role="alert"
                className="flex flex-wrap items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-[13px] text-amber-950"
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
                    {availability.unavailableCount === 1 ? "it" : "them"} before ordering.
                  </p>
                </div>
                <Link
                  href="/cart"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-canvas")}
                >
                  Go to cart
                </Link>
              </div>
            ) : null}

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full Name <span aria-hidden className="text-red-600">*</span>
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  placeholder="Ram Sharma"
                  required
                  invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                  value={details.fullName}
                  onChange={(event) => setDetails({ ...details, fullName: event.target.value })}
                />
                <FieldError id="fullName-error" message={errors.fullName} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span aria-hidden className="text-red-600">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="98XXXXXXXX"
                  required
                  invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  value={details.phone}
                  onChange={(event) => setDetails({ ...details, phone: event.target.value })}
                />
                <FieldError id="phone-error" message={errors.phone} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Delivery Address <span aria-hidden className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  autoComplete="street-address"
                  placeholder="Birtamode, Jhapa — near the main gate"
                  required
                  invalid={Boolean(errors.address)}
                  aria-describedby={errors.address ? "address-error" : undefined}
                  value={details.address}
                  onChange={(event) => setDetails({ ...details, address: event.target.value })}
                />
                <FieldError id="address-error" message={errors.address} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Additional Note</Label>
                <Textarea
                  id="note"
                  name="note"
                  placeholder="Please deliver in the evening."
                  aria-describedby={errors.note ? "note-error" : "note-hint"}
                  value={details.note}
                  onChange={(event) => setDetails({ ...details, note: event.target.value })}
                />
                {errors.note ? (
                  <FieldError id="note-error" message={errors.note} />
                ) : (
                  <p id="note-hint" className="text-[13px] text-muted">
                    Optional — delivery preferences, landmarks, gift notes.
                  </p>
                )}
              </div>
            </div>

            {formError ? (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-[13px] font-medium text-red-700"
              >
                {formError}
              </p>
            ) : null}

            {blockedLink ? (
              <div role="alert" className="rounded-lg border border-line bg-surface p-4 text-sm">
                <p className="font-medium text-ink">
                  We could not open WhatsApp automatically.
                </p>
                <p className="mt-1 text-muted">
                  Tap the button below to open WhatsApp with your order message.
                </p>
                <a
                  href={blockedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => {
                    event.preventDefault();
                    openWhatsapp(blockedLink);
                  }}
                  className={cn(buttonVariants({ variant: "primary", size: "md" }), "mt-3")}
                >
                  Open WhatsApp
                </a>
              </div>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              disabled={pending || blocked}
            >
              {pending ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden />
                  Opening WhatsApp…
                </>
              ) : (
                <>
                  <MessageCircle aria-hidden />
                  Order via WhatsApp
                </>
              )}
            </Button>

            <p className="text-[13px] text-muted">
              No payment is taken on this website. Your order is sent as a WhatsApp message — press
              Send there and we confirm it with you directly.
            </p>
          </form>
        )}
      </div>

      <aside className="mt-10 rounded-xl border border-line bg-surface p-5 lg:mt-0 lg:sticky lg:top-24">
        <h2 className="font-display text-lg">Order Summary</h2>

        {!hydrated ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Your cart is empty."
              description="Add a few pieces and come back to check out."
              className="px-4 py-10"
              action={
                <Link href="/shop" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Continue Shopping
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <ul className="mt-4 space-y-3">
              {items.map((item) => {
                const unavailable = availability.statusOf(item.productId) === "out_of_stock";

                return (
                  <li key={item.key} className="flex gap-3">
                    <div
                      className={cn(
                        "relative size-14 shrink-0 overflow-hidden rounded-md bg-canvas",
                        unavailable && "opacity-60",
                      )}
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 text-[13px]">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-muted">
                        {item.quantity} × {formatPrice(item.price, settings.currency_symbol)}
                        {item.size ? ` · ${item.size}` : ""}
                        {item.color ? ` · ${item.color}` : ""}
                      </p>
                      {unavailable ? (
                        <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                          <AlertTriangle className="size-3" aria-hidden />
                          Out of stock
                        </p>
                      ) : null}
                    </div>
                    <p className="text-[13px] font-semibold">
                      {formatPrice(item.price * item.quantity, settings.currency_symbol)}
                    </p>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-sm font-medium">Total</span>
              <span className="font-display text-xl font-semibold">
                {formatPrice(cartSubtotal(items), settings.currency_symbol)}
              </span>
            </div>
            <p className="mt-3 text-[12px] text-muted">
              Delivery is arranged on WhatsApp after we confirm your address.
            </p>
          </>
        )}
      </aside>
    </div>
  );
}
