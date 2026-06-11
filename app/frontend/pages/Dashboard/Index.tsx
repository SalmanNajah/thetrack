import { usePage, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { CommandInput } from "@/components/CommandInput";
import { ActivityFeed } from "@/components/ActivityFeed";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { ImportPreviewModal } from "@/components/ImportPreviewModal";
import { BottomNavbar } from "@/components/BottomNavbar";

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
  }, [flash?.notice, flash?.alert, flash?.recent_transaction_id]);

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
          <div className="pt-6 pb-6">
            <CommandInput
              mode="dashboard"
              buckets={buckets}
              onImportClick={() => setImportOpen(true)}
              showSearchTrigger={true}
            />
          </div>

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

      {onboarded && (
        <div className="md:hidden">
          <BottomNavbar />
        </div>
      )}
    </WorkspaceLayout>
  );
}
