import { usePage, Link, Head } from "@inertiajs/react";
import { LandingNav, LandingFooter } from "./Index";

export default function Terms() {
  const { auth } = usePage<{
    auth?: { user: { id: number; email: string } };
  }>().props;
  const isLoggedIn = !!auth?.user;

  return (
    <div className="min-h-screen bg-[#f4f1eb] text-[#18181b] overflow-x-hidden relative font-sans">
      <Head>
        <title>Terms of Service</title>
        <meta name="description" content="Terms of Service for TheTrack personal finance system." />
      </Head>

      <LandingNav isLoggedIn={isLoggedIn} />

      <main className="relative pt-28 sm:pt-36 pb-16 sm:pb-24">
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl pointer-events-none">
          <div className="absolute left-3 sm:left-4 top-0 bottom-0 border-l border-tt-border border-dashed" />
          <div className="absolute right-3 sm:right-4 top-0 bottom-0 border-r border-tt-border border-dashed" />
        </div>

        <div className="mx-auto max-w-3xl relative z-10 px-6 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#71717a] hover:text-[#18181b] transition-colors mb-8 cursor-pointer"
          >
            ← Back to home
          </Link>

          <article className="prose prose-neutral max-w-none prose-headings:text-[#18181b] prose-h1:text-4xl prose-h1:tracking-tight prose-h1:font-bold prose-h2:text-xl prose-h2:font-bold prose-h2:mt-8 prose-p:text-[#52525b] prose-p:leading-relaxed prose-li:text-[#52525b]">
            <h1>Terms of Service</h1>
            <p className="text-xs text-[#a1a1aa] mt-2 mb-8">Last updated: July 8, 2026</p>

            <p>
              Welcome to TheTrack. Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using our website and services.
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using TheTrack, you agree to be bound by these Terms and all applicable laws and regulations. If you do not agree with any part of these terms, you are prohibited from using the service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              TheTrack is a personal finance operating system that allows users to manually track their income, expenses, and manage budgets through virtual buckets. TheTrack does not connect to any real-world financial institutions or bank accounts. All balances, transaction amounts, and category allocations are manually inputted by the user.
            </p>

            <h2>3. User Accounts and Security</h2>
            <p>
              To use certain features of the service, you must register for an account by providing a valid email address and setting a password. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>

            <h2>4. Acceptable Use</h2>
            <p>
              You agree not to use the service for any unlawful purposes or to conduct any activity that would violate the rights of others, interfere with the operation of the service, or attempt to gain unauthorized access to our systems.
            </p>

            <h2>5. Intellectual Property</h2>
            <p>
              All content, features, and functionality of TheTrack&mdash;including but not limited to software, design, text, graphics, logos, and layouts&mdash;are the exclusive property of the developer and are protected by international copyright, trademark, and other intellectual property laws.
            </p>

            <h2>6. Disclaimer of Warranties</h2>
            <p>
              TheTrack is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis, without any warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, error-free, or completely secure, or that the manual calculations or summaries will always be error-free.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
              In no event shall the developers, partners, or affiliates of TheTrack be liable for any direct, indirect, incidental, special, or consequential damages resulting from your use or inability to use the service, including but not limited to loss of financial data or incorrect financial tracking.
            </p>

            <h2>8. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days&apos; notice prior to any new terms taking effect. By continuing to access or use the service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </article>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
