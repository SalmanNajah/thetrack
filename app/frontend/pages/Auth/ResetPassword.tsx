import { useForm, Link, usePage } from "@inertiajs/react";
import { FormEvent } from "react";
import { AuthLayout } from "@/components/AuthLayout";

type PageProps = {
  reset_password_token: string;
  errors: Record<string, string>;
  flash: {
    notice: string | null;
    alert: string | null;
  };
};

export default function ResetPassword() {
  const {
    reset_password_token,
    errors: pageErrors,
    flash,
  } = usePage<PageProps>().props;

  const { data, setData, put, processing } = useForm({
    user: {
      reset_password_token: reset_password_token || "",
      password: "",
      password_confirmation: "",
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    put("/users/password");
  }

  return (
    <AuthLayout
      title="Create new password"
      subtitle="Enter a new password for your account"
      flash={flash}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <input type="hidden" value={data.user.reset_password_token} />

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-tt-text-secondary"
          >
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            autoFocus
            value={data.user.password}
            onChange={(e) =>
              setData("user", { ...data.user, password: e.target.value })
            }
            className="block w-full  border border-tt-border-subtle bg-white px-4 py-2.5 text-sm text-tt-text shadow-xs placeholder:text-tt-text-tertiary/60 focus:border-tt-text/45 focus:outline-none focus:ring-0 transition-all duration-200"
            placeholder="••••••••"
          />
          {pageErrors?.password ? (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {pageErrors.password}
            </p>
          ) : (
            <p className="mt-1.5 text-[10px] text-tt-text-tertiary font-medium">
              Minimum 6 characters
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password_confirmation"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-tt-text-secondary"
          >
            Confirm new password
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
            className="block w-full  border border-tt-border-subtle bg-white px-4 py-2.5 text-sm text-tt-text shadow-xs placeholder:text-tt-text-tertiary/60 focus:border-tt-text/45 focus:outline-none focus:ring-0 transition-all duration-200"
            placeholder="••••••••"
          />
          {pageErrors?.password_confirmation && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {pageErrors.password_confirmation}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={processing}
          className="w-full  bg-tt-text px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-tt-text/90 focus:outline-none focus:ring-2 focus:ring-tt-text focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-25 transition-all duration-200 cursor-pointer"
        >
          {processing ? "Updating password…" : "Reset password"}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-tt-border-subtle pt-5">
        <p className="text-xs text-tt-text-secondary font-medium">
          Remember your password?{" "}
          <Link
            href="/users/sign_in"
            className="font-bold text-tt-text hover:underline transition-all"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
