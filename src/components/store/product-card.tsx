import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { discountPercent, formatPrice, isNewProduct } from "@/lib/format";
import type { ProductWithCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Deliberately sparse: image, name, price, one action.
 * Products with options route to the detail page so the customer can pick a
 * size/colour instead of adding an ambiguous variant.
 */
export function ProductCard({
  product,
  currencySymbol = "Rs.",
  priority = false,
  className,
}: {
  product: ProductWithCategory;
  currencySymbol?: string;
  priority?: boolean;
  className?: string;
}) {
  const [primary, secondary] = product.images ?? [];
  const requiresOptions = (product.sizes?.length ?? 0) > 0 || (product.colors?.length ?? 0) > 0;
  const discount = discountPercent(product.price, product.compare_at_price);
  const isNew = isNewProduct(product.created_at);

  return (
    <article className={cn("group flex flex-col", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-surface">
        {primary ? (
          <Image
            src={primary}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 50vw"
            className={cn(
              "object-cover transition-all duration-500",
              secondary && "group-hover:opacity-0",
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted">
            No image
          </div>
        )}

        {secondary ? (
          <Image
            src={secondary}
            alt=""
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        ) : null}

        {/* One overlay link keeps the whole image clickable. */}
        <Link href={`/product/${product.slug}`} className="absolute inset-0 z-10">
          <span className="sr-only">View {product.name}</span>
        </Link>

        <div className="pointer-events-none absolute top-3 left-3 z-20 flex flex-col items-start gap-1.5">
          {discount !== null ? <Badge tone="sale">-{discount}%</Badge> : null}
          {isNew ? <Badge tone="dark">New</Badge> : null}
          {product.featured && discount === null && !isNew ? (
            <Badge tone="brand">Featured</Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-3.5 flex flex-1 flex-col gap-1">
        <h3 className="text-[15px] leading-snug font-medium">
          <Link href={`/product/${product.slug}`} className="hover:text-brand">
            {product.name}
          </Link>
        </h3>

        {product.category ? (
          <p className="text-xs tracking-wide uppercase text-muted">{product.category.name}</p>
        ) : null}

        <p className="mt-1 flex items-center gap-2 text-[15px]">
          <span className="font-semibold">{formatPrice(product.price, currencySymbol)}</span>
          {discount !== null && product.compare_at_price ? (
            <span className="text-sm text-muted line-through">
              {formatPrice(product.compare_at_price, currencySymbol)}
            </span>
          ) : null}
        </p>

        <div className="mt-3">
          {requiresOptions ? (
            <Link
              href={`/product/${product.slug}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
            >
              Choose options
            </Link>
          ) : (
            <AddToCartButton
              variant="outline"
              buttonSize="sm"
              className="w-full"
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                image: primary ?? null,
              }}
            />
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-[4/5] animate-pulse rounded-lg bg-surface" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
      <div className="h-4 w-1/3 animate-pulse rounded bg-surface" />
      <div className="h-9 w-full animate-pulse rounded-full bg-surface" />
    </div>
  );
}
