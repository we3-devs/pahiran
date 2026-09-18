import { BUCKETS, SUPABASE_URL } from "@/lib/env";

export type Bucket = (typeof BUCKETS)[keyof typeof BUCKETS];

/** Public URL for an object inside a public bucket. */
export function publicStorageUrl(bucket: Bucket, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Recovers the object path from a public URL.
 * Returns null when the URL belongs to another bucket or another host, so a
 * delete can never touch files outside the expected bucket.
 */
export function storagePathFromUrl(url: string, bucket: Bucket): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = url.slice(index + marker.length).split("?")[0];
  if (!path) return null;
  return decodeURIComponent(path);
}

/** A collision-free folder for one upload batch. */
export function createFolder(prefix: string): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  return `${prefix}/${id}`;
}
