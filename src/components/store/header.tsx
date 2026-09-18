import Image from "next/image";
import Link from "next/link";

import { CartLink, DesktopNav, MobileNav } from "@/components/store/nav";
import { SearchDialog, SearchTrigger } from "@/components/store/search-dialog";
import { Container } from "@/components/ui/misc";
import { getCategories } from "@/lib/data/categories";
import { getStoreSettings } from "@/lib/data/settings";

export async function SiteHeader() {
  const [settings, categories] = await Promise.all([getStoreSettings(), getCategories()]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/95 backdrop-blur-sm">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={settings.store_name}>
          {settings.logo ? (
            <Image
              src={settings.logo}
              alt={settings.store_name}
              width={160}
              height={40}
              className="h-9 max-w-[42vw] w-auto object-contain"
              preload
            />
          ) : (
            <span className="font-display text-xl font-semibold tracking-tight">
              {settings.store_name}
            </span>
          )}
        </Link>

        <DesktopNav categories={categories} />

        <div className="flex items-center gap-0.5 sm:gap-1">
          <SearchTrigger />
          <CartLink />
          <MobileNav categories={categories} />
        </div>
      </Container>

      <SearchDialog categories={categories} />
    </header>
  );
}
