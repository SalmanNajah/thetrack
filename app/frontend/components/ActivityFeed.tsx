import { useState, useEffect, useRef } from "react";
import { router, usePage } from "@inertiajs/react";
import { Odometer } from "@/components/Odometer";
import { formatCurrency, groupByDate, formatTime } from "@/lib/format";
import { classNames } from "@/lib/utils";
import { ArrowLeftRight, RotateCcw, ChevronDown, ChevronUp, Loader2, Check, AlertCircle } from "lucide-react";
import type { TransactionRecord } from "@/types";

function FeedEntry({
  txn,
  currencySymbol,
  showBucketName,
  highlightId,
}: {
  txn: TransactionRecord;
  currencySymbol: string;
  showBucketName: boolean;
  highlightId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const { url } = usePage();
  const searchParams = new URL(url, "http://localhost").searchParams;
  const isCombined = (searchParams.get("buckets")?.split(",").filter(Boolean).length ?? 0) > 1;

  const elementRef = useRef<HTMLDivElement>(null);
  const amount = parseFloat(txn.amount);
  const isPositive = amount > 0;
  const isTransfer = !!txn.transfer_group_id;

  const [description, setDescription] = useState(txn.description || "");
  const [savingDescStatus, setSavingDescStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [descFocused, setDescFocused] = useState(false);
  const saveDescTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [notes, setNotes] = useState(txn.notes || "");
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [notesFocused, setNotesFocused] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!descFocused && savingDescStatus !== "saving") {
      setDescription(txn.description || "");
    }
  }, [txn.description, savingDescStatus, descFocused]);

  useEffect(() => {
    if (!notesFocused && savingStatus !== "saving") {
      setNotes(txn.notes || "");
    }
  }, [txn.notes, savingStatus, notesFocused]);

  const saveDescription = (value: string) => {
    if (value === (txn.description || "")) return;
    setSavingDescStatus("saving");

    router.put(
      `/transactions/${txn.id}`,
      {
        transaction: {
          description: value,
        },
      },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => setSavingDescStatus("saved"),
        onError: () => setSavingDescStatus("error"),
      }
    );
  };

  const saveNote = (value: string) => {
    if (value === (txn.notes || "")) return;
    setSavingStatus("saving");

    router.post(
      "/notes",
      {
        type: "transaction",
        id: txn.id,
        content: value,
      },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => setSavingStatus("saved"),
        onError: () => setSavingStatus("error"),
      }
    );
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDescription(val);
    setSavingDescStatus("idle");

    if (saveDescTimeoutRef.current) clearTimeout(saveDescTimeoutRef.current);
    saveDescTimeoutRef.current = setTimeout(() => {
      saveDescription(val);
    }, 800);
  };

  const handleDescBlur = () => {
    if (saveDescTimeoutRef.current) clearTimeout(saveDescTimeoutRef.current);
    saveDescription(description);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    setSavingStatus("idle");

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(val);
    }, 800);
  };

  const handleBlur = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveNote(notes);
  };

  useEffect(() => {
    return () => {
      if (saveDescTimeoutRef.current) clearTimeout(saveDescTimeoutRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const renderDescStatus = () => {
    switch (savingDescStatus) {
      case "saving":
        return (
          <div className="flex items-center gap-1 text-[10px] text-tt-text-secondary select-none">
            <Loader2 className="size-3 animate-spin text-tt-accent" />
            <span>Saving…</span>
          </div>
        );
      case "saved":
        return (
          <div className="flex items-center gap-1 text-[10px] text-tt-positive select-none">
            <Check className="size-3" />
            <span>Saved</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-1 text-[10px] text-tt-negative select-none">
            <AlertCircle className="size-3" />
            <span>Failed to save</span>
          </div>
        );
      default:
        return null;
    }
  };

  const renderStatus = () => {
    switch (savingStatus) {
      case "saving":
        return (
          <div className="flex items-center gap-1 text-[10px] text-tt-text-secondary select-none">
            <Loader2 className="size-3 animate-spin text-tt-accent" />
            <span>Saving…</span>
          </div>
        );
      case "saved":
        return (
          <div className="flex items-center gap-1 text-[10px] text-tt-positive select-none">
            <Check className="size-3" />
            <span>Saved</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-1 text-[10px] text-tt-negative select-none">
            <AlertCircle className="size-3" />
            <span>Failed to save</span>
          </div>
        );
      default:
        return null;
    }
  };

  const isHighlighted = highlightId === String(txn.id);

  useEffect(() => {
    if (isHighlighted && elementRef.current) {
      setExpanded(true);
      const timer = setTimeout(() => {
        elementRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

        const url = new URL(window.location.href);
        if (url.searchParams.has("highlight")) {
          url.searchParams.delete("highlight");
          window.history.replaceState(null, "", url.pathname + url.search);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  const bucketLabel = showBucketName ? txn.bucket.name : null;
  const closingBalance = txn.closing_balance
    ? formatCurrency(txn.closing_balance, currencySymbol)
    : null;

  const rowTimeStr = formatTime(txn.occurred_at);

  return (
    <div
      ref={elementRef}
      className={classNames(
        "transition-all duration-200 ease-in-out",
        isHighlighted ? "animate-highlight-fade" : "",
        expanded
          ? "bg-tt-surface shadow-[0_3px_10px_rgba(0,0,0,0.02)] my-3 px-3.5 py-3.5"
          : "hover:bg-tt-border-subtle px-3.5 -mx-3.5 py-3"
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          setExpanded(!expanded);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        className="flex items-center justify-between cursor-pointer select-none outline-none"
      >
        <div className="min-w-0 flex-1 flex items-center gap-1.5">
          {isTransfer && (
            <ArrowLeftRight className="size-3 shrink-0 text-tt-text-tertiary" />
          )}
          <div className="min-w-0">
            <p
              className={classNames(
                "truncate text-sm",
                txn.reversed
                  ? "line-through text-tt-text-tertiary opacity-60"
                  : "text-tt-text",
              )}
            >
              {txn.description || (isTransfer ? "Transfer" : "Transaction")}
            </p>
            <p
              className={classNames(
                "mt-0.5 text-[12px]",
                txn.reversed
                  ? "line-through text-tt-text-tertiary opacity-60"
                  : "text-tt-text-tertiary",
              )}
            >
              {bucketLabel ? (
                <span>{bucketLabel} · {rowTimeStr}</span>
              ) : (
                <span>{rowTimeStr}</span>
              )}
            </p>
          </div>
        </div>
        <div className="ml-4 shrink-0 flex flex-col items-end">
          <span
            className={classNames(
              "text-sm font-semibold tracking-tight flex items-center gap-0.5",
              txn.reversed
                ? "line-through text-tt-text-tertiary opacity-60"
                : isPositive
                  ? "text-tt-positive"
                  : "text-tt-negative",
            )}
          >
            <span>{isPositive ? "+" : "-"}</span>
            <Odometer
              value={formatCurrency(txn.amount, currencySymbol)}
            />
          </span>
          {closingBalance && (
            <span className="mt-0.5 text-[11px] text-tt-text-tertiary flex items-center gap-0.5">
              {isCombined ? "Combined balance: " : "Closing balance: "}
              <span className="text-tt-text-secondary">
                <Odometer value={closingBalance} />
              </span>
            </span>
          )}
        </div>
      </div>

      <div
        className={classNames(
          "overflow-hidden transition-all duration-200 ease-in-out",
          expanded
            ? "max-h-[450px] opacity-100 mt-3 pt-3.5 border-t border-tt-border/60"
            : "max-h-0 opacity-0 pointer-events-none",
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide bg-tt-bg text-tt-text-secondary border border-tt-border/60">
                {txn.kind || (isTransfer ? "Transfer" : "Manual")}
              </span>
              {txn.reversed && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide bg-tt-negative/10 text-tt-negative border border-tt-negative/20">
                  Reversed
                </span>
              )}
            </div>

            {!txn.reversed && txn.kind !== "reversal" && txn.kind !== "initial" && txn.kind !== "adjustment" && !txn.reversal_of_id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.post(
                    `/transactions/${txn.id}/reverse`,
                    {},
                    { preserveScroll: true },
                  );
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-tt-negative hover:text-red-700 hover:underline transition-all cursor-pointer bg-transparent border-0"
              >
                <RotateCcw className="size-3" />
                Undo Transaction
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-tt-text-secondary">Description</span>
              {renderDescStatus()}
            </div>
            <input
              type="text"
              value={description}
              onChange={handleDescChange}
              onFocus={() => setDescFocused(true)}
              onBlur={() => {
                setDescFocused(false);
                handleDescBlur();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              placeholder={isTransfer ? "Transfer" : "Transaction description…"}
              className="w-full rounded-md bg-tt-bg/60 border border-tt-border hover:border-tt-text-tertiary/50 focus:bg-tt-surface focus:outline-none focus:ring-0 focus:border-tt-border px-2.5 py-1.5 text-[12px] text-tt-text placeholder:text-tt-text-tertiary transition-all duration-150 font-sans"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-tt-text-secondary">Notes</span>
              {renderStatus()}
            </div>
            <textarea
              value={notes}
              onChange={handleChange}
              onFocus={() => setNotesFocused(true)}
              onBlur={() => {
                setNotesFocused(false);
                handleBlur();
              }}
              placeholder="Add a note to this transaction…"
              className="w-full rounded-md resize-none bg-tt-bg/60 border border-tt-border hover:border-tt-text-tertiary/50 focus:bg-tt-surface focus:outline-none focus:ring-0 focus:border-tt-border p-2.5 text-[12px] text-tt-text placeholder:text-tt-text-tertiary h-20 font-sans leading-relaxed transition-all duration-150"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DateGroup({
  date,
  transactions,
  currencySymbol,
  showBucketName,
  highlightId,
}: {
  date: string;
  transactions: TransactionRecord[];
  currencySymbol: string;
  showBucketName: boolean;
  highlightId: string | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const total = transactions.reduce(
    (sum, t) => sum + parseFloat(t.amount),
    0,
  );

  return (
    <div>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between pt-5 pb-1.5 focus:outline-none group text-left cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-tt-text-secondary group-hover:text-tt-text transition-colors">
            {date}
          </span>
          {collapsed ? (
            <ChevronDown className="size-3 text-tt-text-tertiary group-hover:text-tt-text-secondary transition-colors" />
          ) : (
            <ChevronUp className="size-3 text-tt-text-tertiary group-hover:text-tt-text-secondary transition-colors" />
          )}
        </div>
      </button>

      {!collapsed &&
        transactions.map((txn, index) => (
          <div key={txn.id}>
            {index > 0 && (
              <div className="border-t border-tt-border/40 my-0.5" />
            )}
            <FeedEntry
              txn={txn}
              currencySymbol={currencySymbol}
              showBucketName={showBucketName}
              highlightId={highlightId}
            />
          </div>
        ))}

      <div className="flex w-full items-center justify-between py-2 text-[11px] font-medium text-tt-text-secondary select-none">
        <span>{date === "Today" || date === "Yesterday" ? `${date} net` : "Net flow"}</span>
        <span className={classNames(
          "flex items-center gap-0.5 tracking-tight font-medium text-xs",
          total > 0 ? "text-tt-positive" : total < 0 ? "text-tt-negative" : "text-tt-text-secondary"
        )}>
          <span>{total > 0 ? "+" : total < 0 ? "-" : ""}</span>
          <Odometer
            value={formatCurrency(Math.abs(total).toFixed(2), currencySymbol)}
          />
        </span>
      </div>

      <div className="mt-2 mb-4">
        <div className="border-t border-tt-border/50" />
      </div>
    </div>
  );
}

type ActivityFeedProps = {
  transactions: TransactionRecord[];
  currencySymbol: string;
  showBucketName: boolean;
};

export function ActivityFeed({
  transactions,
  currencySymbol,
  showBucketName,
}: ActivityFeedProps) {
  const dateGroups = groupByDate(transactions);
  const highlightId = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("highlight")
    : null;

  if (dateGroups.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-tt-text-tertiary">
        No transactions yet.
      </div>
    );
  }

  return (
    <section>
      {dateGroups.map(([date, txns]) => (
        <DateGroup
          key={date}
          date={date}
          transactions={txns}
          currencySymbol={currencySymbol}
          showBucketName={showBucketName}
          highlightId={highlightId}
        />
      ))}
    </section>
  );
}
