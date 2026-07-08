import { usePage, Link, Head } from "@inertiajs/react";
import { LandingNav, LandingFooter } from "./Index";

export default function Privacy() {
  const { auth } = usePage<{
    auth?: { user: { id: number; email: string } };
  }>().props;
  const isLoggedIn = !!auth?.user;

  return (
    <div className="min-h-screen bg-[#f4f1eb] text-[#18181b] overflow-x-hidden relative font-sans">
      <Head>
        <title>Privacy Policy — TheTrack</title>
        <meta name="description" content="Privacy Policy for TheTrack personal finance system." />
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
            <h1>Privacy Policy</h1>
            <p className="text-xs text-[#a1a1aa] mt-2 mb-8">Last updated: July 8, 2026</p>

            <p>
              At TheTrack, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information.
            </p>

            <h2>1. Information We Collect</h2>
            <p>
              We collect minimal personal data to provide the services of TheTrack:
            </p>
            <ul>
              <li><strong>Account Information:</strong> When you sign up, we collect your email address for account creation and authentication.</li>
              <li><strong>Financial Data:</strong> We store the transaction descriptions, amounts, bucket names, and balances that you manually input.</li>
              <li><strong>No Financial Institution Connections:</strong> TheTrack does not connect to any banks or financial institutions. We never request, access, or store your banking credentials, account numbers, or credit card histories.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>
              We use the collected data solely to:
            </p>
            <ul>
              <li>Create, secure, and maintain your account.</li>
              <li>Render your personalized financial dashboard, buckets, and transactions.</li>
              <li>Send you critical transaction emails (such as verification codes and password reset links).</li>
            </ul>
            <p>
              We do not sell, rent, trade, or share your personal or financial data with third-party advertising networks or external corporations.
            </p>

            <h2>3. Data Storage and Security</h2>
            <p>
              Your account details and financial records are stored securely in our databases. We implement standard industry protocols to prevent unauthorized access, alteration, disclosure, or destruction of your personal data. However, no database or transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2>4. Your Rights and Data Control</h2>
            <p>
              We believe you should have complete ownership over your data.
            </p>
            <ul>
              <li><strong>Access &amp; Edit:</strong> You can view, add, modify, or delete any transactions or buckets directly through the dashboard interface.</li>
              <li><strong>Account Deletion:</strong> You can permanently delete your account and all associated transaction histories at any time through the Settings page. This action is immediate and irreversible.</li>
            </ul>

            <h2>5. Cookies</h2>
            <p>
              We use essential session cookies to keep you logged in. These cookies do not track your activity on other websites and are solely used for authentication and security.
            </p>

            <h2>6. Changes to this Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date.
            </p>
          </article>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
