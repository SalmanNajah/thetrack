import { usePage, Link, Head } from "@inertiajs/react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  ArrowLeftRight,
  ArrowUp,
  Wallet,
  Banknote,
  TrendingUp,
  Eye,
  EyeOff,
} from "lucide-react";
import dashboardPng from "@/assets/images/dashboard.png";
import { Odometer } from "@/components/Odometer";

type DemoTransaction = {
  id: number;
  description: string;
  amount: number;
  bucket: string;
  isTransfer?: boolean;
};

const SEED_TRANSACTIONS: DemoTransaction[] = [
  { id: 1, description: "salary", amount: 175000, bucket: "Income" },
  { id: 2, description: "freelance", amount: 25000, bucket: "Income" },
  { id: 3, description: "groceries", amount: -340, bucket: "Daily" },
  { id: 4, description: "cab", amount: -120, bucket: "Daily" },
  { id: 5, description: "chai", amount: -20, bucket: "Daily" },
];

const REVEAL_VARIANT = {
  hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const STAGGER_CONTAINER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};

function LandingNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1d] border-b border-[#2a2a2e] shadow-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-6">
        <span className="text-[15px] font-semibold tracking-tight text-white">
          TheTrack
        </span>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="bg-white text-[#1a1a1d] px-4 py-1.5 text-sm font-medium hover:bg-white/90 transition-all rounded-full"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/users/sign_in"
                className="text-sm font-medium text-white/60 hover:text-white transition-colors hidden sm:block"
              >
                Login
              </Link>
              <Link
                href="/users/sign_up"
                className="bg-white text-[#1a1a1d] px-4 py-1.5 text-sm font-medium hover:bg-white/90 transition-all rounded-full"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function ProductShowcase({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] as const }}
      className="relative w-full pt-4 sm:pt-6 mt-10 sm:mt-12 border-t border-dashed border-tt-border"
    >
      <div className="max-w-5xl mx-auto px-6 sm:px-8 relative">
        <div className="relative rounded-md md:rounded-2xl border border-tt-border bg-white p-1 md:p-2">
          <div className="relative rounded-sm md:rounded-md border border-tt-border bg-tt-bg overflow-hidden">
            <img
              src={dashboardPng}
              alt="TheTrack Dashboard"
              className="w-full h-auto block object-cover select-none pointer-events-none"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InteractiveDemo() {
  const [incomeBalance, setIncomeBalance] = useState(200000);
  const [dailyBalance, setDailyBalance] = useState(24520);
  const [investmentsBalance, setInvestmentsBalance] = useState(96000);
  const [activeBucket, setActiveBucket] = useState("Daily");
  const [transactions, setTransactions] =
    useState<DemoTransaction[]>(SEED_TRANSACTIONS);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const nextId = useRef(SEED_TRANSACTIONS.length + 1);
  const [hideBalances, setHideBalances] = useState(false);
  const toggleBalances = () => setHideBalances(!hideBalances);

  const totalBalance = incomeBalance + dailyBalance + investmentsBalance;

  function handleBucketClick(bucketName: string) {
    setActiveBucket(bucketName);
    inputRef.current?.focus();
  }

  function handleSubmit() {
    const raw = input.trim();
    if (!raw) return;

    inputRef.current?.focus();

    if (
      raw.toLowerCase().startsWith("move ") ||
      raw.toLowerCase().startsWith("transfer ")
    ) {
      const parts = raw.split(/\s+/);
      const amtIndex = parts.findIndex((p) => /^\d+$/.test(p));
      if (amtIndex !== -1) {
        const amt = parseFloat(parts[amtIndex]);
        const target = parts[parts.length - 1].toLowerCase();

        if (amt <= 0) return;

        if (
          target === "investments" ||
          target === "invest" ||
          target === "savings" ||
          target === "save"
        ) {
          if (dailyBalance >= amt) {
            setDailyBalance((d) => d - amt);
            setInvestmentsBalance((s) => s + amt);
            setTransactions((prev) => [
              {
                id: nextId.current++,
                description: "Transfer to Investments",
                amount: -amt,
                bucket: "Daily",
                isTransfer: true,
              },
              {
                id: nextId.current++,
                description: "Transfer from Daily",
                amount: amt,
                bucket: "Investments",
                isTransfer: true,
              },
              ...prev,
            ]);
            setInput("");
            toast.success(
              `Transferred ₹${amt.toLocaleString("en-IN")} to Investments`,
            );
          } else {
            toast.error(
              `Not enough in Daily. You only have ₹${dailyBalance.toLocaleString("en-IN")} available.`,
            );
          }
          return;
        } else if (target === "daily" || target === "spend") {
          if (investmentsBalance >= amt) {
            setInvestmentsBalance((s) => s - amt);
            setDailyBalance((d) => d + amt);
            setTransactions((prev) => [
              {
                id: nextId.current++,
                description: "Transfer to Daily",
                amount: -amt,
                bucket: "Investments",
                isTransfer: true,
              },
              {
                id: nextId.current++,
                description: "Transfer from Investments",
                amount: amt,
                bucket: "Daily",
                isTransfer: true,
              },
              ...prev,
            ]);
            setInput("");
            toast.success(
              `Transferred ₹${amt.toLocaleString("en-IN")} to Daily`,
            );
          } else {
            toast.error(
              `Not enough in Investments. You only have ₹${investmentsBalance.toLocaleString("en-IN")} available.`,
            );
          }
          return;
        }
      }
    }

    const prefixMatch = raw.match(/^([+-]?\d+(?:\.\d+)?)\s+(.+)$/);
    let amt = 0;
    let desc = "expense";

    if (prefixMatch) {
      amt = parseFloat(prefixMatch[1]);
      desc = prefixMatch[2];
    } else {
      const suffixMatch = raw.match(/^(.+?)\s+([+-]?\d+(?:\.\d+)?)$/);
      if (suffixMatch) {
        amt = parseFloat(suffixMatch[2]);
        desc = suffixMatch[1];
      } else {
        const numberOnly = raw.match(/^([+-]?\d+(?:\.\d+)?)$/);
        if (numberOnly) {
          amt = parseFloat(numberOnly[1]);
        } else {
          toast.error(
            "Couldn't make sense of that: try something like '-20 chai' or '+500 salary'",
          );
          return;
        }
      }
    }

    if (Math.abs(amt) > 9999999999) {
      toast.error("That number is way too large: keep it under 10 billion");
      return;
    }

    if (amt < 0) {
      const cost = Math.abs(amt);
      if (activeBucket === "Daily" && dailyBalance >= cost) {
        setDailyBalance((d) => d - cost);
        setTransactions((prev) => [
          {
            id: nextId.current++,
            description: desc,
            amount: amt,
            bucket: "Daily",
          },
          ...prev,
        ]);
        setInput("");
      } else if (activeBucket === "Income" && incomeBalance >= cost) {
        setIncomeBalance((i) => i - cost);
        setTransactions((prev) => [
          {
            id: nextId.current++,
            description: desc,
            amount: amt,
            bucket: "Income",
          },
          ...prev,
        ]);
        setInput("");
      } else if (activeBucket === "Investments" && investmentsBalance >= cost) {
        setInvestmentsBalance((s) => s - cost);
        setTransactions((prev) => [
          {
            id: nextId.current++,
            description: desc,
            amount: amt,
            bucket: "Investments",
          },
          ...prev,
        ]);
        setInput("");
      } else {
        const currentVal =
          activeBucket === "Daily"
            ? dailyBalance
            : activeBucket === "Income"
              ? incomeBalance
              : investmentsBalance;
        toast.error(
          `Not enough in ${activeBucket}. You only have ₹${currentVal.toLocaleString("en-IN")} available.`,
        );
      }
    } else {
      if (activeBucket === "Daily") {
        setDailyBalance((d) => d + amt);
      } else if (activeBucket === "Income") {
        setIncomeBalance((i) => i + amt);
      } else {
        setInvestmentsBalance((s) => s + amt);
      }
      setTransactions((prev) => [
        {
          id: nextId.current++,
          description: desc,
          amount: amt,
          bucket: activeBucket,
        },
        ...prev,
      ]);
      setInput("");
    }
  }

  return (
    <div className="w-full text-left">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-medium tracking-wider uppercase text-tt-text-tertiary">
            Total Balance
          </p>
          <button
            type="button"
            onClick={toggleBalances}
            className="text-tt-text-tertiary hover:text-tt-text-secondary transition-colors focus:outline-none cursor-pointer"
            aria-label={hideBalances ? "Show balances" : "Hide balances"}
          >
            {hideBalances ? (
              <EyeOff className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
          </button>
        </div>
        <p className="mt-1 text-[36px] font-bold text-tt-text flex items-center">
          <span className="mr-0.5 text-tt-text-secondary font-normal">₹</span>
          <Odometer value={totalBalance} masked={hideBalances} />
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-1.5 sm:grid sm:grid-cols-3 sm:gap-3">
        <button
          onClick={() => handleBucketClick("Income")}
          className={`border text-left rounded-xl p-3 sm:p-3.5 transition-all duration-200 cursor-pointer flex items-center justify-between sm:block ${
            activeBucket === "Income"
              ? "border-tt-text bg-white shadow-xs"
              : "border-tt-border-subtle bg-transparent hover:bg-white/40"
          }`}
        >
          <p className="text-[10px] text-tt-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="size-3 text-tt-text-tertiary" />
            Income
          </p>
          <p className="sm:mt-1.5 text-[15px] font-semibold text-tt-text tracking-tight flex items-center">
            <span className="mr-0.5 text-tt-text-secondary font-normal">₹</span>
            <Odometer value={incomeBalance} masked={hideBalances} />
          </p>
        </button>
        <button
          onClick={() => handleBucketClick("Daily")}
          className={`border text-left rounded-xl p-3 sm:p-3.5 transition-all duration-200 cursor-pointer flex items-center justify-between sm:block ${
            activeBucket === "Daily"
              ? "border-tt-text bg-white shadow-xs"
              : "border-tt-border-subtle bg-transparent hover:bg-white/40"
          }`}
        >
          <p className="text-[10px] text-tt-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
            <Banknote className="size-3 text-tt-text-tertiary" />
            Daily
          </p>
          <p className="sm:mt-1.5 text-[15px] font-semibold text-tt-text tracking-tight flex items-center">
            <span className="mr-0.5 text-tt-text-secondary font-normal">₹</span>
            <Odometer value={dailyBalance} masked={hideBalances} />
          </p>
        </button>
        <button
          onClick={() => handleBucketClick("Investments")}
          className={`border text-left rounded-xl p-3 sm:p-3.5 transition-all duration-200 cursor-pointer flex items-center justify-between sm:block ${
            activeBucket === "Investments"
              ? "border-tt-text bg-white shadow-xs"
              : "border-tt-border-subtle bg-transparent hover:bg-white/40"
          }`}
        >
          <p className="text-[10px] text-tt-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="size-3 text-tt-text-tertiary" />
            Investments
          </p>
          <p className="sm:mt-1.5 text-[15px] font-semibold text-tt-text tracking-tight flex items-center">
            <span className="mr-0.5 text-tt-text-secondary font-normal">₹</span>
            <Odometer value={investmentsBalance} masked={hideBalances} />
          </p>
        </button>
      </div>

      <div className="mt-8">
        <p className="text-[10px] font-medium tracking-wider uppercase text-tt-text-tertiary mb-3">
          Recent Transactions
        </p>
        <div className="max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
          <AnimatePresence initial={false}>
            {transactions.map((txn) => (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between py-2 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {txn.isTransfer && (
                    <ArrowLeftRight className="size-3 text-tt-text-secondary shrink-0" />
                  )}
                  <span className="text-[13px] text-tt-text">
                    {txn.description}
                  </span>
                  <span className="text-[9px] font-medium tracking-wider uppercase text-tt-text-tertiary bg-[#18181b]/5 px-1.5 py-0.5 rounded-sm select-none font-sans">
                    {txn.bucket}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[13px] font-medium tracking-tight ${
                      txn.amount > 0 ? "text-tt-positive/90" : "text-tt-text/80"
                    }`}
                  >
                    {hideBalances ? (
                      <>
                        {txn.amount > 0 ? "+" : "-"}
                        {Math.abs(txn.amount).toLocaleString("en-IN").replace(/\d/g, "X")}
                      </>
                    ) : (
                      <>
                        {txn.amount > 0 ? "+" : ""}
                        {txn.amount.toLocaleString("en-IN")}
                      </>
                    )}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="mt-6"
      >
        <div className="flex items-center gap-3 rounded-xl border border-tt-border-subtle bg-white pl-4 pr-1.5 py-1.5 focus-within:border-tt-text/40 transition-all duration-200">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder={`Add to ${activeBucket}...`}
            className="flex-1 min-w-0 border-0 bg-transparent text-[13px] text-tt-text placeholder-tt-text-tertiary/60 focus:outline-none focus:ring-0 p-0 font-sans"
          />
          <button
            type="submit"
            onMouseDown={(e) => e.preventDefault()}
            disabled={!input.trim()}
            className="shrink-0 size-8 rounded-lg bg-tt-text text-white hover:bg-tt-text/90 transition-all disabled:opacity-25 flex items-center justify-center cursor-pointer"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-[#2a2a2e] bg-[#1a1a1d] px-6">
      <div className="mx-auto max-w-5xl py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-[14px] font-bold tracking-tight text-white">
          TheTrack
        </span>
        <div className="flex flex-wrap gap-5 text-xs text-white/60">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <a href="#demo" className="hover:text-white transition-colors">
            Demo
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function Index() {
  const { auth } = usePage<{
    auth?: { user: { id: number; email: string } };
  }>().props;
  const isLoggedIn = !!auth?.user;
  const demoRef = useRef<HTMLElement>(null);

  return (
    <div className="min-h-screen bg-[#f4f1eb] text-[#18181b] overflow-x-hidden relative font-sans animate-fade-in">
      <Head>
        <title>TheTrack — Know where your money is</title>
        <meta
          name="description"
          content="Track where your money comes from, where it goes, and where it stays."
        />
      </Head>
      <LandingNav isLoggedIn={isLoggedIn} />

      <section className="relative flex flex-col pt-28 sm:pt-36 pb-0">
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl pointer-events-none">
          <div className="absolute left-3 sm:left-4 top-0 bottom-0 border-l border-tt-border border-dashed" />
          <div className="absolute right-3 sm:right-4 top-0 bottom-0 border-r border-tt-border border-dashed" />
        </div>

        <div className="mx-auto max-w-4xl text-center relative z-10 px-8 sm:px-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={STAGGER_CONTAINER}
            className="relative"
          >
            <motion.h1
              variants={REVEAL_VARIANT}
              className="text-[32px] sm:text-[64px] lg:text-[84px] font-bold tracking-[-0.03em] sm:tracking-[-0.04em] leading-[1.15] sm:leading-[1.05] text-[#18181b] text-pretty"
            >
              Know where your money is.
            </motion.h1>

            <motion.p
              variants={REVEAL_VARIANT}
              className="mt-4 sm:mt-6 text-sm sm:text-[18px] text-[#71717a] leading-relaxed max-w-2xl mx-auto text-pretty"
            >
              Track where your money comes from, where it goes, and where it
              stays.
            </motion.p>

            {isLoggedIn && (
              <motion.div
                variants={REVEAL_VARIANT}
                className="mt-8 flex items-center justify-center gap-4"
              >
                <Link
                  href="/dashboard"
                  className="bg-[#18181b] text-white px-6 py-2.5 text-sm font-semibold rounded-full"
                >
                  Go to dashboard →
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>

        <ProductShowcase delay={isLoggedIn ? 0.6 : 0.4} />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-linear-to-t from-[#f4f1eb] to-transparent pointer-events-none" />
      </section>

      <motion.section
        ref={demoRef}
        id="demo"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={STAGGER_CONTAINER}
        className="relative py-6 sm:py-24 border-t border-b border-tt-border bg-[#fdfdfc]/50"
      >
        <div className="relative mx-auto max-w-5xl px-6 flex flex-col md:flex-row gap-12 items-start justify-between">
          <motion.div
            variants={REVEAL_VARIANT}
            className="w-full md:w-1/3 flex flex-col justify-center min-h-[160px]"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-tt-text text-left">
              See it in action.
            </h2>
            <p className="mt-4 text-[13px] text-tt-text-secondary leading-relaxed text-left font-sans">
              Record where money came from. Record where it went. TheTrack keeps
              the totals up to date.
            </p>
          </motion.div>

          <motion.div variants={REVEAL_VARIANT} className="w-full md:w-2/3">
            <InteractiveDemo />
          </motion.div>
        </div>
      </motion.section>

      {!isLoggedIn && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={STAGGER_CONTAINER}
          className="relative py-16 sm:py-24"
        >
          <div className="mx-auto max-w-3xl text-center px-6">
            <motion.h2
              variants={REVEAL_VARIANT}
              className="text-2xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-[#18181b] text-pretty leading-tight"
            >
              TheTrack is the app I wanted for myself.
            </motion.h2>
            <motion.p
              variants={REVEAL_VARIANT}
              className="mt-4 text-base sm:text-lg text-[#52525b] leading-relaxed text-pretty"
            >
              Maybe it's what you're looking for too.
            </motion.p>
            <motion.div
              variants={REVEAL_VARIANT}
              className="mt-8 flex items-center justify-center gap-4"
            >
              <Link
                href="/users/sign_up"
                className="bg-[#18181b] text-white px-8 py-3 text-sm font-semibold rounded-full"
              >
                Start tracking
              </Link>
            </motion.div>
          </div>
        </motion.section>
      )}

      <LandingFooter />
      <Toaster position="top-right" />
    </div>
  );
}
