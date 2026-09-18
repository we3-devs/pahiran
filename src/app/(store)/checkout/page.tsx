import type { Metadata } from "next";
import Link from "next/link";

import { CheckoutForm } from "@/components/store/checkout-form";
import { Container } from "@/components/ui/misc";
import { getStoreSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Enter your delivery details and send your order on WhatsApp.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const settings = await getStoreSettings();

  return (
    <Container className="py-10 sm:py-14">
      <header className="mb-8 space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl">Checkout</h1>
        <p className="max-w-2xl text-[15px] text-muted">
          Fill in your details and send the order to {settings.store_name} on WhatsApp. We confirm
          every order personally before it ships.
        </p>
        <p className="text-[13px] text-muted">
          Not ready yet?{" "}
          <Link href="/cart" className="underline underline-offset-4 hover:text-brand">
            Back to cart
          </Link>
        </p>
      </header>

      <CheckoutForm settings={settings} />
    </Container>
  );
}
