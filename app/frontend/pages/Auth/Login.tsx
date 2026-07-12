import { useForm, Link, usePage, Head } from "@inertiajs/react";
import { FormEvent } from "react";
import { AuthLayout } from "@/components/AuthLayout";

type PageProps = {
  errors: Record<string, string>;
  flash: {
    notice: string | null;
    alert: string | null;
  };
};

export default function Login() {
  const { errors: pageErrors, flash } = usePage<PageProps>().props;

  const { data, setData, post, processing } = useForm({
    user: {
      email: "",
      password: "",
      remember_me: "0" as string,
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    post("/users/sign_in");
  }

  return (
    <>
      <Head>
        <title>Sign In</title>
      </Head>
      <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue"
      flash={flash}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-[13px] font-medium text-tt-text"
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
            className="block w-full  border border-tt-border-subtle bg-white px-4 py-2.5 text-sm text-tt-text shadow-xs placeholder:text-tt-text-tertiary/60 focus:border-tt-text/45 focus:outline-none focus:ring-0 transition-all duration-200"
            placeholder="you@example.com"
          />
          {pageErrors?.email && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {pageErrors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-[13px] font-medium text-tt-text"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={data.user.password}
            onChange={(e) =>
              setData("user", { ...data.user, password: e.target.value })
            }
            className="block w-full  border border-tt-border-subtle bg-white px-4 py-2.5 text-sm text-tt-text shadow-xs placeholder:text-tt-text-tertiary/60 focus:border-tt-text/45 focus:outline-none focus:ring-0 transition-all duration-200"
            placeholder="••••••••"
          />
          {pageErrors?.password && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {pageErrors.password}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.user.remember_me === "1"}
              onChange={(e) =>
                setData("user", {
                  ...data.user,
                  remember_me: e.target.checked ? "1" : "0",
                })
              }
              className="rounded border-tt-border text-tt-text focus:ring-tt-text size-4"
            />
            <span className="text-xs text-tt-text-secondary font-medium">
              Remember me
            </span>
          </label>

          <Link
            href="/users/password/new"
            className="text-xs font-medium text-tt-text-secondary hover:text-tt-text transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={processing}
          className="w-full  bg-tt-text px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-tt-text/90 focus:outline-none focus:ring-2 focus:ring-tt-text focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-25 transition-all duration-200 cursor-pointer"
        >
          {processing ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-tt-border-subtle" />
        <span className="text-[12px] font-medium text-tt-text-tertiary">
          or
        </span>
        <div className="h-px flex-1 bg-tt-border-subtle" />
      </div>

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
          className="flex w-full items-center justify-center gap-3  border border-tt-border bg-white px-4 py-2.5 text-sm font-semibold text-tt-text-secondary shadow-xs transition hover:bg-tt-bg/35 focus:outline-none focus:ring-2 focus:ring-tt-text focus:ring-offset-2 cursor-pointer"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
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

      <div className="mt-8 text-center">
        <p className="text-xs text-tt-text-secondary font-medium">
          Don't have an account?{" "}
          <Link
            href="/users/sign_up"
            className="font-bold text-tt-text hover:underline transition-all"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
    </>
  );
}
