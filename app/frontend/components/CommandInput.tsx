import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { router } from "@inertiajs/react";
import { ArrowUp, Paperclip, Search, ChevronDown } from "lucide-react";
import { classNames } from "@/lib/utils";
import type { Bucket } from "@/types";

const BUCKET_PLACEHOLDERS: Record<string, string> = {
  income: "salary 50000",
  daily: "chai 20",
};
const DEFAULT_PLACEHOLDER = "-200 chai or +50 to daily";

type CommandInputProps = {
  mode: "dashboard" | "bucket";
  buckets?: Bucket[];
  bucketId?: number;
  bucketName?: string;
  onImportClick?: () => void;
  onSearchClick?: () => void;
  showSearchTrigger?: boolean;
};

export function CommandInput({
  mode,
  buckets = [],
  bucketId,
  bucketName,
  onImportClick,
  onSearchClick,
  showSearchTrigger = false,
}: CommandInputProps) {
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const getStoredBucketId = (): number | null => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("thetrack_last_bucket_id");
    return stored ? parseInt(stored, 10) : null;
  };

  const getDefaultBucketId = (): number => {
    if (bucketId) return bucketId;
    const stored = getStoredBucketId();
    if (stored && buckets.find((b) => b.id === stored)) return stored;
    const income = buckets.find((b) => b.slug === "income");
    return income?.id || buckets[0]?.id || 0;
  };

  const [selectedBucketId, setSelectedBucketId] = useState(getDefaultBucketId);

  useEffect(() => {
    if (mode === "bucket" && bucketId) {
      setSelectedBucketId(bucketId);
    }
  }, [mode, bucketId]);

  const selectedBucket =
    mode === "bucket"
      ? { id: bucketId!, name: bucketName || "", slug: "" }
      : buckets.find((b) => b.id === selectedBucketId) || buckets[0];

  const placeholder =
    selectedBucket?.slug && BUCKET_PLACEHOLDERS[selectedBucket.slug]
      ? BUCKET_PLACEHOLDERS[selectedBucket.slug]
      : DEFAULT_PLACEHOLDER;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if (
        e.key === "/" &&
        !e.metaKey &&
        !e.ctrlKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSelectBucket(id: number) {
    setSelectedBucketId(id);
    localStorage.setItem("thetrack_last_bucket_id", String(id));
    setDropdownOpen(false);
    inputRef.current?.focus();
  }

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!input.trim() || submitting || !selectedBucket) return;
    setSubmitting(true);
    router.post(
      "/transactions",
      {
        bucket_id: selectedBucket.id,
        raw_input: input.trim(),
      },
      {
        preserveScroll: true,
        preserveState: true,
        onFinish: () => {
          setSubmitting(false);
          setInput("");
        },
      },
    );
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  }

  return (
    <div className="w-full">
      <div className="border border-dashed border-tt-text-tertiary/40 bg-tt-surface">
        <div className="flex items-center justify-between px-3 py-2 border-b border-dashed border-tt-text-tertiary/20">
          {showSearchTrigger ? (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSearchClick?.();
              }}
              className="hidden md:flex items-center gap-1.5 text-[12px] text-tt-text-secondary hover:text-tt-text border border-dashed border-tt-text-tertiary/40 px-2 py-0.5 bg-tt-bg transition-colors cursor-pointer"
            >
              <Search className="size-3" />
              <span>⌘K</span>
            </button>
          ) : (
            <div />
          )}

          {mode === "dashboard" && buckets.length > 0 ? (
            <div className="relative ml-auto" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1 text-[13px] font-medium text-tt-text-secondary hover:text-tt-text transition-colors cursor-pointer"
              >
                {selectedBucket?.name || "Select bucket"}
                <ChevronDown
                  className={classNames(
                    "size-3 transition-transform duration-150",
                    dropdownOpen && "rotate-180",
                  )}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] border border-dashed border-tt-text-tertiary/40 bg-tt-surface py-1">
                  {buckets.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleSelectBucket(b.id)}
                      className={classNames(
                        "w-full text-left px-3 py-1.5 text-[13px] transition-colors cursor-pointer",
                        b.id === selectedBucketId
                          ? "text-tt-text font-medium bg-tt-bg"
                          : "text-tt-text-secondary hover:text-tt-text hover:bg-tt-bg",
                      )}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="text-[13px] font-medium text-tt-text-secondary">
              {selectedBucket?.name}
            </span>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-3 py-3"
        >
          {onImportClick && (
            <button
              type="button"
              onClick={onImportClick}
              className="shrink-0 text-tt-text-tertiary hover:text-tt-text p-2 transition-colors border border-tt-border-subtle bg-tt-bg hover:border-white active:scale-[0.95] cursor-pointer"
              title="Import statement or paste text"
            >
              <Paperclip className="size-[18px]" />
            </button>
          )}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            className="flex-1 min-w-0 border-0 bg-transparent text-[15px] text-tt-text placeholder:text-tt-text-tertiary/40 focus:outline-none focus:ring-0 p-0"
          />
          <button
            type="submit"
            onMouseDown={(e) => e.preventDefault()}
            disabled={submitting || !input.trim()}
            className="shrink-0 size-8 bg-tt-text text-tt-bg hover:opacity-90 transition-all disabled:opacity-25 flex items-center justify-center cursor-pointer"
          >
            <ArrowUp className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
