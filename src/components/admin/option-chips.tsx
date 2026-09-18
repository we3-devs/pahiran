"use client";

import { Plus, X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export function OptionChips({
  label,
  value,
  onChange,
  presets,
  presetLabel,
  placeholder,
  help,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  presets: string[];
  presetLabel: string;
  placeholder: string;
  help?: string;
}) {
  const [custom, setCustom] = React.useState("");
  const inputId = React.useId();

  const toggle = (option: string) => {
    onChange(
      value.includes(option) ? value.filter((entry) => entry !== option) : [...value, option],
    );
  };

  const addCustom = () => {
    const trimmed = custom.trim();
    if (!trimmed) return;
    const exists = value.some((entry) => entry.toLowerCase() === trimmed.toLowerCase());
    if (!exists) onChange([...value, trimmed]);
    setCustom("");
  };

  const customValues = value.filter((entry) => !presets.includes(entry));

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{label}</legend>

      <div className="space-y-2">
        <p className="text-[12px] tracking-wide uppercase text-muted">{presetLabel}</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((option) => {
            const selected = value.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggle(option)}
                aria-pressed={selected}
                className={cn(
                  "rounded-md border px-3.5 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "border-ink bg-ink text-canvas"
                    : "border-line text-ink hover:border-ink/40",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {customValues.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {customValues.map((option) => (
            <li
              key={option}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm"
            >
              {option}
              <button
                type="button"
                onClick={() => onChange(value.filter((entry) => entry !== option))}
                aria-label={`Remove ${option}`}
                className="text-muted hover:text-red-600"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">
          Add a custom {label.toLowerCase()} value
        </label>
        <input
          id={inputId}
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustom();
            }
          }}
          placeholder={placeholder}
          className="h-10 w-full max-w-48 rounded-lg border border-line bg-canvas px-3 text-sm placeholder:text-muted/70 focus:border-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
        />
        <button
          type="button"
          onClick={addCustom}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium transition-colors hover:border-ink/40"
        >
          <Plus className="size-3.5" aria-hidden />
          Add
        </button>
      </div>

      {help ? <p className="text-[12px] text-muted">{help}</p> : null}
    </fieldset>
  );
}
