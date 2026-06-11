import { useForm, Link, usePage } from "@inertiajs/react";
import { FormEvent } from "react";
import { AuthLayout } from "@/components/AuthLayout";

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
    <AuthLayout
      title="Reset password"
      subtitle="Request a password reset link for your account"
      flash={flash}
    >
      <p className="mb-6 text-xs text-tt-text-secondary leading-relaxed font-medium">
        Enter the email address associated with your account, and we'll send you
        a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-tt-text-secondary"
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

        <button
          type="submit"
          disabled={processing}
          className="w-full  bg-tt-text px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-tt-text/90 focus:outline-none focus:ring-2 focus:ring-tt-text focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-25 transition-all duration-200 cursor-pointer"
        >
          {processing ? "Sending instructions…" : "Send reset instructions"}
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
