import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="text-xs font-semibold tracking-[0.24em] uppercase text-muted">404</p>
      <h1 className="font-display text-3xl sm:text-4xl">This page doesn’t exist.</h1>
      <p className="max-w-md text-[15px] text-muted">
        Check the address, or head back to the store and keep browsing.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-full bg-ink px-7 text-sm font-medium text-canvas"
        >
          Back home
        </Link>
        <Link
          href="/shop"
          className="inline-flex h-12 items-center rounded-full border border-line px-7 text-sm font-medium"
        >
          Shop
        </Link>
      </div>
    </div>
  );
}
