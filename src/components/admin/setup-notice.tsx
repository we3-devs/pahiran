import { TriangleAlert } from "lucide-react";

import { Container } from "@/components/ui/misc";

/** Shown instead of the admin UI until Supabase credentials exist. */
export function SupabaseSetupNotice() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center gap-3">
          <TriangleAlert className="size-5 text-amber-600" aria-hidden />
          <h1 className="font-display text-2xl">Connect Supabase to use the admin panel</h1>
        </div>

        <p className="text-[15px] text-muted">
          The storefront is currently running on the bundled demo catalogue. Add your Supabase
          project keys and run the setup SQL to manage real products and store content.
        </p>

        <ol className="list-decimal space-y-3 pl-5 text-sm text-ink">
          <li>
            Create a project at{" "}
            <a
              className="underline underline-offset-4"
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
            >
              supabase.com/dashboard
            </a>
            .
          </li>
          <li>
            Copy <code className="rounded bg-surface px-1.5 py-0.5">.env.example</code> to{" "}
            <code className="rounded bg-surface px-1.5 py-0.5">.env.local</code> and fill in{" "}
            <code className="rounded bg-surface px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-surface px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </li>
          <li>
            Run <code className="rounded bg-surface px-1.5 py-0.5">supabase/schema.sql</code> (then
            optionally <code className="rounded bg-surface px-1.5 py-0.5">supabase/seed.sql</code>) in
            the SQL editor.
          </li>
          <li>
            Create an admin user under Authentication → Users, then restart the dev server and sign
            in at <code className="rounded bg-surface px-1.5 py-0.5">/admin/login</code>.
          </li>
        </ol>

        <p className="text-[13px] text-muted">
          Full instructions, including storage buckets and RLS checks, are in the project README.
        </p>
      </div>
    </Container>
  );
}
