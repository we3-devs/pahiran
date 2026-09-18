import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ProductFilters } from "@/components/admin/product-filters";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { Pagination } from "@/components/store/pagination";
import { buttonVariants } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/misc";
import { getAdminCategories, getAdminProducts } from "@/lib/data/admin";
import { formatPrice } from "@/lib/format";

type SearchParams = { q?: string; status?: string; category?: string; page?: string };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status =
    params.status === "active" || params.status === "draft" || params.status === "featured"
      ? params.status
      : "all";

  const [categories, result] = await Promise.all([
    getAdminCategories(),
    getAdminProducts({
      page,
      search: params.q?.trim() ?? "",
      status,
      categoryId: params.category ?? "",
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-3xl">Products</h1>
          <p className="text-[15px] text-muted">
            {result.total} {result.total === 1 ? "product" : "products"} in the catalogue.
          </p>
        </div>
        <Link href="/admin/products/new" className={buttonVariants({ variant: "dark", size: "md" })}>
          <Plus aria-hidden />
          Add Product
        </Link>
      </header>

      <ProductFilters
        key={`${params.q ?? ""}-${status}-${params.category ?? ""}`}
        categories={categories}
        search={params.q ?? ""}
        status={status}
        categoryId={params.category ?? ""}
      />

      {result.items.length === 0 ? (
        <EmptyState
          title="No products found."
          description="Adjust the filters, or add the first product to your catalogue."
          action={
            <Link href="/admin/products/new" className={buttonVariants({ variant: "dark" })}>
              <Plus aria-hidden />
              Add Product
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {result.items.map((product) => (
            <li key={product.id} className="flex flex-wrap items-center gap-4 py-4">
              <div className="relative h-[72px] w-14 shrink-0 overflow-hidden rounded-md bg-surface">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-48 flex-1">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="text-[15px] font-medium hover:text-brand"
                >
                  {product.name}
                </Link>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
                  <span>{product.category?.name ?? "No category"}</span>
                  <span aria-hidden>·</span>
                  <span className="font-medium text-ink">
                    {formatPrice(product.price)}
                  </span>
                  {product.images?.length > 1 ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>{product.images.length} images</span>
                    </>
                  ) : null}
                </p>
              </div>

              {!product.active ? <Badge tone="outline">Hidden</Badge> : null}
              {product.featured ? <Badge tone="brand">Featured</Badge> : null}

              <ProductRowActions
                productId={product.id}
                productName={product.name}
                active={product.active}
                featured={product.featured}
              />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/admin/products"
        params={{
          q: params.q || undefined,
          status: status === "all" ? undefined : status,
          category: params.category || undefined,
        }}
      />
    </div>
  );
}
