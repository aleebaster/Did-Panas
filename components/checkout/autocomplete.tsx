"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface Suggestion {
  ref: string;
  label: string;
  hint?: string;
}

interface AutocompleteProps {
  id: string;
  name: string;
  label: string;
  value: string;
  endpoint: string;
  params?: Record<string, string>;
  ready?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: Suggestion) => void;
}

interface SuggestionsPayload {
  items?: Suggestion[];
  error?: string;
  unavailable?: boolean;
}

function paramsToString(params?: Record<string, string>): string {
  if (!params) {
    return "";
  }
  return Object.entries(params)
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
}

export function Autocomplete({
  id,
  name,
  label,
  value,
  endpoint,
  params,
  ready = true,
  placeholder,
  required,
  disabled,
  error,
  onChange,
  onSelect,
}: AutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [committed, setCommitted] = useState<string | null>(null);

  const paramsKey = paramsToString(params);
  const query = value.trim();
  const canFetch =
    !manual && !disabled && ready && committed !== query && query.length >= 2;
  const showList = canFetch && open && suggestions.length > 0;

  useEffect(() => {
    if (!canFetch) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      setLoading(true);

      const search = new URLSearchParams({ q: query });
      if (paramsKey) {
        for (const entry of paramsKey.split("|")) {
          const [key, paramValue] = entry.split(":");
          if (key && paramValue) {
            search.set(key, paramValue);
          }
        }
      }

      fetch(`${endpoint}?${search.toString()}`, { signal: controller.signal })
        .then(async (response) => {
          if (cancelled) {
            return;
          }
          const body = (await response.json().catch(() => ({}))) as SuggestionsPayload;

          if (cancelled) {
            return;
          }

          if (!response.ok || body.unavailable) {
            if (response.status === 503 || body.unavailable) {
              setManual(true);
              setNotice(body.error ?? "Автопідказки недоступні.");
            } else {
              setNotice(body.error ?? "Не вдалося завантажити підказки.");
            }
            setSuggestions([]);
            setOpen(false);
            setActive(-1);
            return;
          }

          const items = body.items ?? [];
          setNotice(null);
          setSuggestions(items);
          setOpen(items.length > 0);
          setActive(items.length > 0 ? 0 : -1);
        })
        .catch((requestError: unknown) => {
          if (
            cancelled ||
            (requestError instanceof DOMException &&
              requestError.name === "AbortError")
          ) {
            return;
          }
          setNotice("Не вдалося завантажити підказки.");
          setSuggestions([]);
          setOpen(false);
          setActive(-1);
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [canFetch, query, endpoint, paramsKey]);

  function choose(index: number) {
    const suggestion = suggestions[index];
    if (!suggestion) {
      return;
    }
    setCommitted(suggestion.label);
    onSelect(suggestion);
    setSuggestions([]);
    setOpen(false);
    setActive(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!showList && canFetch && suggestions.length > 0) {
        setOpen(true);
        setActive(0);
        return;
      }
      setActive((current) => Math.min(current + 1, suggestions.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      if (showList && active >= 0 && suggestions[active]) {
        event.preventDefault();
        choose(active);
      }
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const listboxId = `${id}-listbox`;
  const helperId = `${id}-helper`;

  return (
    <div className="relative space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>

      <div className="relative">
        <Input
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={showList ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && active >= 0 ? `${id}-option-${active}` : undefined
          }
          aria-invalid={Boolean(error)}
          aria-describedby={notice || error ? helperId : undefined}
          onChange={(event) => {
            setCommitted(null);
            onChange(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        />
        {canFetch && loading && (
          <Loader2
            aria-hidden
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        )}
      </div>

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover shadow-xl"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.ref}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
              onMouseEnter={() => setActive(index)}
              className={cn(
                "cursor-pointer border-b border-border/60 px-3 py-2 text-sm last:border-b-0",
                index === active && "bg-cream",
              )}
            >
              <span className="block">{suggestion.label}</span>
              {suggestion.hint && (
                <span className="block text-xs text-muted-foreground">
                  {suggestion.hint}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {error ? (
        <p id={helperId} role="alert" className="text-xs text-brick">
          {error}
        </p>
      ) : notice ? (
        <p id={helperId} role="status" className="text-xs text-muted-foreground">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
