import { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";
import { Search } from "lucide-react";
import { classNames } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

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

  function navigateToResult(result: SearchResult) {
    onClose();
    router.visit(`/buckets/${result.bucket.slug}?highlight=${result.id}`);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      className="bg-tt-surface max-w-md mx-auto rounded-none!"
      showCloseButton={false}
    >
      <Command shouldFilter={false} className="border-0 bg-transparent rounded-none! p-0!">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search transactions..."
        />
        <CommandList className="max-h-[300px] overflow-y-auto pb-2">
          {loading && (
            <CommandEmpty className="px-4 py-6 text-center text-[13px] text-tt-text-tertiary">
              Searching…
            </CommandEmpty>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <CommandEmpty className="px-4 py-6 text-center text-[13px] text-tt-text-tertiary">
              No results
            </CommandEmpty>
          )}

          {!loading && !query.trim() && results.length === 0 && (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center select-none">
              <div className="size-10 rounded-full bg-tt-bg flex items-center justify-center mb-3">
                <Search className="size-5 text-tt-text-tertiary/60" />
              </div>
              <p className="text-[13px] font-medium text-tt-text-secondary">
                No transactions yet
              </p>
              <p className="text-[11px] text-tt-text-tertiary mt-1 max-w-[240px] leading-relaxed">
                Start by typing in a bucket.
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              {!query.trim() && (
                <p className="px-4 pt-3 pb-1.5 text-[10px] font-mono tracking-wider uppercase text-tt-text-tertiary border-b border-dashed border-tt-border-subtle/40">
                  Recent Transactions
                </p>
              )}
              {(() => {
                const shouldGroup = results.length > 7;
                let lastMonth = "";

                return results.map((result) => {
                  const amount = parseFloat(result.amount);
                  const isPositive = amount > 0;
                  
                  let monthHeader = null;
                  if (shouldGroup) {
                    const currentMonth = new Date(result.occurred_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
                    if (currentMonth !== lastMonth) {
                      lastMonth = currentMonth;
                      monthHeader = (
                        <p className="px-4 pt-4 pb-1 text-[11px] font-medium tracking-wider uppercase text-tt-text-tertiary border-b border-dashed border-tt-border-subtle/30 select-none">
                          {currentMonth}
                        </p>
                      );
                    }
                  }

                  return (
                    <div key={result.id}>
                      {monthHeader}
                      <CommandItem
                        value={`${result.id} ${result.description || ""} ${result.bucket.name}`}
                        onSelect={() => navigateToResult(result)}
                        className="w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors cursor-pointer rounded-none!"
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
                            "text-[14px] font-medium tracking-tight ml-3 shrink-0 text-right w-20",
                            isPositive ? "text-tt-positive" : "text-tt-negative",
                          )}
                        >
                          {isPositive ? "+" : ""}
                          {amount.toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </CommandItem>
                    </div>
                  );
                });
              })()}
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
