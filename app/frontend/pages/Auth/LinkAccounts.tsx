import { useForm, Link, usePage } from "@inertiajs/react";
import { FormEvent } from "react";
import { AuthLayout } from "@/components/AuthLayout";

type PageProps = {
  email: string;
  errors: Record<string, string[]>;
  flash: {
    notice: string | null;
    alert: string | null;
  };
};

export default function LinkAccounts() {
  const { email, errors: pageErrors, flash } = usePage<PageProps>().props;

  const { data, setData, post, processing } = useForm({
    password: "",
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    post("/link-accounts");
  }

  return (
    <AuthLayout
      title="Link Google account"
      subtitle="Complete setup by verifying your existing password"
      flash={flash}
    >
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center  bg-amber-50 ring-1 ring-amber-200">
          <svg
            className="h-6 w-6 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
            />
          </svg>
        </div>
        <p className="text-xs text-tt-text-secondary leading-relaxed">
          An account already exists for{" "}
          <span className="font-semibold text-tt-text">{email}</span>. Enter
          your password to link your Google account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-tt-text-secondary"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={data.password}
            onChange={(e) => setData("password", e.target.value)}
            className="block w-full  border border-tt-border-subtle bg-white px-4 py-2.5 text-sm text-tt-text shadow-xs placeholder:text-tt-text-tertiary/60 focus:border-tt-text/45 focus:outline-none focus:ring-0 transition-all duration-200"
            placeholder="••••••••"
          />
          {pageErrors?.password && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {pageErrors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={processing}
          className="w-full  bg-tt-text px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-tt-text/90 focus:outline-none focus:ring-2 focus:ring-tt-text focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-25 transition-all duration-200 cursor-pointer"
        >
          {processing ? "Linking…" : "Link account & sign in"}
        </button>
      </form>

      <div className="mt-6 text-center border-t border-tt-border-subtle pt-5">
        <Link
          href="/link-accounts"
          method="delete"
          as="button"
          className="text-xs text-tt-text-secondary hover:text-tt-text transition-colors font-semibold cursor-pointer"
        >
          Cancel and go back to login
        </Link>
      </div>
    </AuthLayout>
  );
}
