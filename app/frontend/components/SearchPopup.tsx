import {
  useState,
  useEffect,
  useRef,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { router } from "@inertiajs/react";
import { Search, X } from "lucide-react";
import { classNames } from "@/lib/utils";
import { formatDate } from "@/lib/format";

type SearchResult = {
  id: number;
  description: string | null;
  amount: string;
  occurred_at: string;
  bucket: { id: number; name: string; slug: string };
};

type SearchPopupProps = {
  open: boolean;
  onClose: () => void;
};

export function SearchPopup({ open, onClose }: SearchPopupProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    function handleGlobalKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!open) {
          // Parent handles opening
        } else {
          onClose();
        }
      }
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const isQueryEmpty = !query.trim();

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      const csrfToken =
        document
          .querySelector('meta[name="csrf-token"]')
          ?.getAttribute("content") || "";

      fetch(`/transactions/search?q=${encodeURIComponent(query.trim())}`, {
        headers: {
          Accept: "application/json",
          "X-CSRF-Token": csrfToken,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setResults(Array.isArray(data) ? data : []);
          setSelectedIndex(0);
          setLoading(false);
        })
        .catch(() => {
          setResults([]);
          setLoading(false);
        });
    }, isQueryEmpty ? 0 : 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  function handleKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      navigateToResult(results[selectedIndex]);
    }
  }

  function navigateToResult(result: SearchResult) {
    onClose();
    router.visit(`/buckets/${result.bucket.slug}?highlight=${result.id}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center pt-[20vh]">
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md mx-4 border border-dashed border-tt-text bg-tt-surface">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-tt-border">
          <Search className="size-4 text-tt-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search transactions..."
            spellCheck={false}
            autoComplete="off"
            className="flex-1 border-0 bg-transparent text-[15px] text-tt-text placeholder:text-tt-text-tertiary/40 focus:outline-none focus:ring-0 p-0"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-tt-text-tertiary hover:text-tt-text transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {loading && (
          <div className="px-4 py-6 text-center text-[13px] text-tt-text-tertiary">
            Searching…
          </div>
        )}

        {!loading && query.trim() && results.length === 0 && (
          <div className="px-4 py-6 text-center text-[13px] text-tt-text-tertiary">
            No results
          </div>
        )}

        {!loading && !query.trim() && results.length === 0 && (
          <div className="px-4 py-6 text-center text-[12px] text-tt-text-tertiary/60">
            No recent transactions
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="max-h-[300px] overflow-y-auto">
            {!query.trim() && (
              <p className="px-4 pt-3 pb-1.5 text-[10px] font-mono tracking-wider uppercase text-tt-text-tertiary border-b border-dashed border-tt-border-subtle/40">
                Recent Transactions
              </p>
            )}
            {results.map((result, i) => {
              const amount = parseFloat(result.amount);
              const isPositive = amount > 0;

              return (
                <button
                  key={result.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    navigateToResult(result);
                  }}
                  className={classNames(
                    "w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors cursor-pointer",
                    i === selectedIndex
                      ? "bg-tt-bg"
                      : "hover:bg-tt-bg/50",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] text-tt-text truncate">
                      {result.description || "Transaction"}
                    </p>
                    <p className="text-[11px] text-tt-text-tertiary mt-0.5">
                      {result.bucket.name} · {formatDate(result.occurred_at)}
                    </p>
                  </div>
                  <span
                    className={classNames(
                      "text-[14px] font-medium tracking-tight ml-3 shrink-0",
                      isPositive ? "text-tt-positive" : "text-tt-negative",
                    )}
                  >
                    {isPositive ? "+" : ""}
                    {amount.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
