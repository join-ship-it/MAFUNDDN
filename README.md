# PE Fund Simulator

A single-player educational private equity fund management simulator built with Next.js, TypeScript, and Tailwind CSS. Play the role of a first-time PE fund manager navigating fundraising, deal sourcing, due diligence, and portfolio management.

## Features

- **Player-controlled simulation time** — time only advances when you click; no real-world penalties
- **Deal pipeline** with stage advancement, IC memos, and LBO modeling
- **LP fundraising** with relationship tracking and capital commitment simulation
- **Banker CRM** with deal-flow source management
- **Task system** with deadline miss consequences (reputation score)
- **Supabase persistence** — state survives browser refresh (optional; falls back to localStorage)

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- React context + useReducer store
- Supabase (PostgreSQL) — optional persistence layer

---

## Getting Started (No Supabase)

The app works fully without Supabase using localStorage.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Enter Simulator**.

---

## Supabase Setup

Follow either path below. Both end up with the same running app.

### Option A — Supabase Cloud (recommended for sharing)

1. **Create a project** at [supabase.com](https://supabase.com). Free tier is sufficient.

2. **Run the migration** in the Supabase SQL Editor:
   - Open your project → **SQL Editor** → **New query**
   - Paste the contents of `supabase/migrations/20260429000001_initial_schema.sql`
   - Click **Run**

3. **Optionally seed demo data:**
   - In the SQL Editor, paste the contents of `supabase/seed.sql` and run it
   - This creates a `seed-demo-user` with Fund I, 5 LPs, 5 bankers, 8 deals, and 14 tasks
   - The live app creates its own user on first load — seed data is only for inspection

4. **Copy environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in the values from **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL` — your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the `anon` / `public` key
   - `SUPABASE_SERVICE_ROLE_KEY` — the `service_role` key (keep secret)

5. **Start the app:**
   ```bash
   npm run dev
   ```

### Option B — Supabase Local (CLI)

Requires [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) and Docker.

```bash
# Install CLI (macOS)
brew install supabase/tap/supabase

# Start local Supabase stack
supabase start

# Apply migration
supabase db push

# (Optional) seed demo data
supabase db execute --file supabase/seed.sql

# Copy generated local credentials to .env.local
# supabase start prints SUPABASE_URL and ANON_KEY
cp .env.local.example .env.local
# Edit .env.local and paste the printed values
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Service role key (server-side only) |

If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are absent, the app silently falls back to localStorage and shows no sync indicator.

---

## Database Schema

Nine tables, all with TEXT primary keys matching the simulator's internal IDs (e.g. `"fund-1"`, `"deal-3"`):

| Table | Description |
|---|---|
| `users` | One row per browser session |
| `funds` | Fund metadata (Fund I) |
| `simulation_state` | Current date, reputation score, modeling skill |
| `lp_prospects` | LP relationships and commitment status |
| `contacts` | Banker / deal-flow source relationships |
| `deals` | Deal pipeline with stage and metrics |
| `tasks` | Tasks with due dates, priority, and status |
| `events` | Simulation event feed |
| `modeling_submissions` | Saved LBO model scenarios |

Row Level Security is enabled with permissive policies (suitable for single-user / local dev). Before deploying to a multi-user environment, replace `USING (true)` with `auth.uid()::text = user_id` checks and integrate Supabase Auth.

---

## Sync Behavior

- **localStorage** — saved immediately on every state change
- **Supabase** — debounced 1.5 s after each change; shown as a sync indicator in the sidebar
- **On load** — Supabase data takes priority over localStorage; if no Supabase record exists the current localStorage state is seeded up

The sync status indicator in the sidebar logo area shows:
- `connecting` (blue pulse) — initial load
- `saving` (amber pulse) — debounce window
- `synced` (green dot) — last save succeeded
- `sync error` (red dot) — last save failed (localStorage still works)

---

## Project Structure

```
src/
  app/
    (app)/            # Simulator pages inside the sidebar layout
      dashboard/
      fund/
      fundraising/
      pipeline/
      tasks/
      crm/
      modeling/
      learning/
    page.tsx          # Landing page (outside sidebar)
  components/
    dashboard/        # SimClock, TimeLog
    deals/            # DealPanel slide-over
    layout/           # Sidebar, TopBar
    ui/               # Badge, Button, Card, StatTile, Toast
  lib/
    supabase/         # client.ts, server.ts, database.types.ts, sync.ts
    dateUtils.ts
    seedData.ts
    types.ts
  store/
    simulationStore.tsx   # Core simulation engine + context
supabase/
  migrations/
    20260429000001_initial_schema.sql
  seed.sql
```
