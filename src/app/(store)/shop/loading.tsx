import { ProductCardSkeleton } from "@/components/store/product-card";
import { Container, Skeleton } from "@/components/ui/misc";

/**
 * Only /shop streams a skeleton: product and category pages must be able to
 * answer with a real 404 status, which requires rendering before the first
 * byte is flushed.
 */
export default function ShopLoading() {
  return (
    <Container className="py-10 sm:py-14">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-6 h-10 w-64" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <Skeleton className="mt-8 h-11 w-full max-w-xs" />

      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </Container>
  );
}
