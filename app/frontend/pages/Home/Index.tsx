import { usePage, Link, Head } from "@inertiajs/react";
import { useState, useRef, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  ArrowLeftRight,
  ArrowUp,
  Wallet,
  Banknote,
  CircleDollarSign,
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
  { id: 1, description: "salary", amount: 450000, bucket: "Income" },
  { id: 2, description: "groceries", amount: -340, bucket: "Daily" },
  { id: 3, description: "auto rickshaw", amount: -120, bucket: "Daily" },
  { id: 4, description: "chai", amount: -20, bucket: "Daily" },
];

const REVEAL_VARIANT = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const STAGGER_CONTAINER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
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
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
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
                className="bg-white text-[#1a1a1d] px-4 py-1.5 text-sm font-medium hover:bg-white/90 transition-all rounded-lg"
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

function ProductShowcase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      className="relative w-full pt-4 sm:pt-6 mt-6 sm:mt-12 border-t border-dashed border-tt-border"
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
  const [incomeBalance, setIncomeBalance] = useState(450000);
  const [dailyBalance, setDailyBalance] = useState(23763);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [activeBucket, setActiveBucket] = useState("Daily");
  const [transactions, setTransactions] = useState<DemoTransaction[]>(SEED_TRANSACTIONS);
  const [input, setInput] = useState("");

  const nextId = useRef(SEED_TRANSACTIONS.length + 1);

  const totalBalance = incomeBalance + dailyBalance + savingsBalance;

  function handleSubmit() {
    const raw = input.trim();
    if (!raw) return;

    if (raw.toLowerCase().startsWith("move ") || raw.toLowerCase().startsWith("transfer ")) {
      const parts = raw.split(/\s+/);
      const amtIndex = parts.findIndex((p) => /^\d+$/.test(p));
      if (amtIndex !== -1) {
        const amt = parseFloat(parts[amtIndex]);
        const target = parts[parts.length - 1].toLowerCase();

        if (amt <= 0) return;

        if (target === "savings" || target === "save") {
          if (dailyBalance >= amt) {
            setDailyBalance((d) => d - amt);
            setSavingsBalance((s) => s + amt);
            setTransactions((prev) => [
              {
                id: nextId.current++,
                description: "Transfer to Savings",
                amount: -amt,
                bucket: "Daily",
                isTransfer: true,
              },
              {
                id: nextId.current++,
                description: "Transfer from Daily",
                amount: amt,
                bucket: "Savings",
                isTransfer: true,
              },
              ...prev,
            ]);
            setInput("");
            toast.success(`Transferred ₹${amt.toLocaleString("en-IN")} to Savings`);
          } else {
            toast.error(`Not enough in Daily. You only have ₹${dailyBalance.toLocaleString("en-IN")} available.`);
          }
          return;
        } else if (target === "daily" || target === "spend") {
          if (savingsBalance >= amt) {
            setSavingsBalance((s) => s - amt);
            setDailyBalance((d) => d + amt);
            setTransactions((prev) => [
              {
                id: nextId.current++,
                description: "Transfer to Daily",
                amount: -amt,
                bucket: "Savings",
                isTransfer: true,
              },
              {
                id: nextId.current++,
                description: "Transfer from Savings",
                amount: amt,
                bucket: "Daily",
                isTransfer: true,
              },
              ...prev,
            ]);
            setInput("");
            toast.success(`Transferred ₹${amt.toLocaleString("en-IN")} to Daily`);
          } else {
            toast.error(`Not enough in Savings. You only have ₹${savingsBalance.toLocaleString("en-IN")} available.`);
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
          toast.error("Couldn't make sense of that: try something like '-20 chai' or '+500 salary'");
          return;
        }
      }
    }

    if (Math.abs(amt) > 9999999) {
      toast.error("That number is way too large: keep it under 10 million");
      return;
    }

    if (amt < 0) {
      const cost = Math.abs(amt);
      if (activeBucket === "Daily" && dailyBalance >= cost) {
        setDailyBalance((d) => d - cost);
        setTransactions((prev) => [
          { id: nextId.current++, description: desc, amount: amt, bucket: "Daily" },
          ...prev,
        ]);
        setInput("");
      } else if (activeBucket === "Income" && incomeBalance >= cost) {
        setIncomeBalance((i) => i - cost);
        setTransactions((prev) => [
          { id: nextId.current++, description: desc, amount: amt, bucket: "Income" },
          ...prev,
        ]);
        setInput("");
      } else if (activeBucket === "Savings" && savingsBalance >= cost) {
        setSavingsBalance((s) => s - cost);
        setTransactions((prev) => [
          { id: nextId.current++, description: desc, amount: amt, bucket: "Savings" },
          ...prev,
        ]);
        setInput("");
      } else {
        const currentVal = activeBucket === "Daily" ? dailyBalance : activeBucket === "Income" ? incomeBalance : savingsBalance;
        toast.error(`Not enough in ${activeBucket}. You only have ₹${currentVal.toLocaleString("en-IN")} available.`);
      }
    } else {
      if (activeBucket === "Daily") {
        setDailyBalance((d) => d + amt);
      } else if (activeBucket === "Income") {
        setIncomeBalance((i) => i + amt);
      } else {
        setSavingsBalance((s) => s + amt);
      }
      setTransactions((prev) => [
        { id: nextId.current++, description: desc, amount: amt, bucket: activeBucket },
        ...prev,
      ]);
      setInput("");
    }
  }

  function handleRemove(txn: DemoTransaction) {
    if (txn.isTransfer) {
      toast.error("Transfer transactions cannot be deleted individually: reset or perform transfer to reverse.");
      return;
    }

    if (txn.amount > 0) {
      if (txn.bucket === "Income" && incomeBalance >= txn.amount) {
        setIncomeBalance((i) => i - txn.amount);
        setTransactions((prev) => prev.filter((t) => t.id !== txn.id));
      } else if (txn.bucket === "Daily" && dailyBalance >= txn.amount) {
        setDailyBalance((d) => d - txn.amount);
        setTransactions((prev) => prev.filter((t) => t.id !== txn.id));
      } else if (txn.bucket === "Savings" && savingsBalance >= txn.amount) {
        setSavingsBalance((s) => s - txn.amount);
        setTransactions((prev) => prev.filter((t) => t.id !== txn.id));
      } else {
        toast.error(`Cannot delete: would result in negative balance in ${txn.bucket}.`);
      }
    } else {
      const refund = Math.abs(txn.amount);
      if (txn.bucket === "Daily") {
        setDailyBalance((d) => d + refund);
      } else if (txn.bucket === "Income") {
        setIncomeBalance((i) => i + refund);
      } else {
        setSavingsBalance((s) => s + refund);
      }
      setTransactions((prev) => prev.filter((t) => t.id !== txn.id));
    }
  }

  return (
    <div className="w-full text-left">
      <div>
        <p className="text-[10px] font-medium tracking-wider uppercase text-tt-text-tertiary">
          Total Balance
        </p>
        <p className="mt-1 text-[36px] font-bold text-tt-text flex items-center">
          <span className="mr-0.5 text-tt-text-secondary font-normal">₹</span>
          <Odometer value={totalBalance} />
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-1.5 sm:grid sm:grid-cols-3 sm:gap-3">
        <button
          onClick={() => setActiveBucket("Income")}
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
            <Odometer value={incomeBalance} />
          </p>
        </button>
        <button
          onClick={() => setActiveBucket("Daily")}
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
            <Odometer value={dailyBalance} />
          </p>
        </button>
        <button
          onClick={() => setActiveBucket("Savings")}
          className={`border text-left rounded-xl p-3 sm:p-3.5 transition-all duration-200 cursor-pointer flex items-center justify-between sm:block ${
            activeBucket === "Savings"
              ? "border-tt-text bg-white shadow-xs"
              : "border-tt-border-subtle bg-transparent hover:bg-white/40"
          }`}
        >
          <p className="text-[10px] text-tt-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
            <CircleDollarSign className="size-3 text-tt-text-tertiary" />
            Savings
          </p>
          <p className="sm:mt-1.5 text-[15px] font-semibold text-tt-text tracking-tight flex items-center">
            <span className="mr-0.5 text-tt-text-secondary font-normal">₹</span>
            <Odometer value={savingsBalance} />
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
                onClick={() => handleRemove(txn)}
                className="group flex items-center justify-between py-2 cursor-pointer hover:bg-tt-bg/30 px-2 -mx-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  {txn.isTransfer && <ArrowLeftRight className="size-3 text-tt-text-secondary shrink-0" />}
                  <span className="text-[13px] text-tt-text group-hover:text-red-500/80 transition-colors">
                    {txn.description}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[13px] font-medium tracking-tight ${
                      txn.amount > 0 ? "text-tt-positive/90" : "text-tt-text/80"
                    }`}
                  >
                    {txn.amount > 0 ? "+" : ""}
                    {txn.amount.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-transparent group-hover:text-tt-text-tertiary transition-colors font-semibold font-sans">
                    ✕
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-3 rounded-xl border border-tt-border-subtle bg-white pl-4 pr-1.5 py-1.5 focus-within:border-tt-text/40 transition-all duration-200">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder={`Add to ${activeBucket}...`}
            autoFocus
            className="flex-1 min-w-0 border-0 bg-transparent text-[13px] text-tt-text placeholder-tt-text-tertiary/60 focus:outline-none focus:ring-0 p-0 font-sans"
          />
          <button
            onClick={handleSubmit}
            onMouseDown={(e) => e.preventDefault()}
            disabled={!input.trim()}
            className="shrink-0 size-8 rounded-lg bg-tt-text text-white hover:bg-tt-text/90 transition-all disabled:opacity-25 flex items-center justify-center cursor-pointer"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
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

      <section className="relative flex flex-col pt-36 sm:min-h-screen sm:justify-between pb-0">
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl pointer-events-none">
          <div className="absolute left-3 sm:left-4 top-0 bottom-0 border-l border-tt-border border-dashed" />
          <div className="absolute right-3 sm:right-4 top-0 bottom-0 border-r border-tt-border border-dashed" />
        </div>

        <div className="mx-auto max-w-4xl text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={STAGGER_CONTAINER}
            className="relative"
          >
            <motion.h1
              variants={REVEAL_VARIANT}
              className="text-[42px] sm:text-[64px] lg:text-[84px] font-bold tracking-[-0.04em] leading-[1.05] text-[#18181b]"
            >
              Know where your money is.
            </motion.h1>

            <motion.p
              variants={REVEAL_VARIANT}
              className="mt-6 text-base sm:text-[18px] text-[#71717a] leading-relaxed max-w-2xl mx-auto"
            >
              Track where your money comes from, where it goes, and where it stays.
            </motion.p>

            <motion.div
              variants={REVEAL_VARIANT}
              className="mt-8 flex items-center justify-center gap-4"
            >
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="bg-[#18181b] text-white px-6 py-2.5 text-sm font-semibold rounded-lg hover:bg-[#222225] transition-colors"
                >
                  Go to dashboard →
                </Link>
              ) : (
                <>
                  <Link
                    href="/users/sign_up"
                    className="bg-[#18181b] text-white px-6 py-2.5 text-sm font-semibold rounded-lg hover:bg-[#222225] transition-colors"
                  >
                    Start tracking
                  </Link>
                  <button
                    onClick={() =>
                      demoRef.current?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="border border-[#e0dbd2] bg-white text-[#18181b] px-6 py-2.5 text-sm font-semibold rounded-lg hover:bg-[#fcfcfb] transition-colors cursor-pointer"
                  >
                    Try demo
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>

        <ProductShowcase />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-linear-to-t from-[#f4f1eb] to-transparent pointer-events-none" />

      </section>

      <section
        ref={demoRef}
        id="demo"
        className="relative py-6 sm:py-24 border-t border-b border-tt-border bg-[#fdfdfc]/50"
      >
        <div className="relative mx-auto max-w-5xl px-6 flex flex-col md:flex-row gap-12 items-start justify-between">
          <div className="w-full md:w-1/3 flex flex-col justify-center min-h-[160px]">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-tt-text text-left">
              See it in action.
            </h2>
            <p className="mt-4 text-[13px] text-tt-text-secondary leading-relaxed text-left font-sans">
              Input a transaction, add bucket stashes, and watch balances adjust in real time. Click any item to remove it.
            </p>
          </div>

          <div className="w-full md:w-2/3">
            <InteractiveDemo />
          </div>
        </div>
      </section>
      <LandingFooter />
      <Toaster position="top-right" />
    </div>
  );
}
