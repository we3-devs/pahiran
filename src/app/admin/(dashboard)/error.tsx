"use client";

import { TriangleAlert } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
      <TriangleAlert className="mx-auto size-6 text-amber-600" aria-hidden />
      <h1 className="font-display text-2xl">Something went wrong</h1>
      <p className="text-[15px] text-muted">
        We could not load this admin page. Check your connection, then try again.
      </p>
      <Button variant="dark" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
