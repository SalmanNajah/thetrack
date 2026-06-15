import { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";
import { Odometer } from "@/components/Odometer";
import { formatCurrency, groupByDate, formatDate } from "@/lib/format";
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
  const elementRef = useRef<HTMLDivElement>(null);
  const amount = parseFloat(txn.amount);
  const isPositive = amount > 0;
  const isTransfer = !!txn.transfer_group_id;

  const [notes, setNotes] = useState(txn.notes || "");
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (savingStatus !== "saving") {
      setNotes(txn.notes || "");
    }
  }, [txn.notes, savingStatus]);

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
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

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

  const rowDateStr = formatDate(txn.occurred_at);

  return (
    <div ref={elementRef}>
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
        className={classNames(
          "flex items-center justify-between py-3 cursor-pointer select-none px-2 -mx-2 transition-colors duration-150 outline-none",
          isHighlighted
            ? "animate-highlight-fade"
            : expanded
              ? "bg-tt-surface/50"
              : "hover:bg-tt-surface/20",
        )}
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
              {bucketLabel && <span>{bucketLabel} · </span>}
              <span>{rowDateStr}</span>
            </p>
          </div>
        </div>
        <div className="ml-4 shrink-0 flex flex-col items-end">
          <span
            className={classNames(
              "text-sm font-medium tracking-tight flex items-center gap-0.5",
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
              Closing balance:{" "}
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
            ? "max-h-60 opacity-100 mb-2 mt-1"
            : "max-h-0 opacity-0 pointer-events-none",
        )}
      >
        <div className="bg-tt-surface/30 border border-tt-border-subtle/50 p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="text-[12px] text-tt-text-secondary">
              <div>
                <span className="text-tt-text-tertiary">Type: </span>
                <span className="capitalize">
                  {txn.kind || (isTransfer ? "transfer" : "entry")}
                </span>
              </div>
              {txn.reversed && (
                <div className="mt-0.5 text-tt-text-tertiary italic">
                  This transaction has been reversed
                </div>
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-tt-negative bg-tt-negative/10 border border-tt-negative/20 hover:bg-tt-negative/20 active:scale-[0.97] transition-all cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                Undo Transaction
              </button>
            )}
          </div>

          <div className="border-t border-tt-border/60 pt-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-tt-text-secondary uppercase tracking-wider">Notes</span>
              {renderStatus()}
            </div>
            <textarea
              value={notes}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Add a note to this transaction…"
              className="w-full resize-none rounded-md border border-tt-border bg-tt-surface p-2 text-[12px] text-tt-text placeholder:text-tt-text-tertiary focus:outline-none focus:ring-1 focus:ring-tt-accent h-16 font-sans leading-relaxed"
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
      <p className="px-0 pt-6 pb-2 text-[12px] font-medium tracking-wide uppercase text-tt-text-tertiary">
        {date}
      </p>

      {!collapsed &&
        transactions.map((txn, index) => (
          <div key={txn.id}>
            {index > 0 && (
              <div className="border-t border-dashed border-tt-text-tertiary/15 my-0.5" />
            )}
            <FeedEntry
              txn={txn}
              currencySymbol={currencySymbol}
              showBucketName={showBucketName}
              highlightId={highlightId}
            />
          </div>
        ))}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between py-2.5 text-[12px] text-tt-text-secondary hover:text-tt-text transition-colors focus:outline-none"
      >
        <span className="capitalize">{date.toLowerCase()} total</span>
        <span className={classNames(
          "flex items-center gap-1 tracking-tight font-medium",
          total > 0 ? "text-tt-positive" : total < 0 ? "text-tt-negative" : "text-tt-text-secondary"
        )}>
          <span>{total > 0 ? "+" : total < 0 ? "-" : ""}</span>
          <Odometer
            value={formatCurrency(Math.abs(total).toFixed(2), currencySymbol)}
          />
          {collapsed ? (
            <ChevronDown className="size-3 ml-0.5" />
          ) : (
            <ChevronUp className="size-3 ml-0.5" />
          )}
        </span>
      </button>

      <div className="mt-1 mb-6">
        <div className="border-t border-dashed border-tt-text-tertiary/35" />
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
