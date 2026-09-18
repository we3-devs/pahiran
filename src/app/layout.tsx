import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import * as React from "react";

import { getStoreSettings } from "@/lib/data/settings";
import { SITE_URL } from "@/lib/env";
import { normalizeHexColor, readableTextColor } from "@/lib/theme";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const title = settings.seo_title ?? settings.store_name;
  const description =
    settings.seo_description ?? settings.description ?? settings.tagline ?? undefined;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${settings.store_name}` },
    description,
    applicationName: settings.store_name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: SITE_URL,
      siteName: settings.store_name,
      title,
      description,
      images: settings.hero_image ? [settings.hero_image] : undefined,
    },
    twitter: {
      card: settings.hero_image ? "summary_large_image" : "summary",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();
  const brand = normalizeHexColor(settings.brand_color);

  return (
    <html
      lang="en"
      className={`${geist.variable} ${display.variable} h-full antialiased`}
      style={
        {
          "--brand": brand,
          "--brand-ink": readableTextColor(brand),
        } as React.CSSProperties
      }
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
