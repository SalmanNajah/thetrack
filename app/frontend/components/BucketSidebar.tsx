import { Link, router, usePage } from "@inertiajs/react";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Settings, LogOut, Plus, Home, HelpCircle, Receipt, Settings2 } from "lucide-react";
import { Odometer } from "@/components/Odometer";
import { formatCurrency } from "@/lib/format";
import { classNames } from "@/lib/utils";
import type { Bucket, AuthUser } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { ManageBucketsDialog } from "@/components/ManageBucketsDialog";

const KEYBOARD_SHORTCUTS = [
  { label: "Open search modal", key: "⌘K" },
  { label: "Focus transaction input", key: "/" },
  { label: "New transaction (focus input)", key: "⌘N" },
  { label: "Open transfer modal", key: "⌘T" },
  { label: "Close modals / Clear input", key: "Esc" },
  { label: "Show keyboard shortcuts", key: "?" },
];

type BucketSidebarProps = {
  buckets: Bucket[];
  totalBalance: string;
  currencySymbol: string;
  activeBucketSlug?: string;
};

export function BucketSidebar({
  buckets,
  totalBalance,
  currencySymbol,
  activeBucketSlug,
}: BucketSidebarProps) {
  const { url } = usePage();
  const {
    auth: { user },
  } = usePage<{
    auth: { user: AuthUser & { low_balance_threshold?: number } };
  }>().props;

  const searchParams = new URL(url, "http://localhost").searchParams;
  const rawBuckets = searchParams.get("buckets")?.split(",").filter(Boolean) || [];
  const selectedBucketSlugs = rawBuckets.map(raw => {
    const clean = raw.trim().toLowerCase();
    const found = buckets.find(b => b.slug.toLowerCase() === clean || b.name.toLowerCase() === clean);
    return found ? found.slug : null;
  }).filter((slug): slug is string => !!slug);

  function handleCheckboxToggle(slug: string, e: React.ChangeEvent<HTMLInputElement>) {
    e.stopPropagation();

    let currentBuckets = [...selectedBucketSlugs];
    let newBuckets: string[];
    if (currentBuckets.includes(slug)) {
      newBuckets = currentBuckets.filter((s) => s !== slug);
    } else {
      newBuckets = [...currentBuckets, slug];
    }

    const pinnedBuckets = buckets.filter((b) => b.pinned);

    if (newBuckets.length === pinnedBuckets.length || newBuckets.length === 0) {
      router.visit("/dashboard", {
        preserveState: true,
        preserveScroll: true,
      });
    } else {
      router.visit(`/dashboard?buckets=${newBuckets.join(",")}`, {
        preserveState: true,
        preserveScroll: true,
      });
    }
  }

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [manageBucketsOpen, setManageBucketsOpen] = useState(false);

  useEffect(() => {
    function handleGlobalKeyDown(e: globalThis.KeyboardEvent) {
      if (
        e.key === "?" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) inputRef.current.focus();
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
    if (e.key === "Enter") handleCreateBucket();
    if (e.key === "Escape") {
      setIsAdding(false);
      setNewName("");
    }
  }

  const displayName = user.name || user.email.split("@")[0];
  const initial = (user.name || user.email).charAt(0).toUpperCase();
  const numericBalance = parseFloat(totalBalance) || 0;
  const formatted = formatCurrency(numericBalance.toFixed(2), currencySymbol);
  const balanceFontSize =
    formatted.length > 14
      ? "text-[1.25rem]"
      : formatted.length > 11
        ? "text-[1.5rem]"
        : formatted.length > 8
          ? "text-[1.875rem]"
          : "text-[2.5rem]";

  const isOnDashboard = url.startsWith("/dashboard");
  const isOnSettings = url.startsWith("/settings");

  return (
    <div className="flex flex-col h-full bg-tt-sidebar-bg">
      <div className="px-5 pt-5 pb-4">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
        >
          <div className="size-7 bg-tt-text-secondary/15 flex items-center justify-center text-[12px] font-bold text-tt-text uppercase select-none group-hover:bg-tt-text-secondary/25 transition-all duration-100 active:scale-95">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-tt-text truncate group-hover:opacity-80 transition-opacity">
              {displayName}
            </p>
            <p className="text-[10px] text-tt-text-secondary truncate">
              {user.email}
            </p>
          </div>
        </Link>
      </div>

      <div className="border-t border-dashed border-tt-border" />

      <div className="px-5 py-4 flex flex-col gap-1">
        <p className="text-[11px] font-medium tracking-wider uppercase text-tt-text-tertiary">
          total balance
        </p>
        <p
          className={`${balanceFontSize} font-semibold leading-none tracking-tighter text-tt-text overflow-hidden`}
        >
          <Odometer value={formatted} />
        </p>
      </div>

      <div className="border-t border-dashed border-tt-border" />

      <nav className="flex-1 overflow-y-auto min-h-0 px-0 py-2 scrollbar-none">
        <Link
          href="/dashboard"
          className={classNames(
            "flex items-center gap-2.5 px-5 py-2.5 text-[13px] font-medium transition-all duration-100 mb-0.5 border-y",
            isOnDashboard && selectedBucketSlugs.length === 0
              ? "bg-white text-tt-text border-tt-border"
              : "text-tt-text-secondary hover:text-tt-text hover:bg-white/50 border-transparent",
          )}
        >
          <Home className="size-3.5" />
          Dashboard
        </Link>

        <div className="flex items-center justify-between px-5 py-1.5">
          <span className="text-[10px] font-medium tracking-wider uppercase text-tt-text-tertiary">
            Buckets
          </span>
          <button
            onClick={() => setManageBucketsOpen(true)}
            className="p-0.5 text-tt-text-tertiary hover:text-tt-text transition-colors cursor-pointer"
            title="Manage buckets"
          >
            <Settings2 className="size-3" />
          </button>
        </div>

        {buckets.filter((b) => b.pinned).map((bucket) => {
          const isActive = bucket.slug === activeBucketSlug;
          const isSelected = selectedBucketSlugs.includes(bucket.slug) || (selectedBucketSlugs.length === 0 && isActive);
          const bucketBalance = parseFloat(bucket.balance) || 0;
          const isLow =
            user.low_balance_threshold !== undefined &&
            bucketBalance < user.low_balance_threshold;

          return (
            <div
              key={bucket.id}
              className={classNames(
                "flex items-center justify-between px-5 py-2.5 transition-all duration-100 group border-y",
                isActive && selectedBucketSlugs.length === 0
                  ? "bg-white text-tt-text border-tt-border"
                  : "text-tt-text-secondary hover:text-tt-text hover:bg-white/50 border-transparent",
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleCheckboxToggle(bucket.slug, e)}
                  className="size-3.5 rounded border-tt-border text-tt-text focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer shrink-0"
                />
                <Link
                  href={`/dashboard?buckets=${bucket.slug}`}
                  className="text-[13px] font-medium truncate flex-1 block py-0.5"
                >
                  {bucket.name}
                </Link>
              </div>
              <span className={classNames(
                "text-[12px] shrink-0 ml-2 select-none",
                isLow ? "text-[#da8a09] font-medium" : "text-tt-text-secondary group-hover:text-tt-text"
              )}>
                <Odometer
                  value={formatCurrency(
                    bucketBalance.toFixed(2),
                    currencySymbol,
                  )}
                />
              </span>
            </div>
          );
        })}

        {isAdding ? (
          <div
            className="px-5 py-2"
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
              placeholder="Bucket name…"
              className="w-full border-0 bg-transparent p-0 text-[13px] text-tt-text placeholder:text-tt-text-tertiary/60 focus:outline-none focus:ring-0"
            />
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex w-full items-center gap-2 px-5 py-2.5 text-[13px] text-tt-text-secondary hover:text-tt-text transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
            New bucket
          </button>
        )}
      </nav>

      <div className="border-t border-dashed border-tt-border" />

      <div className="px-4 py-3 flex flex-col gap-1">
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-notes"));
          }}
          className="lg:hidden flex w-full items-center gap-2 px-2 py-1.5 text-[12px] text-tt-text-secondary hover:text-tt-text hover:bg-white/50 border border-transparent transition-colors cursor-pointer text-left focus:outline-none"
        >
          <Receipt className="size-3.5" />
          Notes
        </button>
        <button
          onClick={() => setShortcutsOpen(true)}
          className="flex w-full items-center gap-2 px-2 py-1.5 text-[12px] text-tt-text-secondary hover:text-tt-text hover:bg-white/50 border border-transparent transition-colors cursor-pointer text-left focus:outline-none"
        >
          <HelpCircle className="size-3.5" />
          Shortcuts
        </button>
        <Link
          href="/settings"
          className={classNames(
            "flex items-center gap-2 px-2 py-1.5 text-[12px] transition-colors border border-transparent",
            isOnSettings
              ? "bg-white text-tt-text border-tt-border"
              : "text-tt-text-secondary hover:text-tt-text hover:bg-white/50",
          )}
        >
          <Settings className="size-3.5" />
          Settings
        </Link>
        <Link
          href="/users/sign_out"
          method="delete"
          as="button"
          className="flex w-full items-center gap-2 px-2 py-1.5 text-[12px] text-tt-text-secondary hover:text-tt-text hover:bg-white/50 border border-transparent transition-colors"
        >
          <LogOut className="size-3.5" />
          Log out
        </Link>

        <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
          <DialogContent className="sm:max-w-sm p-0! gap-0!">
            <DialogHeader>
              <DialogTitle className="text-[15px] font-semibold px-4 py-4 border-b border-dashed">
                Keyboard Shortcuts
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2 text-[13px]">
              {KEYBOARD_SHORTCUTS.map(({ label, key }) => (
                <div
                  key={key}
                  className="flex justify-between items-center pb-4 px-4 border-b border-tt-border-subtle last:border-0 first:pt-2"
                >
                  <span className="text-tt-text-secondary">{label}</span>
                  <Kbd>{key}</Kbd>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <ManageBucketsDialog
          open={manageBucketsOpen}
          onOpenChange={setManageBucketsOpen}
          buckets={buckets}
          currencySymbol={currencySymbol}
        />

      </div>
    </div>
  );
}
