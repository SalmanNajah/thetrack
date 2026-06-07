import { ReactNode } from "react";
import { Link } from "@inertiajs/react";

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  flash?: {
    notice: string | null;
    alert: string | null;
  };
};

export function AuthLayout({ children, title, subtitle, flash }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#f4f1eb] font-sans text-tt-text">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:w-1/2 lg:flex-none lg:px-20 xl:px-24 w-full relative z-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 text-left">
            <Link href="/" className="inline-block text-2xl font-bold tracking-tight text-tt-text hover:opacity-80 transition-opacity lg:hidden">
              TheTrack
            </Link>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-tt-text">
              {title}
            </h1>
            <p className="mt-2 text-sm text-tt-text-secondary">
              {subtitle}
            </p>
          </div>

          {flash?.notice && (
            <div className="mb-6 rounded-xl bg-emerald-50/50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200/50 backdrop-blur-xs">
              {flash.notice}
            </div>
          )}

          {flash?.alert && (
            <div className="mb-6 rounded-xl bg-red-50/50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200/50 backdrop-blur-xs">
              {flash.alert}
            </div>
          )}

          <div className="rounded-2xl border border-tt-border-subtle bg-white p-8 shadow-xs">
            {children}
          </div>
        </div>
      </div>

      <div className="relative hidden lg:block lg:w-1/2 bg-[#18181b] overflow-hidden select-none border-l border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-radial from-[#5b5bd6]/8 via-transparent to-transparent blur-[120px] pointer-events-none" />

        <div className="relative h-full flex flex-col justify-between p-16 z-10 text-white">
          <div>
            <Link href="/" className="inline-block text-2xl font-bold tracking-tight text-white hover:opacity-80 transition-opacity">
              TheTrack
            </Link>
          </div>

          <div className="relative w-full max-w-sm mx-auto h-[320px]">
            <div className="absolute top-0 left-0 w-64 rounded-xl border border-white/5 bg-white/2 backdrop-blur-md px-5 py-4 shadow-xl -rotate-3 hover:rotate-0 hover:-translate-y-1 transition-all duration-300">
              <span className="text-[12px] text-white/40">Income</span>
              <div className="mt-2.5 text-[17px] font-semibold tracking-tight">
                ₹4,50,000
              </div>
            </div>

            <div className="absolute top-24 right-0 w-64 rounded-xl border border-white/5 bg-white/2 backdrop-blur-md px-5 py-4 shadow-xl rotate-3 hover:rotate-0 hover:-translate-y-1 transition-all duration-300 z-20">
              <span className="text-[12px] text-white/40">Daily</span>
              <div className="mt-2.5 text-[17px] font-semibold tracking-tight">
                ₹23,763
              </div>
            </div>

            <div className="absolute bottom-0 left-4 w-72 rounded-xl border border-white/5 bg-white/2 backdrop-blur-md p-5 shadow-xl -rotate-2 hover:rotate-0 hover:-translate-y-1 transition-all duration-300 z-10">
              <span className="text-[12px] text-white/40">Recent Transactions</span>
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold border-b border-white/5 pb-2">
                  <span className="text-white/60">salary</span>
                  <span className="text-emerald-400">+₹4,50,000</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold border-b border-white/5 pb-2">
                  <span className="text-white/60">groceries</span>
                  <span className="text-white/80">-₹340</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-white/60">auto rickshaw</span>
                  <span className="text-white/80">-₹120</span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-2xl font-bold tracking-tight leading-tight">
              Know where your money stays.
            </h2>
            <p className="mt-3 text-sm text-white/50 leading-relaxed font-sans">
              Organize your money into clear stashes, track transactions dynamically, and optimize your wealth with minimal overhead.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
