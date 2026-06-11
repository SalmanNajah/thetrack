import { usePage, router } from "@inertiajs/react";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { toast } from "sonner";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { CommandInput } from "@/components/CommandInput";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ImportPreviewModal } from "@/components/ImportPreviewModal";
import { TransferDialog } from "@/components/TransferDialog";
import { BottomNavbar } from "@/components/BottomNavbar";
import { Odometer } from "@/components/Odometer";
import { formatCurrency, getBucketLabel } from "@/lib/format";
import type { Bucket, TransactionRecord, AuthUser, FlashData } from "@/types";
import {
  Trash2,
  Download,
  FileText,
  FileSpreadsheet,
  PenLine,
} from "lucide-react";

type PageProps = {
  auth: { user: AuthUser };
  flash: FlashData;
  bucket: Bucket;
  transactions: TransactionRecord[];
  all_buckets: Bucket[];
  other_buckets: Bucket[];
  total_balance: string;
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
      { bucket_id: bucketId, new_balance: editValue },
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

  const formatted = formatCurrency(numericBalance.toFixed(2), currencySymbol);
  const fontSizeClass =
    formatted.length > 14
      ? "text-[1.875rem] md:text-[3.25rem]"
      : formatted.length > 10
        ? "text-[2.5rem] md:text-[3.25rem]"
        : "text-[3.25rem]";

  return (
    <button
      onClick={startEdit}
      className="group relative inline-block text-left focus:outline-none cursor-pointer max-w-full overflow-hidden"
    >
      <span className={`${fontSizeClass} font-semibold leading-none tracking-tighter text-tt-text truncate overflow-hidden block`}>
        <Odometer
          value={formatted}
        />
      </span>
      <PenLine className="absolute -right-5 bottom-1 size-3.5 text-tt-text-tertiary opacity-30 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

export default function Show() {
  const {
    flash,
    bucket,
    transactions,
    all_buckets,
    other_buckets,
    total_balance,
    currency_symbol,
  } = usePage<PageProps>().props;

  const [importOpen, setImportOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        exportRef.current &&
        !exportRef.current.contains(event.target as Node)
      ) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (flash?.notice) {
      const txnId = flash.recent_transaction_id;
      if (txnId) {
        toast.success(flash.notice, {
          id: "flash-notice",
          action: {
            label: "Undo",
            onClick: () =>
              router.post(
                `/transactions/${txnId}/reverse`,
                {},
                { preserveScroll: true },
              ),
          },
        });
      } else {
        const transferMatch = flash.notice.match(/^Transferred .+ to (.+)$/);
        if (transferMatch) {
          const targetName = transferMatch[1];
          const targetBucket = other_buckets.find(
            (b) => b.name === targetName,
          );
          toast.success(flash.notice, {
            id: "flash-notice",
            action: targetBucket
              ? {
                  label: `Go to ${targetBucket.name}`,
                  onClick: () =>
                    router.visit(`/buckets/${targetBucket.slug}`),
                }
              : undefined,
          });
        } else {
          toast.success(flash.notice, { id: "flash-notice" });
        }
      }
    }
    if (flash?.alert) toast.error(flash.alert, { id: "flash-alert" });
  }, [flash?.notice, flash?.alert, flash?.recent_transaction_id]);

  function handleDeleteBucket() {
    router.delete(`/buckets/${bucket.slug}`, {
      onFinish: () => setConfirmDelete(false),
    });
  }

  const tz = typeof Intl !== "undefined"
    ? encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)
    : "";

  return (
    <WorkspaceLayout
      buckets={all_buckets}
      totalBalance={total_balance}
      currencySymbol={currency_symbol}
      activeBucketSlug={bucket.slug}
      showMobileBalance={false}
    >
      <section className="pt-4 pb-4">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium tracking-wide uppercase text-tt-text-tertiary">
            {getBucketLabel(bucket.slug)}
          </p>
        </div>
        <div className="mt-2">
          <BalanceDisplay
            balance={bucket.balance}
            currencySymbol={currency_symbol}
            bucketId={bucket.id}
          />
        </div>

        <div className="flex items-center gap-1.5 mt-5">
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center gap-1.5 border border-tt-border bg-tt-surface px-2.5 py-1.5 text-[12px] text-tt-text-tertiary hover:text-tt-text hover:border-tt-text-tertiary/40 transition-all active:scale-[0.97] cursor-pointer"
              title="Export options"
            >
              <Download className="size-3.5" />
              <span>Export</span>
            </button>

            {exportDropdownOpen && (
              <div className="absolute left-0 mt-1 w-44 border border-tt-border bg-tt-surface p-1 z-50">
                <a
                  href={`/exports/csv?bucket_slug=${bucket.slug}&tz=${tz}`}
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-[13px] text-tt-text-secondary hover:text-tt-text hover:bg-tt-bg transition-colors text-left"
                  onClick={() => setExportDropdownOpen(false)}
                >
                  <FileSpreadsheet className="size-3.5 text-tt-text-tertiary" />
                  CSV
                </a>
                <a
                  href={`/exports/pdf?bucket_slug=${bucket.slug}&tz=${tz}`}
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-[13px] text-tt-text-secondary hover:text-tt-text hover:bg-tt-bg transition-colors text-left"
                  onClick={() => setExportDropdownOpen(false)}
                >
                  <FileText className="size-3.5 text-tt-text-tertiary" />
                  PDF
                </a>
              </div>
            )}
          </div>

          {other_buckets.length > 0 && (
            <TransferDialog
              buckets={[bucket, ...other_buckets]}
              currencySymbol={currency_symbol}
              defaultFromBucketId={bucket.id.toString()}
            />
          )}

          {other_buckets.length > 0 &&
            (confirmDelete ? (
              <div className="flex items-center gap-2 border border-red-200 bg-red-50 px-3 py-1.5">
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
                className="flex items-center gap-1.5 border border-tt-border bg-tt-surface px-2.5 py-1.5 text-[12px] text-tt-text-tertiary hover:text-red-500 hover:border-red-200 transition-all active:scale-[0.97] cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </button>
            ))}
        </div>
      </section>

      <div className="pt-2 pb-4">
        <CommandInput
          mode="bucket"
          bucketId={bucket.id}
          bucketName={bucket.name}
          onImportClick={() => setImportOpen(true)}
          showSearchTrigger={true}
        />
      </div>

      <ActivityFeed
        transactions={transactions}
        currencySymbol={currency_symbol}
        showBucketName={false}
      />

      <ImportPreviewModal
        bucketId={bucket.id}
        currentBalance={parseFloat(bucket.balance)}
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      <div className="md:hidden">
        <BottomNavbar currentSlug={bucket.slug} />
      </div>
    </WorkspaceLayout>
  );
}
