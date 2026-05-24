import { Link } from '@inertiajs/react'

type Props = {
  user: {
    email: string
  }
}

export default function Index({ user }: Props) {
  return (
    <div className="min-h-screen bg-zinc-50 p-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Dashboard
            </h1>

            <p className="mt-2 text-zinc-600">
              Logged in as {user.email}
            </p>
          </div>

          <Link
            href="/users/sign_out"
            method="delete"
            as="button"
            className="rounded-xl bg-black px-4 py-2 text-white"
          >
            Logout
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-5">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-sm text-zinc-500">
              Daily
            </h2>

            <p className="mt-2 text-3xl font-semibold">
              ₹0
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-sm text-zinc-500">
              Parking
            </h2>

            <p className="mt-2 text-3xl font-semibold">
              ₹0
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-sm text-zinc-500">
              Cash
            </h2>

            <p className="mt-2 text-3xl font-semibold">
              ₹0
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}