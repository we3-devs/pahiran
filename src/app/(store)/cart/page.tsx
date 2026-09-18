import type { Metadata } from "next";

import { CartView } from "@/components/store/cart-view";
import { Container } from "@/components/ui/misc";
import { getStoreSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review the pieces in your cart before checking out on WhatsApp.",
  robots: { index: false, follow: true },
};

export default async function CartPage() {
  const settings = await getStoreSettings();

  return (
    <Container className="py-10 sm:py-14">
      <header className="mb-8 space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl">Your Cart</h1>
        <p className="text-[15px] text-muted">
          Quantities and options can be changed here at any time.
        </p>
      </header>

      <CartView currencySymbol={settings.currency_symbol} />
    </Container>
  );
}
