# The Track

Track the Untracked. Built with **Rails 8**, **Inertia.js**, **React 19**, and **Vite**.

## Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Backend    | Ruby on Rails 8.1, PostgreSQL       |
| Bridge     | Inertia.js 3                        |
| Frontend   | React 19, TypeScript 6              |
| Styling    | Tailwind CSS 4                      |
| Bundler    | Vite 8                              |
| Auth       | Devise 5 + Google OAuth + Email OTP |
| Deploy     | Render + Neon Postgres              |

## Features

- **Bucket-based finance tracking** — organize money across Income, Daily, Parking, and custom buckets
- **Transfers** — move money between buckets with linked transactions
- **Google OAuth** — one-click sign in
- **Email OTP verification** — magic code verification flow
- **Admin dashboard** — full platform management at `/admin`
- **Currency support** — 14 currencies (INR, USD, EUR, GBP, JPY, etc.)

## Prerequisites

- Ruby 3.4+
- Node.js 18+
- PostgreSQL

## Getting Started

```bash
# Install dependencies
bundle install
npm install

# Setup the database
bin/rails db:create db:migrate

# Seed data (development only — creates 8 test users with transactions)
bin/rails db:seed

# Start the development server
bin/dev
```

`bin/dev` runs both the Rails server and the Vite dev server concurrently via `Procfile.dev`.

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development setup and seed data docs.

## Project Structure

```
app/
├── controllers/
│   ├── admin/             # Admin namespace (dashboard, users, transactions)
│   ├── users/             # Auth controllers (sessions, signup, OAuth)
│   ├── dashboard_controller.rb
│   ├── buckets_controller.rb
│   ├── transactions_controller.rb
│   └── settings_controller.rb
├── models/
│   ├── user.rb            # Devise + OTP + admin flag
│   ├── bucket.rb          # Balance tracking via transactions
│   └── transaction.rb     # Amount, description, transfers
├── frontend/
│   ├── pages/             # React page components (mapped to routes)
│   │   ├── Admin/         # Admin dashboard pages
│   │   ├── Auth/          # Login, signup, email verification
│   │   ├── Dashboard/     # Main app dashboard
│   │   └── Settings/      # User settings
│   ├── components/        # Shared React components
│   └── entrypoints/       # Vite entry points
config/
├── initializers/
│   └── inertia_rails.rb   # Inertia configuration
vite.config.ts             # Vite + React + Tailwind plugin config
```

## Admin Dashboard

Access at `/admin` (requires `admin: true` on the user record).

- **Dashboard** — platform stats, DB info, recent signups
- **Users** — searchable/paginated user table, view details, delete users
- **Transactions** — global ledger with email search, delete transactions

Admin emails are auto-flagged on signup based on the comma-separated `ADMIN_EMAILS` environment variable.

## How It Works

Rails handles routing, controllers, and data. Instead of server-rendered views, controllers render **React components** via Inertia.js — no API layer or client-side router needed.

```ruby
# app/controllers/dashboard_controller.rb
def index
  render inertia: 'Dashboard/Index', props: { buckets: current_user.buckets }
end
```
