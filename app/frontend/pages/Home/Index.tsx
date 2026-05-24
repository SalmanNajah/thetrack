import { usePage, Link } from "@inertiajs/react";

export default function Index() {
  const { auth:{ user } } = usePage<{ auth: { user: { id: number; email: string } | null } }>().props;
  const isLoggedIn = !!user;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold">TheTrack</h1>

        <p className="mt-4 text-zinc-600">Personal finance operating system</p>

        <div className="mt-8 flex justify-center gap-4">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-xl bg-black px-5 py-3 text-white"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/users/sign_in"
                className="rounded-xl bg-black px-5 py-3 text-white"
              >
                Login
              </Link>

              <Link
                href="/users/sign_up"
                className="rounded-xl border border-zinc-300 px-5 py-3"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
