import { CategoryManager } from "@/components/admin/category-manager";
import { getAdminCategories, getCategoryProductCounts } from "@/lib/data/admin";

export default async function AdminCategoriesPage() {
  const [categories, counts] = await Promise.all([getAdminCategories(), getCategoryProductCounts()]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-3xl">Categories</h1>
        <p className="text-[15px] text-muted">
          Categories drive the storefront navigation, homepage grid and shop filters.
        </p>
      </header>

      <CategoryManager categories={categories} counts={counts} />
    </div>
  );
}
