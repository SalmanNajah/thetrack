import { useForm, Link, usePage } from "@inertiajs/react";
import { FormEvent } from "react";

type PageProps = {
  errors: Record<string, string>;
  flash: {
    notice: string | null;
    alert: string | null;
  };
};

export default function ForgotPassword() {
  const { errors: pageErrors, flash } = usePage<PageProps>().props;

  const { data, setData, post, processing } = useForm({
    user: {
      email: "",
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    post("/users/password");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold tracking-tight text-zinc-900">
            TheTrack
          </Link>
          <p className="mt-2 text-zinc-500">Reset your password</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200">
          {flash?.notice && (
            <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
              {flash.notice}
            </div>
          )}
          {flash?.alert && (
            <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {flash.alert}
            </div>
          )}

          <p className="mb-6 text-sm text-zinc-600 leading-relaxed">
            Enter the email address associated with your account, and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-zinc-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={data.user.email}
                onChange={(e) =>
                  setData("user", { ...data.user, email: e.target.value })
                }
                className="block w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="you@example.com"
              />
              {pageErrors?.email && (
                <p className="mt-1.5 text-sm text-red-600">{pageErrors.email}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? "Sending instructions…" : "Send password reset instructions"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Remember your password?{" "}
          <Link
            href="/users/sign_in"
            className="font-semibold text-zinc-900 hover:text-zinc-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
