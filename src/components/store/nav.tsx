"use client";

import { Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cartCount, useCartStore } from "@/lib/cart/store";
import type { Category } from "@/lib/types";
import { useIsHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

export type NavCategory = Pick<Category, "id" | "name" | "slug">;

/** Cart count is only known after rehydration, so it renders client-side only. */
export function useCartCount() {
  const items = useCartStore((state) => state.items);
  const hydrated = useIsHydrated();

  return hydrated ? cartCount(items) : 0;
}

function navItems(categories: NavCategory[]) {
  return [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...categories.slice(0, 5).map((category) => ({
      label: category.name,
      href: `/category/${category.slug}`,
    })),
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
      {navItems(categories).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className={cn(
            "text-[13px] font-medium tracking-wide uppercase transition-colors",
            isActive(pathname, item.href) ? "text-brand" : "text-ink hover:text-brand",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function CartLink({ compact = false }: { compact?: boolean }) {
  const count = useCartCount();

  return (
    <Link
      href="/cart"
      className={cn(
        "relative inline-flex items-center gap-2 rounded-full transition-colors hover:text-brand",
        compact ? "p-2" : "px-3 py-2 text-sm font-medium",
      )}
    >
      <ShoppingBag className="size-5" aria-hidden />
      {!compact ? <span className="hidden sm:inline">Cart</span> : null}
      {count > 0 ? (
        <span
          aria-label={`${count} items in cart`}
          className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-ink"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

export function MobileNav({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();
  // Tracking the path the menu was opened on closes it automatically after a
  // navigation, without syncing state inside an effect.
  const [openedOn, setOpenedOn] = React.useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = (value: boolean) => setOpenedOn(value ? pathname : null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    // Freeze the page behind the drawer so it cannot scroll underneath.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the drawer for keyboard and screen-reader users.
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenedOn(null);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 backdrop-blur-xs" onClick={() => setOpen(false)} aria-hidden />
          <div
            id="mobile-nav"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            tabIndex={-1}
            className="animate-fade-in absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-canvas outline-none"
          >
            <div className="border-b border-black/70 flex items-center justify-between p-5 pb-1">
              <span className="text-md font-semibold tracking-[0.2em] uppercase text-muted">
                Menu
              </span>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                aria-label="Close menu"
                className="inline-flex size-10 items-center justify-center rounded-full hover:bg-surface"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <nav aria-label="Mobile" className="flex bg-canvas flex-col">
              {navItems(categories).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    isActive(pathname, item.href) ? "page" : undefined
                  }
                  className={cn(
                    "border-b border-line px-5 py-4 text-base font-medium",
                    isActive(pathname, item.href)
                      ? "text-brand"
                      : "text-ink",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
{/* 
            <div className="mt-auto pt-6">
              <CartLink />
            </div> */}
          </div>
        </div>
      ) : null}
    </>
  );
}
