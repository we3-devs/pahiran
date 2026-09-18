import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AdminLoginForm } from "@/components/admin/login-form";
import { SupabaseSetupNotice } from "@/components/admin/setup-notice";
import { Skeleton } from "@/components/ui/misc";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-canvas">
        <SupabaseSetupNotice />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-line bg-canvas p-6 sm:p-8">
          <header className="mb-6 space-y-1.5">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted">
              Admin
            </p>
            <h1 className="font-display text-2xl">Sign in to manage the store</h1>
          </header>

          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <AdminLoginForm />
          </Suspense>
        </div>

        <p className="mt-5 text-center text-[13px] text-muted">
          <Link href="/" className="underline underline-offset-4 hover:text-ink">
            Back to the store
          </Link>
        </p>
      </div>
    </div>
  );
}
