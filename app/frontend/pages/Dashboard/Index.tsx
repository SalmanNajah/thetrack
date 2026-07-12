import { usePage, router } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { CommandInput } from "@/components/CommandInput";
import { ActivityFeed } from "@/components/ActivityFeed";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { ImportPreviewModal } from "@/components/ImportPreviewModal";
import { TransferDialog } from "@/components/TransferDialog";
import { formatCurrency, getBucketLabel } from "@/lib/format";
import { Odometer } from "@/components/Odometer";
import {
  Search,
  MoreHorizontal,
  FileSpreadsheet,
  FileText,
  Trash2,
  PenLine,
} from "lucide-react";
import { classNames } from "@/lib/utils";

import type {
  Bucket,
  TransactionRecord,
  CurrencyOption,
  AuthUser,
} from "@/types";

type PageProps = {
  auth: { user: AuthUser & { low_balance_threshold?: number } };
  flash: { notice: string | null; alert: string | null; recent_transaction_id?: number | null };
  buckets: Bucket[];
  total_balance: string;
  recent_transactions: TransactionRecord[];
  currency_symbol: string;
  currency: string;
  onboarded: boolean;
  currencies: CurrencyOption[];
};

export default function Index() {
  const {
    auth: { user },
    flash,
    buckets,
    total_balance,
    recent_transactions,
    currency_symbol,
    currency,
    onboarded,
    currencies,
  } = usePage<PageProps>().props;

  const [importOpen, setImportOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  const [editingBalance, setEditingBalance] = useState(false);
  const [editBalanceValue, setEditBalanceValue] = useState("");
  const balanceInputRef = useRef<HTMLInputElement>(null);

  const { url } = usePage();
  const selectedBucketSlugs = (() => {
    const searchParams = new URL(url, "http://localhost").searchParams;
    const rawBuckets = searchParams.get("buckets")?.split(",").filter(Boolean) || [];
    return rawBuckets
      .map((raw) => {
        const clean = raw.trim().toLowerCase();
        const found = buckets.find(
          (b) => b.slug.toLowerCase() === clean || b.name.toLowerCase() === clean
        );
        return found ? found.slug : null;
      })
      .filter((slug): slug is string => !!slug);
  })();

  const isCombinedView = selectedBucketSlugs.length > 0;

  const combinedBalance = selectedBucketSlugs.reduce((sum, slug) => {
    const b = buckets.find((bucket) => bucket.slug === slug);
    return sum + (b ? parseFloat(b.balance) || 0 : 0);
  }, 0);

  const activeSingleBucket = selectedBucketSlugs.length === 1
    ? buckets.find((b) => b.slug === selectedBucketSlugs[0])
    : null;

  const otherBuckets = activeSingleBucket
    ? buckets.filter((b) => b.id !== activeSingleBucket.id)
    : [];

  const numericBalanceToDisplay = activeSingleBucket
    ? parseFloat(activeSingleBucket.balance)
    : selectedBucketSlugs.length > 1
      ? combinedBalance
      : parseFloat(total_balance);

  const balanceToDisplay = formatCurrency(numericBalanceToDisplay.toFixed(2), currency_symbol);
  const formattedBalanceLength = balanceToDisplay.length;

  const isLowBalance = !!(
    activeSingleBucket &&
    user.low_balance_threshold !== undefined &&
    numericBalanceToDisplay < user.low_balance_threshold
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        overflowRef.current &&
        !overflowRef.current.contains(event.target as Node)
      ) {
        setOverflowOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingBalance && balanceInputRef.current) {
      balanceInputRef.current.focus();
      balanceInputRef.current.select();
    }
  }, [editingBalance]);

  function startEditBalance() {
    if (!activeSingleBucket) return;
    setEditBalanceValue(parseFloat(activeSingleBucket.balance).toString());
    setEditingBalance(true);
  }

  function commitEditBalance() {
    setEditingBalance(false);
    if (!activeSingleBucket) return;
    const newBalance = parseFloat(editBalanceValue);
    if (isNaN(newBalance) || newBalance < 0) return;
    if (newBalance.toString() === parseFloat(activeSingleBucket.balance).toString()) return;
    router.post(
      "/transactions/adjust_balance",
      { bucket_id: activeSingleBucket.id, new_balance: editBalanceValue },
      { preserveScroll: true }
    );
  }

  function handleBalanceKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitEditBalance();
    if (e.key === "Escape") setEditingBalance(false);
  }

  function handleDeleteBucket() {
    if (!activeSingleBucket) return;
    router.delete(`/buckets/${activeSingleBucket.slug}`, {
      onFinish: () => setConfirmDelete(false),
    });
  }

  const tz = typeof Intl !== "undefined"
    ? encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)
    : "";

  useEffect(() => {
    if (flash?.notice) {
      const txnId = flash.recent_transaction_id;
      const transferMatch = flash.notice.match(/^Transferred .+ to (.+)$/);
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
      } else if (transferMatch) {
        const targetName = transferMatch[1];
        const targetBucket = buckets.find((b) => b.name === targetName);
        toast.success(flash.notice, {
          id: "flash-notice",
          action: targetBucket
            ? {
                label: `Go to ${targetBucket.name}`,
                onClick: () =>
                  router.visit(`/dashboard?buckets=${targetBucket.slug}`),
              }
            : undefined,
        });
      } else {
        toast.success(flash.notice, { id: "flash-notice" });
      }
    }
    if (flash?.alert) toast.error(flash.alert, { id: "flash-alert" });
  }, [flash?.notice, flash?.alert, flash?.recent_transaction_id, buckets]);

  const incomeBucket = buckets.find((b) => b.slug === "income");

  const headerLabel = selectedBucketSlugs.length === 0
    ? "Total balance"
    : selectedBucketSlugs.length === 1 && activeSingleBucket
      ? getBucketLabel(activeSingleBucket.slug)
      : selectedBucketSlugs
          .map((slug) => {
            const b = buckets.find((bucket) => bucket.slug === slug);
            return b ? b.name : slug;
          })
          .join(" + ");

  return (
    <WorkspaceLayout
      buckets={buckets}
      totalBalance={total_balance}
      currencySymbol={currency_symbol}
      activeBucketSlug={activeSingleBucket?.slug}
      showMobileBalance={selectedBucketSlugs.length === 0}
      onboarded={onboarded}
    >
      {!onboarded ? (
        <OnboardingFlow
          buckets={buckets}
          currencySymbol={currency_symbol}
          currencies={currencies}
          currentCurrency={currency}
          userName={user.name}
          onComplete={() => {}}
        />
      ) : (
        <>
          <section className={classNames("select-none", isCombinedView ? "pt-4 pb-4" : "pt-4 pb-2")}>
            <div className="flex items-center justify-between gap-4">
              {isCombinedView ? (
                <p className="text-[13px] font-medium text-tt-text-secondary text-ellipsis overflow-hidden whitespace-nowrap max-w-[200px] sm:max-w-md">
                  {headerLabel}
                </p>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("open-search"))}
                  className="hidden md:flex items-center gap-1.5 text-[12px] text-tt-text-secondary hover:text-tt-text border border-tt-text-tertiary/40 px-2.5 py-1.5 bg-tt-surface transition-colors cursor-pointer focus:outline-none"
                  title="Search (⌘K)"
                >
                  <Search className="size-3.5 text-tt-text-tertiary" />
                  <span>⌘K</span>
                </button>

                {isCombinedView && (
                  <div className="relative" ref={overflowRef}>
                    <button
                      onClick={() => setOverflowOpen(!overflowOpen)}
                      className="flex items-center justify-center size-8 border border-tt-border bg-tt-surface hover:text-tt-text hover:border-tt-text-tertiary/40 transition-all active:scale-[0.97] cursor-pointer focus:outline-none"
                      title="More actions"
                    >
                      <MoreHorizontal className="size-3.5 text-tt-text-tertiary" />
                    </button>

                    {overflowOpen && (
                      <div className="absolute right-0 mt-1 w-48 border border-tt-border bg-tt-surface p-1 z-50 shadow-sm flex flex-col gap-0.5">
                        <a
                          href={
                            activeSingleBucket
                              ? `/exports/csv?bucket_slug=${activeSingleBucket.slug}&tz=${tz}`
                              : `/exports/multi_csv?tz=${tz}`
                          }
                          className="flex w-full items-center gap-2 px-2.5 py-2 text-[12px] text-tt-text-secondary hover:text-tt-text hover:bg-tt-bg transition-colors text-left font-medium"
                          onClick={() => setOverflowOpen(false)}
                        >
                          <FileSpreadsheet className="size-3.5 text-tt-text-tertiary" />
                          {activeSingleBucket ? "Export as CSV" : "Export all as CSV"}
                        </a>
                        <a
                          href={
                            activeSingleBucket
                              ? `/exports/pdf?bucket_slug=${activeSingleBucket.slug}&tz=${tz}`
                              : `/exports/multi_pdf?tz=${tz}`
                          }
                          className="flex w-full items-center gap-2 px-2.5 py-2 text-[12px] text-tt-text-secondary hover:text-tt-text hover:bg-tt-bg transition-colors text-left font-medium"
                          onClick={() => setOverflowOpen(false)}
                        >
                          <FileText className="size-3.5 text-tt-text-tertiary" />
                          {activeSingleBucket ? "Export as PDF" : "Export all as PDF"}
                        </a>

                        {activeSingleBucket && otherBuckets.length > 0 && (
                          <>
                            <div className="border-t border-tt-border/50 my-1" />
                            {confirmDelete ? (
                              <div className="flex items-center justify-between px-2.5 py-1.5 border border-red-200 bg-red-50/50">
                                <span className="text-[11px] text-red-600 font-medium">Delete?</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleDeleteBucket}
                                    className="text-[11px] font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDelete(false);
                                    }}
                                    className="text-[11px] text-tt-text-tertiary hover:text-tt-text cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDelete(true);
                                }}
                                className="flex w-full items-center gap-2 px-2.5 py-2 text-[12px] text-red-600 hover:bg-red-50/40 hover:text-red-700 transition-colors text-left font-medium cursor-pointer"
                              >
                                <Trash2 className="size-3.5 text-red-500" />
                                Delete bucket
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {buckets.length > 0 && (
                  <TransferDialog
                    buckets={buckets}
                    currencySymbol={currency_symbol}
                    defaultFromBucketId={activeSingleBucket?.id.toString()}
                  />
                )}
              </div>
            </div>

            {isCombinedView && (
              <div className="mt-2">
                {editingBalance && activeSingleBucket ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-tt-text-tertiary">
                      {currency_symbol}
                    </span>
                    <input
                      ref={balanceInputRef}
                      type="number"
                      min="0"
                      step="0.01"
                      value={editBalanceValue}
                      onChange={(e) => setEditBalanceValue(e.target.value)}
                      onBlur={commitEditBalance}
                      onKeyDown={handleBalanceKeyDown}
                      className="w-52 border-0 border-b border-tt-text bg-transparent p-0 text-[3.25rem] font-semibold leading-none tracking-tighter text-tt-text caret-tt-accent focus:outline-none focus:ring-0"
                    />
                  </div>
                ) : (
                  <button
                    onClick={activeSingleBucket ? startEditBalance : undefined}
                    disabled={!activeSingleBucket}
                    className={classNames(
                      "group relative inline-block text-left focus:outline-none max-w-full overflow-hidden",
                      activeSingleBucket ? "cursor-pointer" : "cursor-default"
                    )}
                  >
                    <span
                      className={classNames(
                        "font-semibold leading-none tracking-tighter truncate overflow-hidden block",
                        formattedBalanceLength > 14
                          ? "text-[1.875rem] md:text-[3.25rem]"
                          : formattedBalanceLength > 10
                            ? "text-[2.5rem] md:text-[3.25rem]"
                            : "text-[3.25rem]",
                        isLowBalance ? "text-[#da8a09]" : "text-tt-text"
                      )}
                    >
                      <Odometer value={balanceToDisplay} />
                    </span>
                    {activeSingleBucket && (
                      <PenLine className="absolute -right-5 bottom-1 size-3.5 text-tt-text-tertiary opacity-30 transition-opacity group-hover:opacity-100" />
                    )}
                  </button>
                )}
              </div>
            )}
          </section>

          <div className={isCombinedView ? "pt-2 pb-4" : "pt-2 pb-6"}>
            <CommandInput
              mode={activeSingleBucket ? "bucket" : "dashboard"}
              bucketId={activeSingleBucket?.id}
              bucketName={activeSingleBucket?.name}
              buckets={activeSingleBucket ? undefined : buckets}
              onImportClick={() => setImportOpen(true)}
            />
          </div>

          <ActivityFeed
            transactions={recent_transactions}
            currencySymbol={currency_symbol}
            showBucketName={!activeSingleBucket}
          />

          {recent_transactions.length === 0 && onboarded && (
            <div className="mt-8 text-center text-sm text-tt-text-tertiary">
              Your buckets are empty. Use the input above to add your first
              transaction.
            </div>
          )}
        </>
      )}

      {(() => {
        const targetImportBucket = activeSingleBucket || incomeBucket;
        if (!targetImportBucket) return null;
        return (
          <ImportPreviewModal
            bucketId={targetImportBucket.id}
            currentBalance={parseFloat(targetImportBucket.balance)}
            open={importOpen}
            onOpenChange={setImportOpen}
          />
        );
      })()}
    </WorkspaceLayout>
  );
}
