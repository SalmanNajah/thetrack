import { useForm, Link, usePage } from "@inertiajs/react";
import { FormEvent } from "react";

type PageProps = {
  errors: Record<string, string>;
  flash: {
    notice: string | null;
    alert: string | null;
  };
};

export default function Signup() {
  const { errors: pageErrors, flash } = usePage<PageProps>().props;

  const { data, setData, post, processing } = useForm({
    user: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    post("/users");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold tracking-tight text-zinc-900">
            TheTrack
          </Link>
          <p className="mt-2 text-zinc-500">Create your account</p>
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

          {/* Email / Password form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-zinc-700"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                autoFocus
                value={data.user.name}
                onChange={(e) =>
                  setData("user", { ...data.user, name: e.target.value })
                }
                className="block w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="Your name"
              />
              {pageErrors?.name && (
                <p className="mt-1.5 text-sm text-red-600">{pageErrors.name}</p>
              )}
            </div>

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
                autoComplete="new-password"
                value={data.user.password}
                onChange={(e) =>
                  setData("user", { ...data.user, password: e.target.value })
                }
                className="block w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="••••••••"
              />
              {pageErrors?.password && (
                <p className="mt-1.5 text-sm text-red-600">{pageErrors.password}</p>
              )}
              <p className="mt-1.5 text-xs text-zinc-400">Minimum 6 characters</p>
            </div>

            <div>
              <label
                htmlFor="password_confirmation"
                className="mb-1.5 block text-sm font-medium text-zinc-700"
              >
                Confirm password
              </label>
              <input
                id="password_confirmation"
                type="password"
                autoComplete="new-password"
                value={data.user.password_confirmation}
                onChange={(e) =>
                  setData("user", {
                    ...data.user,
                    password_confirmation: e.target.value,
                  })
                }
                className="block w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="••••••••"
              />
              {pageErrors?.password_confirmation && (
                <p className="mt-1.5 text-sm text-red-600">
                  {pageErrors.password_confirmation}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs font-medium text-zinc-400">or</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          {/* Google Sign Up */}
          <form action="/users/auth/google_oauth2" method="post">
            <input
              type="hidden"
              name="authenticity_token"
              value={
                document
                  .querySelector('meta[name="csrf-token"]')
                  ?.getAttribute("content") || ""
              }
            />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
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
