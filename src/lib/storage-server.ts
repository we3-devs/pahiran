import { storagePathFromUrl, type Bucket } from "@/lib/storage-paths";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Deletes objects referenced by the given public URLs.
 * Only paths that resolve inside `bucket` are touched, so removing a product
 * can never delete another product's images. Failures are logged, never
 * thrown: a stale file must not block an admin edit.
 */
export async function removeStorageFiles(urls: string[], bucket: Bucket): Promise<void> {
  const paths = urls
    .map((url) => storagePathFromUrl(url, bucket))
    .filter((path): path is string => Boolean(path));

  if (paths.length === 0) return;

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) console.error("[storage] failed to remove files:", error.message);
  } catch (error) {
    console.error("[storage] unexpected error while removing files:", error);
  }
}
