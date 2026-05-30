import { usePage, router, Link } from "@inertiajs/react";
import { useState, useEffect, FormEvent, useRef, KeyboardEvent } from "react";
import { toast } from "sonner";
import { BottomNavbar } from "@/components/BottomNavbar";
import { formatCurrency, formatDate } from "@/lib/format";
import { classNames } from "@/lib/utils";
import type {
  Bucket,
  TransactionRecord,
  CurrencyOption,
  AuthUser,
} from "@/types";
import { ArrowLeftRight, ChevronRight, Plus } from "lucide-react";
import { TransferDialog } from "@/components/TransferDialog";

type PageProps = {
  auth: { user: AuthUser };
  flash: { notice: string | null; alert: string | null };
  buckets: Bucket[];
  total_balance: string;
  recent_transactions: TransactionRecord[];
  currency_symbol: string;
  currency: string;
  onboarded: boolean;
  currencies: CurrencyOption[];
};

function OnboardingCard({
  buckets,
  currencySymbol,
  currencies,
  currentCurrency,
  userName,
}: {
  buckets: Bucket[];
  currencySymbol: string;
  currencies: CurrencyOption[];
  currentCurrency: string;
  userName: string | null;
}) {
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);
  const [step, setStep] = useState<"currency" | "amount">("currency");

  const incomeBucket = buckets.find((b) => b.slug === "income");
  if (!incomeBucket) return null;

  const displaySymbol =
    currencies.find((c) => c.code === selectedCurrency)?.symbol ||
    currencySymbol;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    router.post(
      "/onboarding/set_initial_balances",
      {
        currency: selectedCurrency,
        balances: { [incomeBucket!.id]: amount },
      },
      { preserveScroll: true },
    );
  }

  function handleSkip() {
    router.post(
      "/onboarding/set_initial_balances",
      {
        currency: selectedCurrency,
        balances: {},
      },
      { preserveScroll: true },
    );
  }

  return (
    <div className="mb-8">
      <div className="border border-tt-text/10 bg-tt-surface">
        <div className="px-5 pt-5 pb-4">
          <p className="text-[17px] font-semibold text-tt-text tracking-tight">
            {userName ? `Hey ${userName}.` : "Get started."}
          </p>
          <p className="text-[13px] text-tt-text-tertiary mt-1.5 leading-relaxed">
            <span className="text-tt-text-secondary">Income</span> tracks what
            you earn. <span className="text-tt-text-secondary">Daily</span> is
            what you spend from. Need a vacation fund, rent stash, or anything
            else? Create your own buckets.
          </p>
        </div>

        <div className="border-t border-dashed border-tt-text/10" />

        {step === "currency" ? (
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium tracking-wider uppercase text-tt-text-tertiary mb-2.5">
              Currency
            </p>
            <div className="flex flex-wrap gap-1.5">
              {currencies.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setSelectedCurrency(c.code)}
                  className={classNames(
                    "px-2.5 py-1 text-[13px] transition-all duration-75",
                    selectedCurrency === c.code
                      ? "bg-tt-text text-tt-bg font-medium"
                      : "bg-tt-bg text-tt-text-secondary hover:text-tt-text",
                  )}
                >
                  {c.symbol} {c.code}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4">
            <p className="text-[11px] font-medium tracking-wider uppercase text-tt-text-tertiary mb-2.5">
              How much do you have?
            </p>
            <div className="flex items-center gap-2 border border-tt-text/10 bg-tt-bg px-3 py-2">
              <span className="text-sm text-tt-text-tertiary font-mono">
                {displaySymbol}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
                className="flex-1 border-0 bg-transparent p-0 text-xl font-mono tracking-tight text-tt-text placeholder:text-tt-text-tertiary/30 focus:outline-none focus:ring-0"
              />
            </div>
            <p className="text-[11px] text-tt-text-tertiary mt-1.5">
              Goes into your Income bucket. You can always change this.
            </p>
          </form>
        )}

        <div className="border-t border-dashed border-tt-text/10" />

        <div className="flex items-center justify-between px-5 py-3.5">
          <button
            type="button"
            onClick={handleSkip}
            className="text-[12px] text-tt-text-tertiary hover:text-tt-text transition-colors"
          >
            Skip
          </button>
          {step === "currency" ? (
            <button
              onClick={() => setStep("amount")}
              className="flex items-center gap-1 bg-tt-text text-tt-bg px-4 py-1.5 text-[13px] font-medium hover:opacity-90 transition-opacity"
            >
              Next
              <ChevronRight className="size-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                const val = parseFloat(amount);
                if (!val || val <= 0) {
                  handleSkip();
                  return;
                }
                router.post(
                  "/onboarding/set_initial_balances",
                  {
                    currency: selectedCurrency,
                    balances: { [incomeBucket!.id]: amount },
                  },
                  { preserveScroll: true },
                );
              }}
              className="bg-tt-text text-tt-bg px-4 py-1.5 text-[13px] font-medium hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


function BucketCards({
  buckets,
  currencySymbol,
}: {
  buckets: Bucket[];
  currencySymbol: string;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  function handleCreateBucket() {
    const name = newName.trim();
    if (!name) return;
    router.post(
      "/buckets",
      { name },
      {
        onFinish: () => {
          setNewName("");
          setIsAdding(false);
        },
      },
    );
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleCreateBucket();
    } else if (e.key === "Escape") {
      setIsAdding(false);
      setNewName("");
    }
  }

  if (buckets.length === 0) return null;

  return (
    <section className="pt-2 pb-2">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] font-medium tracking-wide uppercase text-tt-text-tertiary">
          Buckets
        </p>
        {buckets.length > 1 && (
          <TransferDialog buckets={buckets} currencySymbol={currencySymbol} size="sm" />
        )}
      </div>
      <div className="flex gap-3.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {buckets.map((bucket) => (
          <Link
            key={bucket.id}
            href={`/buckets/${bucket.slug}`}
            className="group shrink-0 min-w-[140px] rounded-xl border border-tt-border bg-tt-surface px-5 py-4 transition-all duration-150 hover:border-tt-text-tertiary/40 hover:shadow-sm active:scale-[0.97]"
          >
            <p className="text-[12px] text-tt-text-tertiary group-hover:text-tt-text-secondary transition-colors">
              {bucket.name}
            </p>
            <p className="mt-2.5 text-[17px] font-semibold tracking-tight text-tt-text">
              {formatCurrency(bucket.balance, currencySymbol)}
            </p>
          </Link>
        ))}
        {isAdding ? (
          <div
            className="shrink-0 min-w-[140px] rounded-xl border border-tt-text/20 bg-tt-surface px-5 py-4 flex flex-col justify-between"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsAdding(false);
                setNewName("");
              }
            }}
          >
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Name..."
              className="w-full border-0 bg-transparent p-0 text-[13px] text-tt-text placeholder:text-tt-text-tertiary/50 focus:outline-none focus:ring-0 font-medium"
            />
            <div className="mt-2.5 flex items-center justify-between border-t border-tt-border-subtle pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewName("");
                }}
                className="text-[11px] text-tt-text-tertiary hover:text-tt-text transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateBucket}
                disabled={!newName.trim()}
                className="text-[11px] text-tt-accent font-semibold hover:opacity-85 transition-opacity disabled:opacity-30 disabled:pointer-events-none"
              >
                Create
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="group shrink-0 min-w-[140px] rounded-xl border border-dashed border-tt-text-tertiary/30 px-5 py-4 flex flex-col items-center justify-center transition-all duration-150 hover:border-tt-text-tertiary/60 active:scale-[0.97] focus:outline-none"
          >
            <Plus className="size-5 text-tt-text-tertiary group-hover:text-tt-text-secondary transition-colors" />
            <p className="mt-1 text-[11px] text-tt-text-tertiary group-hover:text-tt-text-secondary transition-colors">
              New bucket
            </p>
          </button>
        )}
      </div>
    </section>
  );
}

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

  useEffect(() => {
    if (flash?.notice) {
      const transferMatch = flash.notice.match(/^Transferred .+ to (.+)$/)
      if (transferMatch) {
        const targetName = transferMatch[1]
        const targetBucket = buckets.find(b => b.name === targetName)
        toast.success(flash.notice, {
          id: "flash-notice",
          ...(targetBucket && {
            action: {
              label: `Go to ${targetBucket.name}`,
              onClick: () => router.visit(`/buckets/${targetBucket.slug}`),
            },
          }),
        })
      } else {
        toast.success(flash.notice, { id: "flash-notice" })
      }
    }
    if (flash?.alert) toast.error(flash.alert, { id: "flash-alert" });
  }, [flash?.notice, flash?.alert]);

  const displayName = user.name || user.email.split("@")[0];

  return (
    <div className="min-h-screen bg-tt-bg pb-20">
      <header className="sticky top-0 z-30 bg-tt-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between px-6 py-5">
          <span className="text-[15px] font-semibold tracking-tight text-tt-text">
            TheTrack
          </span>
          <span className="text-[13px] text-tt-text-tertiary">
            {displayName}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-6 pb-20">
        {!onboarded ? (
          <>
            <OnboardingCard
              buckets={buckets}
              currencySymbol={currency_symbol}
              currencies={currencies}
              currentCurrency={currency}
              userName={user.name}
            />
          </>
        ) : (
          <>
            <section className="pt-4 pb-10">
              <p className="text-[13px] font-medium tracking-wide uppercase text-tt-text-tertiary">
                Total Balance
              </p>
              <p className="mt-2 text-[3.25rem] font-semibold leading-none tracking-tighter text-tt-text">
                {formatCurrency(total_balance, currency_symbol)}
              </p>
            </section>

            <BucketCards buckets={buckets} currencySymbol={currency_symbol} />

            {recent_transactions.length === 0 && (
              <div className="mt-8 text-center text-sm text-tt-text-tertiary">
                Your buckets are empty. Tap{" "}
                <span className="text-tt-text-secondary font-medium">
                  Income
                </span>{" "}
                above and add what you've got.
              </div>
            )}

            {recent_transactions.length > 0 && (
              <section className="mt-10">
                <p className="mb-4 text-[13px] font-medium tracking-wide uppercase text-tt-text-tertiary">
                  Recent
                </p>
                {recent_transactions.map((txn) => {
                  const amount = parseFloat(txn.amount);
                  const isPositive = amount > 0;
                  const isTransfer = !!txn.transfer_group_id;
                  return (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between border-b border-tt-border-subtle py-3.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {isTransfer && (
                            <ArrowLeftRight className="size-3 shrink-0 text-tt-text-tertiary" />
                          )}
                          <p className="truncate text-sm text-tt-text">
                            {txn.description ||
                              (isTransfer ? "Transfer" : "Transaction")}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[12px] text-tt-text-tertiary">
                          {txn.bucket.name} · {formatDate(txn.occurred_at)}
                        </p>
                      </div>
                      <span
                        className={classNames(
                          "ml-4 shrink-0 text-sm tracking-tight",
                          isPositive ? "text-tt-positive" : "text-tt-negative",
                        )}
                      >
                        {isPositive ? "+" : "-"}
                        {formatCurrency(txn.amount, currency_symbol)}
                      </span>
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}
      </main>
      {onboarded && <BottomNavbar />}
    </div>
  );
}
