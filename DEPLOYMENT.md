# TheTrack — Render Deployment Guide (with Neon Postgres)

This guide walks you through deploying **TheTrack** to Render using **Neon Postgres** as your managed database.

## Files

| File | Purpose |
|------|---------| 
| [bin/render-build.sh](./bin/render-build.sh) | Build script (npm install + bundle + assets precompile + database migrations) |

---

## 1. Prepare Neon Postgres
1. Sign up/Log in to [Neon.tech](https://neon.tech).
2. Create a new project and database (e.g. `thetrack_production`).
3. Copy the **Connection String** from your Neon dashboard. It should look like:
   `postgresql://alex:password@ep-cool-breeze-123456.ap-southeast-1.aws.neon.tech/thetrack_production?sslmode=require`

---

## 2. Deploy to Render

### Step 1: Create a Web Service
1. Go to [render.com](https://render.com) and log in.
2. Click **New → Web Service**.
3. Connect your repository (`thetrack`).

### Step 2: Configure Settings
Set the following options in the Render configuration:
* **Runtime**: `Ruby`
* **Build Command**: `./bin/render-build.sh`
* **Start Command**: `bundle exec puma -C config/puma.rb`

### Step 3: Add Environment Variables
Under the **Environment** tab, click **Add Environment Variable** and add:

| Key | Value | Description |
|-----|-------|-------------|
| `DATABASE_URL` | `<Your Neon Connection String>` | Connection string copied from Neon |
| `RAILS_MASTER_KEY` | `<Contents of config/master.key>` | Decrypts production credentials |
| `GOOGLE_CLIENT_ID` | `<Your Google OAuth Client ID>` | Needed for Google Login |
| `GOOGLE_CLIENT_SECRET` | `<Your Google OAuth Client Secret>` | Needed for Google Login |
| `RESEND_API_KEY` | `<Your Resend API Key>` | For sending OTP verification emails |
| `RAILS_LOG_LEVEL` | `info` | Production log level |

### Step 4: Add Custom Domain (Optional)
1. Go to **Settings → Custom Domains** and add `track.salmannajah.dev`.
2. Add the `CNAME` record in your DNS provider (Cloudflare, etc.) pointing to Render's URL as provided.
3. Render will automatically provision an SSL certificate for you.

### Step 5: Update Google OAuth Callback
In your Google Cloud Console, update your OAuth callback URL to:
`https://track.salmannajah.dev/users/auth/google_oauth2/callback`

---

## Troubleshooting

### Database Connection Error
If you see `ActiveRecord::ConnectionNotEstablished` referring to a socket `/var/run/postgresql/.s.PGSQL.5432`:
* The `DATABASE_URL` environment variable is missing, empty, or incorrectly named in the Render Web Service dashboard.
* **Fix**: Ensure you have added the variable exactly as `DATABASE_URL` in the Render **Environment** tab, and that it has the correct connection string from Neon.

### Assets Not Loading
If CSS/JS don't load in production:
* Make sure `./bin/render-build.sh` runs `npm install` before `bundle exec rails assets:precompile`.
* Verify Vite is configured with `base: '/'` in `vite.config.ts`.
