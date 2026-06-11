import { ReactNode, useState, useEffect } from "react";
import { BucketSidebar } from "@/components/BucketSidebar";
import { MobileTopBar } from "@/components/MobileTopBar";
import { SearchPopup } from "@/components/SearchPopup";
import { BottomNavbar } from "@/components/BottomNavbar";
import { Odometer } from "@/components/Odometer";
import { formatCurrency } from "@/lib/format";
import type { Bucket } from "@/types";

type WorkspaceLayoutProps = {
  children: ReactNode;
  buckets: Bucket[];
  totalBalance: string;
  currencySymbol: string;
  activeBucketSlug?: string;
  showMobileBalance?: boolean;
  onboarded?: boolean;
};

export function WorkspaceLayout({
  children,
  buckets,
  totalBalance,
  currencySymbol,
  activeBucketSlug,
  showMobileBalance = false,
  onboarded = true,
}: WorkspaceLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    function handleOpenSearch() {
      setSearchOpen(true);
    }
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-search", handleOpenSearch);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-search", handleOpenSearch);
    };
  }, []);

  const numericBalance = parseFloat(totalBalance) || 0;
  const formattedBalance = formatCurrency(numericBalance.toFixed(2), currencySymbol);
  const mobileBalanceFontSize =
    formattedBalance.length > 14
      ? "text-[1.875rem]"
      : formattedBalance.length > 10
        ? "text-[2.5rem]"
        : "text-[3.25rem]";

  return (
    <div className="min-h-screen bg-tt-bg">
      {onboarded && (
        <div
          className="hidden md:block fixed left-0 top-0 bottom-0 border-r border-dashed border-tt-sidebar-border"
          style={{ width: "var(--tt-sidebar-width)" }}
        >
          <BucketSidebar
            buckets={buckets}
            totalBalance={totalBalance}
            currencySymbol={currencySymbol}
            activeBucketSlug={activeBucketSlug}
          />
        </div>
      )}

      {onboarded && (
        <div className="md:hidden">
          <MobileTopBar onSearchClick={() => setSearchOpen(true)} />
        </div>
      )}

      <div className={onboarded ? "md:ml-(--tt-sidebar-width)" : ""}>
        {showMobileBalance && onboarded && (
          <div className="md:hidden px-6 pt-4 pb-6 overflow-hidden">
            <p className={`${mobileBalanceFontSize} font-semibold leading-none tracking-tighter text-tt-text truncate overflow-hidden`}>
              <Odometer
                value={formattedBalance}
              />
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-[12px] text-tt-text-tertiary">
                total balance
              </p>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-2xl px-6 pb-48 md:pb-20">
          {children}
        </main>
      </div>

      {onboarded && (
        <div className="md:hidden">
          <BottomNavbar
            currentSlug={activeBucketSlug}
            buckets={buckets}
            totalBalance={totalBalance}
            currencySymbol={currencySymbol}
          />
        </div>
      )}

      <SearchPopup open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
