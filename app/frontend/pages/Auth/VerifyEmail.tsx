import { useForm, Link, usePage, router } from "@inertiajs/react";
import { FormEvent, useRef, useEffect, useState, KeyboardEvent, ClipboardEvent } from "react";
import { AuthLayout } from "@/components/AuthLayout";

type PageProps = {
  email: string;
  resend_cooldown: number;
  errors: Record<string, string>;
  flash: {
    notice: string | null;
    alert: string | null;
  };
};

const OTP_LENGTH = 6;

export default function VerifyEmail() {
  const { email, resend_cooldown, errors: pageErrors, flash } = usePage<PageProps>().props;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(resend_cooldown || 0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { processing } = useForm({});

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    setCooldown(resend_cooldown || 0);
  }, [resend_cooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newOtp.join("");
    if (fullCode.length === OTP_LENGTH && newOtp.every((d) => d !== "")) {
      submitCode(fullCode);
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < OTP_LENGTH; i++) {
      newOtp[i] = pastedData[i] || "";
    }
    setOtp(newOtp);

    const lastIndex = Math.min(pastedData.length, OTP_LENGTH) - 1;
    inputRefs.current[lastIndex]?.focus();

    if (pastedData.length === OTP_LENGTH) {
      submitCode(pastedData);
    }
  }

  function submitCode(code: string) {
    router.post("/verify-email", { email, otp: code });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length === OTP_LENGTH) {
      submitCode(code);
    }
  }

  function handleResend() {
    if (cooldown > 0 || processing) return;
    router.post("/verify-email/resend", { email }, {
      onSuccess: () => setCooldown(60),
    });
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${email}`}
      flash={flash}
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4 flex justify-between gap-1">
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              autoComplete="one-time-code"
              value={otp[i]}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              className={`h-12 w-10 rounded-xl border text-center text-lg font-bold shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                pageErrors?.otp
                  ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
                  : "border-tt-border-subtle text-tt-text bg-white focus:border-tt-text focus:ring-tt-text"
              }`}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        {pageErrors?.otp && (
          <p className="mb-4 text-center text-xs font-medium text-red-600">
            {pageErrors.otp}
          </p>
        )}

        <button
          type="submit"
          disabled={processing || otp.join("").length < OTP_LENGTH}
          className="mt-4 w-full rounded-xl bg-tt-text px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-tt-text/90 focus:outline-none focus:ring-2 focus:ring-tt-text focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-25 transition-all duration-200 cursor-pointer"
        >
          {processing ? "Verifying…" : "Verify email"}
        </button>
      </form>

      <div className="mt-5 text-center">
        <p className="text-xs text-tt-text-secondary font-medium">
          Didn't receive the code?{" "}
          {cooldown > 0 ? (
            <span className="font-semibold text-tt-text-tertiary">
              Resend in {cooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={processing}
              className="font-bold text-tt-text hover:underline disabled:opacity-25 cursor-pointer"
            >
              Resend code
            </button>
          )}
        </p>
      </div>

      <div className="mt-8 text-center border-t border-tt-border-subtle pt-5">
        <p className="text-xs text-tt-text-secondary font-medium">
          Wrong email?{" "}
          <Link
            href="/users/sign_up"
            className="font-bold text-tt-text hover:underline transition-all"
          >
            Go back
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
