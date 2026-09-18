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
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-11 w-full max-w-xs" />
        <Skeleton className="h-11 w-32 sm:ml-auto" />
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[210px_1fr] lg:items-start lg:gap-10">
        <div className="hidden space-y-4 lg:block">
          {[0, 1, 2].map((group) => (
            <div key={group} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </Container>
  );
}
