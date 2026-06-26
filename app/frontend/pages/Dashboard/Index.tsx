import { usePage, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { CommandInput } from "@/components/CommandInput";
import { ActivityFeed } from "@/components/ActivityFeed";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { ImportPreviewModal } from "@/components/ImportPreviewModal";
import { formatCurrency } from "@/lib/format";
import { Odometer } from "@/components/Odometer";

import type {
  Bucket,
  TransactionRecord,
  CurrencyOption,
  AuthUser,
} from "@/types";

type PageProps = {
  auth: { user: AuthUser };
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
                  router.visit(`/buckets/${targetBucket.slug}`),
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

  return (
    <WorkspaceLayout
      buckets={buckets}
      totalBalance={total_balance}
      currencySymbol={currency_symbol}
      showMobileBalance={true}
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
          {isCombinedView && (
            <section className="pt-4 pb-4 border-b border-dashed border-tt-border/60 mb-4 select-none">
              <p className="text-[13px] font-medium tracking-wide uppercase text-tt-text-tertiary">
                Combined Balance
              </p>
              <div className="mt-2 overflow-hidden">
                <span className="text-[3.25rem] font-semibold leading-none tracking-tighter text-tt-text truncate overflow-hidden block">
                  <Odometer
                    value={formatCurrency(combinedBalance.toFixed(2), currency_symbol)}
                  />
                </span>
              </div>
            </section>
          )}

          <div className="pt-6 pb-6">
            <CommandInput
              mode="dashboard"
              buckets={buckets}
              onImportClick={() => setImportOpen(true)}
            />
          </div>

          {isCombinedView && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 border border-tt-border rounded-xl px-4 py-3 mb-6 backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-semibold text-tt-text-secondary/80 tracking-wide uppercase select-none">
                  Combined view:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedBucketSlugs.map((slug) => {
                    const b = buckets.find((bucket) => bucket.slug === slug);
                    return (
                      <span
                        key={slug}
                        className="inline-flex items-center gap-1 bg-white border border-tt-border/60 px-2 py-0.5 rounded-md text-[12px] font-medium text-tt-text shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                      >
                        {b?.name || slug}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={() => router.visit("/dashboard")}
                className="text-[12px] font-medium text-tt-text-secondary hover:text-tt-text hover:underline transition-colors cursor-pointer text-left focus:outline-none"
              >
                Clear filter
              </button>
            </div>
          )}


          <ActivityFeed
            transactions={recent_transactions}
            currencySymbol={currency_symbol}
            showBucketName={true}
          />

          {recent_transactions.length === 0 && onboarded && (
            <div className="mt-8 text-center text-sm text-tt-text-tertiary">
              Your buckets are empty. Use the input above to add your first
              transaction.
            </div>
          )}
        </>
      )}

      {incomeBucket && (
        <ImportPreviewModal
          bucketId={incomeBucket.id}
          currentBalance={parseFloat(incomeBucket.balance)}
          open={importOpen}
          onOpenChange={setImportOpen}
        />
      )}
    </WorkspaceLayout>
  );
}
