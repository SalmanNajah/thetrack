import { useForm, Link, usePage } from "@inertiajs/react";
import { FormEvent } from "react";

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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold tracking-tight text-zinc-900">
            TheTrack
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200">
              <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">Link your Google account</h2>
            <p className="mt-2 text-sm text-zinc-500">
              An account already exists for <span className="font-medium text-zinc-700">{email}</span>.
              Enter your password to link your Google account.
            </p>
          </div>

          {flash?.alert && (
            <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {flash.alert}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-zinc-700"
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
                className="block w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="••••••••"
              />
              {pageErrors?.password && (
                <p className="mt-1.5 text-sm text-red-600">{pageErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? "Linking…" : "Link account & sign in"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/link-accounts"
              method="delete"
              as="button"
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              Cancel and go back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
