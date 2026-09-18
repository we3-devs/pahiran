import { Package, Plus, Settings, Sparkles, Tags } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getDashboardStats } from "@/lib/data/admin";
import { getStoreSettings } from "@/lib/data/settings";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [stats, settings] = await Promise.all([getDashboardStats(), getStoreSettings()]);

  const cards = [
    { label: "Products", value: stats.products, href: "/admin/products" },
    { label: "Categories", value: stats.categories, href: "/admin/categories" },
    { label: "Active products", value: stats.active, href: "/admin/products?status=active" },
    { label: "Featured products", value: stats.featured, href: "/admin/products?status=featured" },
  ];

  const checklist = [
    {
      label: "Add your WhatsApp number",
      done: Boolean(settings.whatsapp),
      href: "/admin/settings#store",
      hint: "Orders are sent to this number.",
    },
    {
      label: "Upload a store logo",
      done: Boolean(settings.logo),
      href: "/admin/settings#store",
      hint: "Otherwise the store name is shown as text.",
    },
    {
      label: "Set up at least one category",
      done: stats.categories > 0,
      href: "/admin/categories",
      hint: "Categories build the navigation and homepage grid.",
    },
    {
      label: "Add your first products",
      done: stats.products > 0,
      href: "/admin/products/new",
      hint: "Products appear on the storefront as soon as they are active.",
    },
    {
      label: "Add a hero image",
      done: Boolean(settings.hero_image),
      href: "/admin/settings#hero",
      hint: "The homepage looks best with one strong photo.",
    },
  ].filter((item) => !item.done);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="text-[15px] text-muted">
          Manage the products, categories and content of {settings.store_name}.
        </p>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-line p-5">
            <dt className="text-[13px] text-muted">{card.label}</dt>
            <dd className="mt-1 flex items-baseline justify-between gap-2">
              <span className="font-display text-3xl font-semibold">{card.value}</span>
              <Link
                href={card.href}
                className="text-[13px] font-medium underline underline-offset-4 hover:text-brand"
              >
                View
              </Link>
            </dd>
          </div>
        ))}
      </dl>

      <section className="space-y-4">
        <h2 className="font-display text-xl">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/products/new" className={buttonVariants({ variant: "dark", size: "lg" })}>
            <Plus aria-hidden />
            Add product
          </Link>
          <Link
            href="/admin/products"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <Package aria-hidden />
            Manage products
          </Link>
          <Link
            href="/admin/categories"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <Tags aria-hidden />
            Manage categories
          </Link>
          <Link
            href="/admin/settings"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <Settings aria-hidden />
            Store settings
          </Link>
        </div>
      </section>

      {checklist.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl">Finish setting up</h2>
          <ul className="divide-y divide-line border-y border-line">
            {checklist.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-4 py-4 transition-colors hover:text-brand"
                >
                  <Sparkles className="size-4 shrink-0 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium">{item.label}</span>
                    <span className="block text-[13px] text-muted">{item.hint}</span>
                  </span>
                  <span className="text-[13px] text-muted">Fix</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className={cn("rounded-xl border border-line bg-surface p-5 text-sm")}>
          Everything looks set up. Add products any time from the Products page.
        </p>
      )}
    </div>
  );
}
