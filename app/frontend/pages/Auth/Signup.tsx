import { useForm, Link, usePage } from "@inertiajs/react";
import { FormEvent } from "react";

export default function Signup() {
  const { errors: pageErrors } = usePage<{ errors: Record<string, string> }>().props;

  const { data, setData, post, processing } = useForm({
    user: {
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
