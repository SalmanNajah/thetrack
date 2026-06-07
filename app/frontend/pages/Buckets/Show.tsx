import { Link, usePage, router } from "@inertiajs/react";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { toast } from "sonner";
import { Odometer } from "@/components/Odometer";
import { BottomNavbar } from "@/components/BottomNavbar";
import { TransferDialog } from "@/components/TransferDialog";
import { ImportPreviewModal } from "@/components/ImportPreviewModal";
import {
  formatTxnAmount,
  formatCurrency,
  groupByDate,
  getBucketLabel,
} from "@/lib/format";
import { classNames } from "@/lib/utils";
import type { Bucket, TransactionRecord, AuthUser, FlashData } from "@/types";
import {
  ArrowLeft,
  PenLine,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Trash2,
  Download,
  Paperclip,
  FileText,
  FileSpreadsheet,
  RotateCcw,
} from "lucide-react";

type PageProps = {
  auth: { user: AuthUser };
  flash: FlashData;
  bucket: Bucket;
  transactions: TransactionRecord[];
  other_buckets: Bucket[];
  currency_symbol: string;
};

function BalanceDisplay({
  balance,
  currencySymbol,
  bucketId,
}: {
  balance: string;
  currencySymbol: string;
  bucketId: number;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const numericBalance = parseFloat(balance) || 0;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function startEdit() {
    setEditValue(parseFloat(balance).toString());
    setEditing(true);
  }

  function commitEdit() {
    setEditing(false);
    const newBalance = parseFloat(editValue);
    if (isNaN(newBalance) || newBalance < 0) return;
    if (newBalance.toString() === parseFloat(balance).toString()) return;
    router.post(
      "/transactions/adjust_balance",
      {
        bucket_id: bucketId,
        new_balance: editValue,
      },
      { preserveScroll: true },
    );
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-semibold text-tt-text-tertiary">
          {currencySymbol}
        </span>
        <input
          ref={inputRef}
          type="number"
          min="0"
          step="0.01"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="w-52 border-0 border-b border-tt-text bg-transparent p-0 text-[3.25rem] font-semibold leading-none tracking-tighter text-tt-text caret-tt-accent focus:outline-none focus:ring-0"
        />
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      className="group relative inline-block text-left cursor-pointer"
      title="Tap to edit balance"
    >
      <span className="text-[3.25rem] font-semibold leading-none tracking-tighter text-tt-text">
        <Odometer value={formatCurrency(numericBalance.toFixed(2), currencySymbol)} />
      </span>
      <PenLine className="absolute -right-5 bottom-1 size-3.5 text-tt-text-tertiary opacity-30 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function TransactionRow({
  txn,
  currencySymbol,
}: {
  txn: TransactionRecord;
  currencySymbol: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const amount = parseFloat(txn.amount);
  const isPositive = amount > 0;
  const isTransfer = !!txn.transfer_group_id;

  return (
    <div className="border-b border-tt-border-subtle last:border-0">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        className={classNames(
          "flex items-center justify-between py-3 cursor-pointer select-none rounded-lg px-2 -mx-2 transition-colors duration-150 outline-none",
          expanded ? "bg-tt-surface/50" : "hover:bg-tt-surface/20"
        )}
      >
        <div className="min-w-0 flex-1 flex items-center gap-1.5">
          {isTransfer && (
            <ArrowLeftRight className="size-3 shrink-0 text-tt-text-tertiary" />
          )}
          <p
            className={classNames(
              "truncate text-sm",
              txn.reversed ? "line-through text-tt-text-tertiary opacity-60" : "text-tt-text"
            )}
          >
            {txn.description || (isTransfer ? "Transfer" : "Transaction")}
          </p>

        </div>
        <div className="ml-4 shrink-0 flex flex-col items-end">
          <span
            className={classNames(
              "text-sm font-medium tracking-tight",
              txn.reversed ? "line-through text-tt-text-tertiary opacity-60" : (isPositive ? "text-tt-positive" : "text-tt-negative"),
            )}
          >
            {formatTxnAmount(txn.amount)}
          </span>
          {txn.closing_balance && (
            <span className="mt-0.5 text-[11px] text-tt-text-tertiary">
              Closing:{" "}
              <span className={txn.reversed ? "text-tt-text-tertiary opacity-60" : "text-tt-text-secondary"}>
                {formatCurrency(txn.closing_balance, currencySymbol)}
              </span>
            </span>
          )}
        </div>
      </div>

      <div
        className={classNames(
          "overflow-hidden transition-all duration-200 ease-in-out",
          expanded ? "max-h-24 opacity-100 mb-2 mt-1" : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-tt-surface/30 border border-tt-border-subtle/50 rounded-xl p-3 flex items-center justify-between gap-4">
          <div className="text-[12px] text-tt-text-secondary">
            <div>
              <span className="text-tt-text-tertiary">Type: </span>
              <span className="capitalize">{txn.kind || (isTransfer ? "transfer" : "entry")}</span>
            </div>

            {txn.reversed && (
              <div className="mt-0.5 text-tt-text-tertiary italic">
                This transaction has been reversed
              </div>
            )}
          </div>

          {!txn.reversed && txn.kind !== "reversal" && !txn.reversal_of_id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.post(`/transactions/${txn.id}/reverse`, {}, { preserveScroll: true });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg text-tt-negative bg-tt-negative/10 border border-tt-negative/20 hover:bg-tt-negative/20 active:scale-[0.97] transition-all cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              Undo Transaction
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DateGroup({
  date,
  transactions,
  currencySymbol,
}: {
  date: string;
  transactions: TransactionRecord[];
  currencySymbol: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div>
      <p className="px-0 pt-6 pb-2 text-[12px] font-medium tracking-wide uppercase text-tt-text-tertiary">
        {date}
      </p>

      {!collapsed &&
        transactions.map((txn) => (
          <TransactionRow
            key={txn.id}
            txn={txn}
            currencySymbol={currencySymbol}
          />
        ))}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between py-2.5 text-[12px] text-tt-text-tertiary hover:text-tt-text-secondary transition-colors"
      >
        <span>Total</span>
        <span className="flex items-center gap-1 tracking-tight">
          {total >= 0 ? "+" : ""}
          {total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          {collapsed ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronUp className="size-3" />
          )}
        </span>
      </button>
    </div>
  );
}

function ChatInput({ bucketId, onImportClick }: { bucketId: number; onImportClick: () => void }) {
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit() {
    if (!input.trim() || submitting) return;
    setSubmitting(true);
    router.post(
      "/transactions",
      {
        bucket_id: bucketId,
        raw_input: input.trim(),
      },
      {
        preserveScroll: true,
        onFinish: () => {
          setSubmitting(false);
          setInput("");
        },
      },
    );
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-tt-border bg-tt-surface px-3 py-3">
      <button
        type="button"
        onClick={onImportClick}
        className="shrink-0 text-tt-text-tertiary hover:text-tt-text p-2 rounded-xl transition-colors border border-tt-border-subtle bg-tt-bg hover:border-white active:scale-[0.95] cursor-pointer"
        title="Import statement or paste text"
      >
        <Paperclip className="size-[18px]" />
      </button>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="-200 chai or 'move 50 to daily'"
        readOnly={submitting}
        autoFocus
        className="flex-1 min-w-0 border-0 bg-transparent text-[15px] text-tt-text placeholder:text-tt-text-tertiary focus:outline-none focus:ring-0 p-0"
      />
      <button
        onClick={handleSubmit}
        onMouseDown={(e) => e.preventDefault()}
        disabled={submitting || !input.trim()}
        className="shrink-0 size-8 rounded-lg bg-tt-text text-tt-bg hover:opacity-90 transition-all disabled:opacity-25 flex items-center justify-center cursor-pointer"
      >
        <ArrowUp className="size-4" />
      </button>
    </div>
  );
}

export default function Show() {
  const { flash, bucket, transactions, other_buckets, currency_symbol } =
    usePage<PageProps>().props;

  useEffect(() => {
    if (flash?.notice) {
      const txnId = flash.recent_transaction_id;
      if (txnId) {
        toast.success(flash.notice, {
          id: "flash-notice",
          action: {
            label: "Undo",
            onClick: () => router.post(`/transactions/${txnId}/reverse`, {}, { preserveScroll: true }),
          },
        });
      } else {
        const transferMatch = flash.notice.match(/^Transferred .+ to (.+)$/);
        if (transferMatch) {
          const targetName = transferMatch[1];
          const targetBucket = other_buckets.find((b) => b.name === targetName);
          toast.success(flash.notice, {
            id: "flash-notice",
            action: targetBucket ? {
              label: `Go to ${targetBucket.name}`,
              onClick: () => router.visit(`/buckets/${targetBucket.slug}`),
            } : undefined,
          });
        } else {
          toast.success(flash.notice, {
            id: "flash-notice",
            action: undefined,
          });
        }
      }
    }
    if (flash?.alert) toast.error(flash.alert, { id: "flash-alert" });
  }, [flash?.notice, flash?.alert, flash?.recent_transaction_id]);

  const dateGroups = groupByDate(transactions);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleDeleteBucket() {
    router.delete(`/buckets/${bucket.slug}`, {
      onFinish: () => setConfirmDelete(false),
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-tt-bg pb-48">
      <header className="sticky top-0 z-30 bg-tt-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-[13px] text-tt-text-tertiary hover:text-tt-text transition-colors"
          >
            <ArrowLeft className="size-[14px]" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="flex items-center gap-1 rounded-xl border border-tt-border bg-tt-surface p-2 text-[12px] text-tt-text-tertiary hover:text-tt-text hover:border-tt-text-tertiary/40 transition-all active:scale-[0.97] cursor-pointer"
                title="Export options"
              >
                <Download className="size-3" />
              </button>

              {exportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-tt-border bg-tt-surface p-1.5 shadow-md z-50 animate-in fade-in-0 slide-in-from-top-2 duration-100">
                  <a
                    href={`/exports/csv?bucket_slug=${bucket.slug}&tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-tt-text-secondary hover:text-tt-text hover:bg-tt-bg transition-colors text-left"
                    onClick={() => setExportDropdownOpen(false)}
                  >
                    <FileSpreadsheet className="size-3.5 text-tt-text-tertiary" />
                    Export CSV
                  </a>
                  <a
                    href={`/exports/pdf?bucket_slug=${bucket.slug}&tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-tt-text-secondary hover:text-tt-text hover:bg-tt-bg transition-colors text-left"
                    onClick={() => setExportDropdownOpen(false)}
                  >
                    <FileText className="size-3.5 text-tt-text-tertiary" />
                    Export PDF
                  </a>
                </div>
              )}
            </div>

            <ImportPreviewModal
              bucketId={bucket.id}
              currentBalance={parseFloat(bucket.balance)}
              open={importOpen}
              onOpenChange={setImportOpen}
            />

            {other_buckets.length > 0 &&
              (confirmDelete ? (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5">
                  <span className="text-[12px] text-red-600">Delete?</span>
                  <button
                    onClick={handleDeleteBucket}
                    className="text-[12px] font-semibold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-[12px] text-tt-text-tertiary hover:text-tt-text transition-colors cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1 rounded-xl border border-tt-border bg-tt-surface p-2 text-[12px] text-tt-text-tertiary hover:text-red-500 hover:border-red-200 transition-all active:scale-[0.97] cursor-pointer"
                >
                  <Trash2 className="size-3" />
                </button>
              ))}
            {other_buckets.length > 0 && (
              <TransferDialog
                buckets={[bucket, ...other_buckets]}
                currencySymbol={currency_symbol}
                defaultFromBucketId={bucket.id.toString()}
              />
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-xl px-6 pb-6">
          <section className="pt-4 pb-10">
            <p className="text-[13px] font-medium tracking-wide uppercase text-tt-text-tertiary">
              {getBucketLabel(bucket.slug)}
            </p>
            <div className="mt-2">
              <BalanceDisplay
                balance={bucket.balance}
                currencySymbol={currency_symbol}
                bucketId={bucket.id}
              />
            </div>
          </section>

          {dateGroups.length > 0 ? (
            <section>
              {dateGroups.map(([date, txns]) => (
                <DateGroup
                  key={date}
                  date={date}
                  transactions={txns}
                  currencySymbol={currency_symbol}
                />
              ))}
            </section>
          ) : (
            <div className="py-20 text-center text-sm text-tt-text-tertiary">
              No transactions yet.
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-24 left-0 right-0 z-40">
        <div className="mx-auto max-w-xl px-6">
          <ChatInput bucketId={bucket.id} onImportClick={() => setImportOpen(true)} />
        </div>
      </div>

      <BottomNavbar currentSlug={bucket.slug} />
    </div>
  );
}
