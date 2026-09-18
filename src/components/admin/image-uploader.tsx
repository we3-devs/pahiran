"use client";

import { ArrowLeft, ArrowRight, ImagePlus, LoaderCircle, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { useToast } from "@/components/ui/toast";
import { formatFileSize, compressImage } from "@/lib/image";
import { createFolder, type Bucket } from "@/lib/storage-paths";
import { getBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  bucket: Bucket;
  folderPrefix: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
  help?: string;
  single?: boolean;
  invalid?: boolean;
};

function sanitizeFileName(name: string) {
  const base = name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${base || "image"}.webp`;
}

export function ImageUploader({
  bucket,
  folderPrefix,
  value,
  onChange,
  max = 8,
  label = "Images",
  help,
  single = false,
  invalid,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [note, setNote] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);

  const limit = single ? 1 : max;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const supabase = getBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured, so uploads are unavailable.");
      return;
    }

    const remaining = limit - value.length;
    const selected = Array.from(files).slice(0, remaining);
    if (selected.length === 0) {
      setError(`You can upload up to ${limit} image${limit === 1 ? "" : "s"}.`);
      return;
    }

    setUploading(true);
    setError(null);
    setNote(null);
    setProgress({ done: 0, total: selected.length });

    const folder = createFolder(folderPrefix);
    const uploaded: string[] = [];
    let savedBytes = 0;
    let failed = 0;

    for (const [index, file] of selected.entries()) {
      setProgress({ done: index, total: selected.length });

      try {
        const compressed = await compressImage(file);
        savedBytes += Math.max(0, file.size - compressed.size);

        const path = `${folder}/${sanitizeFileName(file.name)}`;
        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, compressed, { cacheControl: "31536000", contentType: compressed.type });

        if (uploadError || !data) {
          console.error("[upload] failed:", uploadError?.message);
          failed += 1;
          setProgress({ done: index + 1, total: selected.length });
          continue;
        }

        uploaded.push(supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl);
      } catch (uploadError) {
        console.error("[upload] unexpected error:", uploadError);
        failed += 1;
      }

      setProgress({ done: index + 1, total: selected.length });
    }

    if (uploaded.length > 0) {
      onChange([...value, ...uploaded].slice(0, limit));
      toast(uploaded.length === 1 ? "Image uploaded" : `${uploaded.length} images uploaded`, {
        description:
          savedBytes > 50 * 1024
            ? `Optimised in your browser — saved ${formatFileSize(savedBytes)}.`
            : undefined,
      });
    }

    if (failed > 0) {
      const message =
        failed === 1
          ? "Image upload failed. Please try again."
          : `${failed} images failed to upload. Please try again.`;
      setError(message);
      toast(message, { variant: "error" });
    }

    if (savedBytes > 50 * 1024) setNote(`Images optimised — saved ${formatFileSize(savedBytes)}.`);
    setProgress(null);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-[12px] text-muted">
          {value.length}/{limit}
        </span>
      </div>

      <div
        className={cn(
          "rounded-lg border border-dashed p-3",
          invalid ? "border-red-500" : "border-line",
        )}
      >
        <div className="flex flex-wrap gap-3">
          {value.map((url, index) => (
            <figure
              key={url}
              className="group relative h-28 w-24 overflow-hidden rounded-md border border-line bg-surface"
            >
              <Image src={url} alt={`Image ${index + 1}`} fill sizes="96px" className="object-cover" />

              {index === 0 && !single ? (
                <figcaption className="absolute top-1 left-1 rounded bg-ink/85 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-canvas">
                  Primary
                </figcaption>
              ) : null}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-canvas/95 px-1 py-1 opacity-100">
                <div className="flex gap-0.5">
                  {!single ? (
                    <>
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move image ${index + 1} earlier`}
                        className="inline-flex size-6 items-center justify-center rounded hover:bg-surface disabled:opacity-30"
                      >
                        <ArrowLeft className="size-3.5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === value.length - 1}
                        aria-label={`Move image ${index + 1} later`}
                        className="inline-flex size-6 items-center justify-center rounded hover:bg-surface disabled:opacity-30"
                      >
                        <ArrowRight className="size-3.5" aria-hidden />
                      </button>
                    </>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove image ${index + 1}`}
                  className="inline-flex size-6 items-center justify-center rounded text-muted hover:bg-surface hover:text-red-600"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
            </figure>
          ))}

          {value.length < limit ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className={cn(
                "flex h-28 w-24 flex-col items-center justify-center gap-2 rounded-md border border-line bg-canvas text-xs text-muted transition-colors hover:border-ink/40 hover:text-ink",
                uploading && "opacity-60",
              )}
            >
              {uploading ? (
                <LoaderCircle className="size-5 animate-spin" aria-hidden />
              ) : (
                <ImagePlus className="size-5" aria-hidden />
              )}
              {uploading ? "Uploading" : "Upload"}
            </button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={!single}
          className="sr-only"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {uploading && progress ? (
        <p className="text-[12px] text-muted" role="status">
          Uploading image {Math.min(progress.done + 1, progress.total)} of {progress.total}…
        </p>
      ) : null}

      {help ? <p className="text-[12px] text-muted">{help}</p> : null}
      {note ? <p className="text-[12px] text-brand">{note}</p> : null}
      {error ? (
        <p role="alert" className="text-[13px] font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Convenience wrapper for single-image fields (category image, hero image). */
export function SingleImageUploader(props: Omit<Props, "value" | "onChange" | "single"> & {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const { value, onChange, ...rest } = props;

  return (
    <ImageUploader
      {...rest}
      single
      value={value ? [value] : []}
      onChange={(urls) => onChange(urls[0] ?? null)}
    />
  );
}