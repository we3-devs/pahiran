import Link from "next/link";

import { ProductCard } from "@/components/store/product-card";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import type { ProductWithCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  currencySymbol = "Rs.",
  emptyTitle = "No products found.",
  emptyDescription = "Try another category or browse the full collection.",
  className,
  priority = false,
}: {
  products: ProductWithCategory[];
  currencySymbol?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  /** Only set this for grids that render above the fold. */
  priority?: boolean;
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          <Link href="/shop" className={buttonVariants({ variant: "outline" })}>
            Browse all products
          </Link>
        }
      />
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          currencySymbol={currencySymbol}
          priority={priority}
        />
      ))}
    </div>
  );
}
