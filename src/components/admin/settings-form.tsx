"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { SingleImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { saveSettings, type SettingsFormValues } from "@/lib/actions/settings";
import { BUCKETS } from "@/lib/env";
import type { StoreSettings } from "@/lib/types";
import { hasErrors, type FieldErrors } from "@/lib/validation";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "store", label: "Store" },
  { id: "appearance", label: "Appearance" },
  { id: "hero", label: "Hero" },
  { id: "homepage", label: "Homepage" },
  { id: "contact", label: "Contact" },
  { id: "footer", label: "Footer" },
  { id: "seo", label: "SEO" },
];

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-xl border border-line p-5 sm:p-6">
      <header className="mb-5">
        <h2 className="font-display text-xl">{title}</h2>
        {description ? <p className="mt-1 text-[13px] text-muted">{description}</p> : null}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-line p-3.5">
      <span className="text-sm">
        {label}
        {help ? <span className="mt-0.5 block text-[12px] text-muted">{help}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </label>
  );
}

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = React.useState<SettingsFormValues>(() => ({
    ...settings,
    featured_count: String(settings.featured_count ?? 4),
  }));
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const set = <K extends keyof SettingsFormValues>(key: K, value: SettingsFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const result = await saveSettings(form);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        toast(result.error, { variant: "error" });
        return;
      }
      toast("Store settings updated", {
        description: "The storefront now shows your changes.",
      });
      router.refresh();
    });
  };

  const errorFor = (key: keyof SettingsFormValues) => errors[key as string];

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <nav aria-label="Settings sections" className="no-scrollbar flex gap-2 overflow-x-auto">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors hover:border-ink/40"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <Section
        id="store"
        title="Store information"
        description="Used across the header, footer, contact page and every WhatsApp order."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="store_name">Store name *</Label>
            <Input
              id="store_name"
              value={form.store_name}
              onChange={(event) => set("store_name", event.target.value)}
              invalid={Boolean(errorFor("store_name"))}
            />
            <FieldError id="store_name-error" message={errorFor("store_name")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={form.tagline ?? ""}
              onChange={(event) => set("tagline", event.target.value)}
              placeholder="Clothing for everyday"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone ?? ""}
              onChange={(event) => set("phone", event.target.value)}
              placeholder="+977 98-0000-0000"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Store description</Label>
            <Textarea
              id="description"
              value={form.description ?? ""}
              onChange={(event) => set("description", event.target.value)}
              placeholder="A short introduction to the store."
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address ?? ""}
              onChange={(event) => set("address", event.target.value)}
              placeholder="Main Road, Birtamode, Jhapa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email ?? ""}
              onChange={(event) => set("email", event.target.value)}
              invalid={Boolean(errorFor("email"))}
            />
            <FieldError id="email-error" message={errorFor("email")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp number *</Label>
            <Input
              id="whatsapp"
              value={form.whatsapp ?? ""}
              onChange={(event) => set("whatsapp", event.target.value)}
              placeholder="9800000000"
              invalid={Boolean(errorFor("whatsapp"))}
            />
            {errorFor("whatsapp") ? (
              <FieldError id="whatsapp-error" message={errorFor("whatsapp")} />
            ) : (
              <p className="text-[12px] text-muted">
                Orders open a chat with this number. Spaces and dashes are fine.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp_country_code">WhatsApp country code</Label>
            <Input
              id="whatsapp_country_code"
              inputMode="numeric"
              value={form.whatsapp_country_code}
              onChange={(event) => set("whatsapp_country_code", event.target.value)}
              placeholder="977"
              invalid={Boolean(errorFor("whatsapp_country_code"))}
            />
            <FieldError
              id="whatsapp_country_code-error"
              message={errorFor("whatsapp_country_code")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_hours">Business hours</Label>
            <Input
              id="business_hours"
              value={form.business_hours ?? ""}
              onChange={(event) => set("business_hours", event.target.value)}
              placeholder="Sunday – Friday, 10:00 – 19:00"
            />
          </div>
        </div>

        <SingleImageUploader
          bucket={BUCKETS.assets}
          folderPrefix="store"
          label="Store logo"
          value={form.logo}
          onChange={(url) => set("logo", url)}
          help="Optional. Without a logo the store name is shown as text."
        />

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="currency_code">Currency code</Label>
            <Input
              id="currency_code"
              value={form.currency_code}
              onChange={(event) => set("currency_code", event.target.value)}
              placeholder="NPR"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency_symbol">Currency symbol</Label>
            <Input
              id="currency_symbol"
              value={form.currency_symbol}
              onChange={(event) => set("currency_symbol", event.target.value)}
              placeholder="Rs."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand_color">Brand colour</Label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="brand_color"
              type="color"
              value={form.brand_color || "#1c4b3c"}
              onChange={(event) => set("brand_color", event.target.value)}
              aria-label="Pick brand colour"
              className="size-11 cursor-pointer rounded-lg border border-line bg-canvas"
            />
            <Input
              value={form.brand_color}
              onChange={(event) => set("brand_color", event.target.value)}
              className="max-w-40"
              invalid={Boolean(errorFor("brand_color"))}
              aria-label="Brand colour hex value"
            />
            <span
              aria-hidden
              className="inline-flex h-11 items-center rounded-full bg-brand px-4 text-sm font-medium text-brand-ink"
            >
              Preview
            </span>
          </div>
          <FieldError id="brand_color-error" message={errorFor("brand_color")} />
        </div>
      </Section>

      <Section
        id="appearance"
        title="Social media"
        description="Only the links you fill in are shown on the site."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {(
            [
              ["facebook", "Facebook"],
              ["instagram", "Instagram"],
              ["tiktok", "TikTok"],
              ["youtube", "YouTube"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={(form[key] as string | null) ?? ""}
                onChange={(event) => set(key, event.target.value)}
                placeholder={`https://${key}.com/your-store`}
                invalid={Boolean(errorFor(key))}
              />
              <FieldError id={`${key}-error`} message={errorFor(key)} />
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="hero"
        title="Hero section"
        description="The first thing customers see on the homepage."
      >
        <Toggle
          label="Show hero section"
          help="Turn off to start the homepage with the category grid."
          checked={form.hero_enabled}
          onChange={(value) => set("hero_enabled", value)}
        />

        <div className="space-y-2">
          <Label htmlFor="hero_title">Main heading</Label>
          <Input
            id="hero_title"
            value={form.hero_title ?? ""}
            onChange={(event) => set("hero_title", event.target.value)}
            placeholder="Modern fashion for everyday confidence."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hero_description">Description</Label>
          <Textarea
            id="hero_description"
            value={form.hero_description ?? ""}
            onChange={(event) => set("hero_description", event.target.value)}
          />
        </div>

        <Toggle
          label="Show small label"
          checked={form.hero_show_label}
          onChange={(value) => set("hero_show_label", value)}
        />

        <div className="space-y-2">
          <Label htmlFor="hero_label">Small label</Label>
          <Input
            id="hero_label"
            value={form.hero_label ?? ""}
            onChange={(event) => set("hero_label", event.target.value)}
            placeholder="New Season 2026"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hero_primary_button_text">Primary button text</Label>
            <Input
              id="hero_primary_button_text"
              value={form.hero_primary_button_text ?? ""}
              onChange={(event) => set("hero_primary_button_text", event.target.value)}
              placeholder="Shop Collection"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero_primary_button_link">Primary button link</Label>
            <Input
              id="hero_primary_button_link"
              value={form.hero_primary_button_link ?? ""}
              onChange={(event) => set("hero_primary_button_link", event.target.value)}
              placeholder="/shop"
              invalid={Boolean(errorFor("hero_primary_button_link"))}
            />
            <FieldError
              id="hero_primary_button_link-error"
              message={errorFor("hero_primary_button_link")}
            />
          </div>
        </div>

        <Toggle
          label="Show secondary button"
          checked={form.hero_show_secondary_button}
          onChange={(value) => set("hero_show_secondary_button", value)}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hero_secondary_button_text">Secondary button text</Label>
            <Input
              id="hero_secondary_button_text"
              value={form.hero_secondary_button_text ?? ""}
              onChange={(event) => set("hero_secondary_button_text", event.target.value)}
              placeholder="Our Story"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero_secondary_button_link">Secondary button link</Label>
            <Input
              id="hero_secondary_button_link"
              value={form.hero_secondary_button_link ?? ""}
              onChange={(event) => set("hero_secondary_button_link", event.target.value)}
              placeholder="/about"
              invalid={Boolean(errorFor("hero_secondary_button_link"))}
            />
            <FieldError
              id="hero_secondary_button_link-error"
              message={errorFor("hero_secondary_button_link")}
            />
          </div>
        </div>

        <Toggle
          label="Show hero image"
          help="Hides the photo and lets the text run full width."
          checked={form.hero_show_image}
          onChange={(value) => set("hero_show_image", value)}
        />

        <SingleImageUploader
          bucket={BUCKETS.assets}
          folderPrefix="hero"
          label="Hero image"
          value={form.hero_image}
          onChange={(url) => set("hero_image", url)}
          help="Portrait or landscape both work — it is cropped to fit."
        />
      </Section>

      <Section id="homepage" title="Homepage sections">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="categories_heading">Category section heading</Label>
            <Input
              id="categories_heading"
              value={form.categories_heading}
              onChange={(event) => set("categories_heading", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categories_description">Category section description</Label>
            <Input
              id="categories_description"
              value={form.categories_description ?? ""}
              onChange={(event) => set("categories_description", event.target.value)}
            />
          </div>
        </div>

        <Toggle
          label="Show featured collection"
          checked={form.featured_enabled}
          onChange={(value) => set("featured_enabled", value)}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="featured_heading">Featured heading</Label>
            <Input
              id="featured_heading"
              value={form.featured_heading}
              onChange={(event) => set("featured_heading", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="featured_count">Number of products</Label>
            <Select
              id="featured_count"
              value={String(form.featured_count)}
              onChange={(event) => set("featured_count", event.target.value)}
              invalid={Boolean(errorFor("featured_count"))}
            >
              {[4, 8, 12].map((count) => (
                <option key={count} value={count}>
                  {count} products
                </option>
              ))}
            </Select>
            <FieldError id="featured_count-error" message={errorFor("featured_count")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="featured_description">Featured description</Label>
          <Input
            id="featured_description"
            value={form.featured_description ?? ""}
            onChange={(event) => set("featured_description", event.target.value)}
          />
        </div>

        <Toggle
          label="Show about section"
          checked={form.about_enabled}
          onChange={(value) => set("about_enabled", value)}
        />

        <div className="space-y-2">
          <Label htmlFor="about_heading">About heading</Label>
          <Input
            id="about_heading"
            value={form.about_heading ?? ""}
            onChange={(event) => set("about_heading", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="about_description">About description</Label>
          <Textarea
            id="about_description"
            value={form.about_description ?? ""}
            onChange={(event) => set("about_description", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="about_body">About page text</Label>
          <Textarea
            id="about_body"
            value={form.about_body ?? ""}
            onChange={(event) => set("about_body", event.target.value)}
            className="min-h-40"
            placeholder="Separate paragraphs with a blank line."
          />
        </div>

        <SingleImageUploader
          bucket={BUCKETS.assets}
          folderPrefix="about"
          label="About image"
          value={form.about_image}
          onChange={(url) => set("about_image", url)}
        />

        <Toggle
          label="Show promotional section"
          checked={form.promo_enabled}
          onChange={(value) => set("promo_enabled", value)}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="promo_heading">Promotion heading</Label>
            <Input
              id="promo_heading"
              value={form.promo_heading ?? ""}
              onChange={(event) => set("promo_heading", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promo_button_text">Promotion button text</Label>
            <Input
              id="promo_button_text"
              value={form.promo_button_text ?? ""}
              onChange={(event) => set("promo_button_text", event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="promo_text">Promotion text</Label>
          <Textarea
            id="promo_text"
            value={form.promo_text ?? ""}
            onChange={(event) => set("promo_text", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="promo_button_link">Promotion button link</Label>
          <Input
            id="promo_button_link"
            value={form.promo_button_link ?? ""}
            onChange={(event) => set("promo_button_link", event.target.value)}
            placeholder="/shop"
            invalid={Boolean(errorFor("promo_button_link"))}
          />
          <FieldError id="promo_button_link-error" message={errorFor("promo_button_link")} />
        </div>

        <SingleImageUploader
          bucket={BUCKETS.assets}
          folderPrefix="promo"
          label="Promotion image"
          value={form.promo_image}
          onChange={(url) => set("promo_image", url)}
        />
      </Section>

      <Section id="contact" title="Contact section">
        <div className="space-y-2">
          <Label htmlFor="contact_title">Heading</Label>
          <Input
            id="contact_title"
            value={form.contact_title}
            onChange={(event) => set("contact_title", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_description">Description</Label>
          <Textarea
            id="contact_description"
            value={form.contact_description ?? ""}
            onChange={(event) => set("contact_description", event.target.value)}
          />
        </div>
        <p className="text-[12px] text-muted">
          Address, phone and email come from the store information section above.
        </p>
      </Section>

      <Section id="footer" title="Footer">
        <div className="space-y-2">
          <Label htmlFor="footer_description">Footer description</Label>
          <Textarea
            id="footer_description"
            value={form.footer_description ?? ""}
            onChange={(event) => set("footer_description", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="copyright_text">Copyright text</Label>
          <Input
            id="copyright_text"
            value={form.copyright_text ?? ""}
            onChange={(event) => set("copyright_text", event.target.value)}
            placeholder="Aangan. All rights reserved."
          />
        </div>
      </Section>

      <Section
        id="seo"
        title="Search engine listing"
        description="Leave blank to use the store name and description."
      >
        <div className="space-y-2">
          <Label htmlFor="seo_title">SEO title</Label>
          <Input
            id="seo_title"
            value={form.seo_title ?? ""}
            onChange={(event) => set("seo_title", event.target.value)}
            invalid={Boolean(errorFor("seo_title"))}
          />
          <FieldError id="seo_title-error" message={errorFor("seo_title")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seo_description">SEO description</Label>
          <Textarea
            id="seo_description"
            value={form.seo_description ?? ""}
            onChange={(event) => set("seo_description", event.target.value)}
            invalid={Boolean(errorFor("seo_description"))}
          />
          <FieldError id="seo_description-error" message={errorFor("seo_description")} />
        </div>
      </Section>

      <div
        className={cn(
          "sticky bottom-0 -mx-4 border-t border-line bg-canvas/95 px-4 py-4 backdrop-blur-sm sm:mx-0 sm:px-0",
        )}
      >
        <FieldError id="settings-form-error" message={formError} />
        <div className="mt-2 flex items-center gap-3">
          <Button type="submit" variant="dark" size="lg" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
            {pending ? "Saving…" : "Save settings"}
          </Button>
          {hasErrors(errors) ? (
            <span className="text-[13px] text-red-600">Some fields need attention.</span>
          ) : null}
        </div>
      </div>
    </form>
  );
}
