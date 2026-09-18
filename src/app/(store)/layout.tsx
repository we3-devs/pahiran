import { SiteFooter } from "@/components/store/footer";
import { SiteHeader } from "@/components/store/header";
import { ToastProvider } from "@/components/ui/toast";

/** Incremental static regeneration for the whole storefront (5 minutes).
 *  Admin edits also call `revalidatePath`, so changes appear immediately. */
export const revalidate = 300;

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <a
        href="#main"
        className="sr-only rounded-md bg-ink px-4 py-2 text-canvas focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100]"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </ToastProvider>
  );
}
