import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/sidebar";
import { SupabaseSetupNotice } from "@/components/admin/setup-notice";
import { ToastProvider } from "@/components/ui/toast";
import { getStoreSettings } from "@/lib/data/settings";
import { isSupabaseConfigured } from "@/lib/env";
import { getAdminUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** The admin panel always reads the live database and the current session. */
export const dynamic = "force-dynamic";

/**
 * Second line of defence behind `proxy.ts`: the proxy redirects anonymous
 * visitors, this also guarantees no admin markup is ever rendered without a
 * session (and RLS backs both).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) return <SupabaseSetupNotice />;

  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const settings = await getStoreSettings();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-canvas lg:flex">
        <AdminSidebar storeName={settings.store_name} email={user.email ?? null} />
        <div className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">{children}</div>
        </div>
      </div>
    </ToastProvider>
  );
}
