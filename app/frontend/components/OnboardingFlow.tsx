import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { router } from "@inertiajs/react";
import type { Bucket, CurrencyOption } from "@/types";
import { parseAmountWithSuffix } from "@/lib/format";

type OnboardingFlowProps = {
  buckets: Bucket[];
  currencySymbol: string;
  currencies: CurrencyOption[];
  currentCurrency: string;
  userName: string | null;
  onComplete: () => void;
};

export function OnboardingFlow({
  buckets,
  currencySymbol,
  currencies,
  currentCurrency,
  userName,
  onComplete,
}: OnboardingFlowProps) {
  const [step, setStep] = useState<"currency" | "balance">("currency");
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);
  const balanceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "balance" && balanceInputRef.current) {
      balanceInputRef.current.focus();
    }
  }, [step]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const parsedVal = parseAmountWithSuffix(amount);
      if (!parsedVal || parsedVal <= 0) {
        handleSaveOnboarding(null);
      } else {
        handleSaveOnboarding(parsedVal.toString());
      }
    }
  }

  const incomeBucket = buckets.find((b) => b.slug === "income");

  const displaySymbol =
    currencies.find((c) => c.code === selectedCurrency)?.symbol ||
    currencySymbol;

  function handleNextStep() {
    setStep("balance");
  }

  function handleSaveOnboarding(startingBalance: string | null) {
    const balances: Record<number, string> = {};
    if (startingBalance && incomeBucket) {
      balances[incomeBucket.id] = startingBalance;
    }

    router.post(
      "/onboarding/set_initial_balances",
      { currency: selectedCurrency, balances },
      {
        preserveScroll: true,
        onSuccess: () => {
          onComplete();
        },
      }
    );
  }

  if (step === "currency") {
    return (
      <div className="py-12">
        <div className="border border-dashed border-tt-text-tertiary/40 bg-tt-surface">
          <div className="px-5 pt-5 pb-4">
            <p className="text-[17px] font-semibold text-tt-text tracking-tight">
              {userName ? `Hey ${userName}.` : "Get started."}
            </p>
            <p className="text-[13px] text-tt-text-tertiary mt-1.5 leading-relaxed">
              Welcome to TheTrack. Let's configure your space in two simple steps.
            </p>
          </div>

          <div className="border-t border-dashed border-tt-text-tertiary/30" />

          <div className="px-5 py-4">
            <p className="text-[12px] font-semibold text-tt-text-secondary mb-2.5">
              Pick your currency
            </p>
            <p className="text-[11px] text-tt-text-tertiary mb-3">
              Change it anytime from settings.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {currencies.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setSelectedCurrency(c.code)}
                  className={
                    selectedCurrency === c.code
                      ? "px-2.5 py-1 text-[13px] bg-tt-text text-tt-bg font-medium transition-all duration-75 cursor-pointer"
                      : "px-2.5 py-1 text-[13px] bg-tt-bg text-tt-text-secondary hover:text-tt-text transition-all duration-75 cursor-pointer"
                  }
                >
                  {c.symbol} {c.code}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-dashed border-tt-text-tertiary/30" />

          <div className="flex items-center justify-end px-5 py-3.5">
            <button
              onClick={handleNextStep}
              className="flex items-center gap-1 bg-tt-text text-tt-bg px-4 py-1.5 text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="border border-dashed border-tt-text-tertiary/40 bg-tt-surface">
        <div className="px-5 pt-5 pb-4">
          <p className="text-[17px] font-semibold text-tt-text tracking-tight">
            Starting Balance
          </p>
          <p className="text-[13px] text-tt-text-tertiary mt-1.5 leading-relaxed">
            Specify any funds you currently hold. This amount will be added to your Income bucket.
          </p>
        </div>

        <div className="border-t border-dashed border-tt-text-tertiary/30" />

        <div className="px-5 py-4">
          <p className="text-[12px] font-semibold text-tt-text-secondary mb-2.5">
            What do you have right now?
          </p>
          <div className="flex items-center gap-2 border border-dashed border-tt-text-tertiary/30 bg-tt-bg px-3 py-2">
            <span className="text-sm text-tt-text-tertiary">{displaySymbol}</span>
            <input
              ref={balanceInputRef}
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              className="flex-1 border-0 bg-transparent p-0 text-xl tracking-tight text-tt-text placeholder:text-tt-text-tertiary/30 focus:outline-none focus:ring-0"
            />
          </div>
          <p className="text-[11px] text-tt-text-tertiary mt-1.5">
            Goes into Income. Move it around later.
          </p>
        </div>

        <div className="border-t border-dashed border-tt-text-tertiary/30" />

        <div className="flex items-center justify-between px-5 py-3.5">
          <button
            type="button"
            onClick={() => handleSaveOnboarding(null)}
            className="text-[12px] text-tt-text-tertiary hover:text-tt-text transition-colors cursor-pointer"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => {
              const parsedVal = parseAmountWithSuffix(amount);
              if (!parsedVal || parsedVal <= 0) {
                handleSaveOnboarding(null);
              } else {
                handleSaveOnboarding(parsedVal.toString());
              }
            }}
            className="bg-tt-text text-tt-bg px-4 py-1.5 text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

