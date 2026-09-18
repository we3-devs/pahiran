import { SettingsForm } from "@/components/admin/settings-form";
import { getStoreSettings } from "@/lib/data/settings";

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-3xl">Store Settings</h1>
        <p className="max-w-2xl text-[15px] text-muted">
          Everything customers see — contact details, hero content, homepage sections, footer and
          the WhatsApp number — is edited here. No developer needed.
        </p>
      </header>

      <SettingsForm settings={settings} />
    </div>
  );
}
