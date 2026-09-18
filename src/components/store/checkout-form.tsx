"use client";

import { MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { cartSubtotal, useCartStore } from "@/lib/cart/store";
import { formatPrice } from "@/lib/format";
import type { CheckoutDetails, StoreSettings } from "@/lib/types";
import { useIsHydrated } from "@/lib/use-hydrated";
import { hasErrors, validateCheckout, type FieldErrors } from "@/lib/validation";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const EMPTY_DETAILS: CheckoutDetails = { fullName: "", phone: "", address: "", note: "" };

export function CheckoutForm({ settings }: { settings: StoreSettings }) {
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const hydrated = useIsHydrated();
  const [details, setDetails] = React.useState<CheckoutDetails>(EMPTY_DETAILS);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [submittedLink, setSubmittedLink] = React.useState<string | null>(null);
  const [blockedLink, setBlockedLink] = React.useState<string | null>(null);

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
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const nextErrors = validateCheckout(details);
              setErrors(nextErrors);
              if (hasErrors(nextErrors)) {
                document.getElementById(Object.keys(nextErrors)[0])?.focus();
                return;
              }

              const link = buildWhatsappLink(items, details, settings);
              if (!link) {
                setErrors({
                  phone:
                    "The store has not configured a WhatsApp number yet. Please contact us another way.",
                });
                return;
              }

              openWhatsapp(link);
            }}
            className="space-y-6"
          >
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

            {blockedLink ? (
              <div role="alert" className="rounded-lg border border-line bg-surface p-4 text-sm">
                <p className="font-medium text-ink">WhatsApp did not open automatically.</p>
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

            <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
              <MessageCircle aria-hidden />
              Order via WhatsApp
            </Button>

            <p className="text-[13px] text-muted">
              No payment is taken on this website. Your order is sent as a WhatsApp message and we
              confirm it with you directly.
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
              {items.map((item) => (
                <li key={item.key} className="flex gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-canvas">
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
                  </div>
                  <p className="text-[13px] font-semibold">
                    {formatPrice(item.price * item.quantity, settings.currency_symbol)}
                  </p>
                </li>
              ))}
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
