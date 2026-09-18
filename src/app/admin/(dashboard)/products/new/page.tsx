import Link from "next/link";

import { ProductForm } from "@/components/admin/product-form";
import { getAdminCategories } from "@/lib/data/admin";

export default async function AdminNewProductPage() {
  const categories = await getAdminCategories();

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
          <span className="text-ink">New product</span>
        </nav>
        <h1 className="font-display text-3xl">Add Product</h1>
        <p className="text-[15px] text-muted">
          Active products appear on the storefront immediately after saving.
        </p>
      </header>

      <ProductForm categories={categories} />
    </div>
  );
}
