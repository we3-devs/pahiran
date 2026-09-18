import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/misc";

export default function StoreNotFound() {
  return (
    <Container className="flex min-h-[55vh] flex-col items-center justify-center gap-5 py-20 text-center">
      <p className="text-xs font-semibold tracking-[0.24em] uppercase text-muted">404</p>
      <h1 className="font-display text-3xl sm:text-4xl">We couldn’t find that page.</h1>
      <p className="max-w-md text-[15px] text-muted">
        The product or category you were looking for may have been moved or is no longer available.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className={buttonVariants({ variant: "dark", size: "lg" })}>
          Browse the shop
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Back home
        </Link>
      </div>
    </Container>
  );
}
