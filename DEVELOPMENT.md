# TheTrack — Development Guide

## Quick Start

```bash
bundle install
npm install
bin/rails db:create db:migrate db:seed
bin/dev
```

Open [localhost:3000](http://localhost:3000). Login as `salman@example.com` / `password123` (dev admin).

---

## Seed Data

Run `bin/rails db:seed` to populate the development database. Seeds are **idempotent** — safe to run multiple times.

### To reset and reseed:
```bash
bin/rails db:reset   # drop + create + migrate + seed
```

### Seed Users

The seed creates **16 users** across 6 different personas:

| Persona | Users | Description |
|---------|-------|-------------|
| **Admin** | 1 | `salman@example.com` — dev admin, fully onboarded, 60-120 txns |
| **Power** | 2 | Old accounts (140-170 days), 3-5 custom buckets, 150-250 txns |
| **Regular** | 4 | Typical usage across INR/USD/AED/EUR, 50-100 txns |
| **Casual** | 3 | Light usage, default buckets only, 15-40 txns |
| **New** | 3 | Just signed up (0-2 days ago), 0-5 txns, one with no name |
| **Unverified** | 2 | Never verified email, no data at all |
| **Abandoned** | 1 | Verified but never completed onboarding |

### Dev Admin

- **Email**: `salman@example.com`
- **Password**: `password123`
- **Access**: Full admin dashboard at `/admin`

### Currencies Covered

INR, SGD, USD, AED, EUR, JPY, GBP, BRL, CHF, KRW — 10 of the 14 supported currencies appear in seed data.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Purpose |
|----------|----------|---------|
| `GOOGLE_CLIENT_ID` | For Google login | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For Google login | OAuth client secret |
| `RESEND_API_KEY` | For email OTP | Resend.com API key |

---

## Key URLs

| URL | Description |
|-----|-------------|
| `/` | Landing / login page |
| `/dashboard` | Main app (requires auth) |
| `/admin` | Admin dashboard (requires admin flag) |
| `/admin/users` | User management |
| `/admin/transactions` | Transaction ledger |

---

## Running Tests

```bash
bin/rails test          # Ruby tests
npm run check           # TypeScript type checking
```

---

## Project Conventions

- **Frontend**: React pages in `app/frontend/pages/`, mapped 1:1 to controller actions via Inertia
- **Styling**: Tailwind CSS 4 with custom tokens in `app/frontend/entrypoints/application.css`
- **Fonts**: Whyte (headings/body) + Geist Mono (numbers/code)
- **Admin UI**: Separate color scheme — dark sidebar + warm off-white main area
- **Consumer UI**: Mobile-first dark theme with bottom navigation
