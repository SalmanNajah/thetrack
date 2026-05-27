import { useForm, Link, usePage, router } from "@inertiajs/react";
import { FormEvent, useRef, useEffect, useState, KeyboardEvent, ClipboardEvent } from "react";

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

  // Cooldown timer
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

  // Reset cooldown when prop changes (after resend)
  useEffect(() => {
    setCooldown(resend_cooldown || 0);
  }, [resend_cooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    // Only accept digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    const fullCode = newOtp.join("");
    if (fullCode.length === OTP_LENGTH && newOtp.every((d) => d !== "")) {
      submitCode(fullCode);
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Move back on backspace when current input is empty
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

    // Focus last filled input or the next empty one
    const lastIndex = Math.min(pastedData.length, OTP_LENGTH) - 1;
    inputRefs.current[lastIndex]?.focus();

    // Auto-submit if full code was pasted
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

  // Mask email: s***n@gmail.com
  function maskEmail(email: string) {
    const [local, domain] = email.split("@");
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}${"•".repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold tracking-tight text-zinc-900">
            TheTrack
          </Link>
          <p className="mt-2 text-zinc-500">Verify your email</p>
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

          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
              <svg
                className="h-7 w-7 text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <p className="text-sm text-zinc-600">
              We sent a 6-digit code to
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">
              {maskEmail(email)}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* OTP Input Grid */}
            <div className="mb-2 flex justify-center gap-2.5">
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
                  className={`h-13 w-11 rounded-xl border text-center text-xl font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                    pageErrors?.otp
                      ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
                      : "border-zinc-300 text-zinc-900 focus:border-zinc-900 focus:ring-zinc-900"
                  }`}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            {pageErrors?.otp && (
              <p className="mb-4 text-center text-sm text-red-600">
                {pageErrors.otp}
              </p>
            )}

            <button
              type="submit"
              disabled={processing || otp.join("").length < OTP_LENGTH}
              className="mt-4 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? "Verifying…" : "Verify email"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-zinc-500">
              Didn't receive the code?{" "}
              {cooldown > 0 ? (
                <span className="font-medium text-zinc-400">
                  Resend in {cooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={processing}
                  className="font-semibold text-zinc-900 hover:text-zinc-700 disabled:opacity-50"
                >
                  Resend code
                </button>
              )}
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Wrong email?{" "}
          <Link
            href="/users/sign_up"
            className="font-semibold text-zinc-900 hover:text-zinc-700"
          >
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
}
