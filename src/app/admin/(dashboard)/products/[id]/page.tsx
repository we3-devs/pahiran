import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { getAdminCategories, getAdminProduct } from "@/lib/data/admin";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getAdminProduct(id), getAdminCategories()]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
          <Link href="/admin/products" className="hover:text-brand">
            Products
          </Link>
          <span aria-hidden className="px-1.5">
            /
          </span>
          <span className="text-ink">Edit</span>
        </nav>
        <h1 className="font-display text-3xl">Edit Product</h1>
        <p className="text-[15px] text-muted">
          Changes are live on the storefront as soon as you save.
        </p>
      </header>

      <ProductForm categories={categories} product={product} />
    </div>
  );
}
