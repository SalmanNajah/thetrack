import { Link, router, usePage } from "@inertiajs/react";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Settings, LogOut, Plus, Home } from "lucide-react";
import { Odometer } from "@/components/Odometer";
import { formatCurrency } from "@/lib/format";
import { classNames } from "@/lib/utils";
import type { Bucket, AuthUser } from "@/types";

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
  const {
    auth: { user },
  } = usePage<{ auth: { user: AuthUser } }>().props;

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

  const { url } = usePage();
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
            <p className="text-[10px] text-tt-text-secondary truncate">{user.email}</p>
          </div>
        </Link>
      </div>

      <div className="border-t border-dashed border-tt-sidebar-border" />

      <div className="px-5 py-4">
        <p
          className={`${balanceFontSize} font-semibold leading-none tracking-tighter text-tt-text overflow-hidden`}
        >
          <Odometer value={formatted} />
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <p className="text-[11px] text-tt-text-secondary">total balance</p>
        </div>
      </div>

      <div className="border-t border-dashed border-tt-sidebar-border" />

      <nav className="flex-1 overflow-y-auto min-h-0 px-3 py-2 scrollbar-none">
        <Link
          href="/dashboard"
          className={classNames(
            "flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-all duration-100 mb-0.5 border border-transparent",
            isOnDashboard
              ? "bg-white text-tt-text border-tt-sidebar-border"
              : "text-tt-text-secondary hover:text-tt-text hover:bg-white/50",
          )}
        >
          <Home className="size-3.5" />
          Dashboard
        </Link>

        <div className="border-t border-dashed border-tt-sidebar-border/60 my-2 -mx-3" />

        {buckets.map((bucket) => {
          const isActive = bucket.slug === activeBucketSlug;
          const bucketBalance = parseFloat(bucket.balance) || 0;

          return (
            <Link
              key={bucket.id}
              href={`/buckets/${bucket.slug}`}
              className={classNames(
                "flex items-center justify-between px-3 py-2 transition-all duration-100 group border border-transparent",
                isActive
                  ? "bg-white text-tt-text border-tt-sidebar-border"
                  : "text-tt-text-secondary hover:text-tt-text hover:bg-white/50",
              )}
            >
              <span className="text-[13px] font-medium truncate">
                {bucket.name}
              </span>
              <span className="text-[12px] text-tt-text-secondary group-hover:text-tt-text shrink-0 ml-2">
                <Odometer
                  value={formatCurrency(
                    bucketBalance.toFixed(2),
                    currencySymbol,
                  )}
                />
              </span>
            </Link>
          );
        })}

        {isAdding ? (
          <div
            className="px-3 py-2"
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
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-tt-text-secondary hover:text-tt-text transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
            New bucket
          </button>
        )}
      </nav>

      <div className="border-t border-dashed border-tt-sidebar-border" />

      <div className="px-4 py-3 flex flex-col gap-1">
        <Link
          href="/settings"
          className={classNames(
            "flex items-center gap-2 px-2 py-1.5 text-[12px] transition-colors border border-transparent",
            isOnSettings
              ? "bg-white text-tt-text border-tt-sidebar-border"
              : "text-tt-text-secondary hover:text-tt-text hover:bg-white/50"
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
      </div>
    </div>
  );
}
