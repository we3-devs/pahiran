"use client";

import { ExternalLink, LayoutDashboard, LogOut, Menu, Package, Settings, Tags, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/admin", Icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", Icon: Package },
  { label: "Categories", href: "/admin/categories", Icon: Tags },
  { label: "Store Settings", href: "/admin/settings", Icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {NAV.map(({ label, href, Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(pathname, href)
              ? "bg-ink text-canvas"
              : "text-ink hover:bg-surface",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-ink"
      >
        <LogOut className="size-4" aria-hidden />
        Sign out
      </button>
    </form>
  );
}

export function AdminSidebar({
  storeName,
  email,
}: {
  storeName: string;
  email: string | null;
}) {
  const pathname = usePathname();
  // Closes the drawer on navigation without syncing state inside an effect.
  const [openedOn, setOpenedOn] = React.useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = (value: boolean) => setOpenedOn(value ? pathname : null);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-line bg-canvas lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-line px-5">
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold">{storeName}</p>
            <p className="text-[11px] tracking-[0.14em] uppercase text-muted">Admin</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <NavList pathname={pathname} />
        </div>

        <div className="border-t border-line p-3">
          <Link
            href="/"
            target="_blank"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <ExternalLink className="size-4" aria-hidden />
            View store
          </Link>
          <SignOutButton />
          {email ? <p className="truncate px-3 pt-2 text-[11px] text-muted">{email}</p> : null}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-canvas px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open admin menu"
            className="inline-flex size-10 items-center justify-center rounded-full hover:bg-surface"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <span className="font-display text-base font-semibold">{storeName}</span>
        </div>
        <Link href="/" target="_blank" className="text-[13px] text-muted">
          View store
        </Link>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="animate-fade-in absolute inset-y-0 left-0 flex w-[80%] max-w-xs flex-col bg-canvas p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close admin menu"
                className="inline-flex size-9 items-center justify-center rounded-full hover:bg-surface"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-line pt-2">
              <SignOutButton />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
