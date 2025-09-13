# VTMS Roster Management System (vtmsroster)

A Vite + React + TypeScript + Tailwind app powered by Supabase for authentication and data storage.

## Quick Start (Local)

```bash
.
cp .env.example .env
# fill your Supabase values in .env
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy (Netlify)

- Build command: `npm run build`
- Publish directory: `dist`
- Environment Variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Supabase Setup

1. Open **Supabase Dashboard → SQL Editor**.
2. Paste the contents of `supabase.sql` (provided below in this chat) or run the migration file in this repo:
   - `supabase/migrations/20250913083032_wild_heart.sql` (schema + RLS + demo users)
   - plus the auto-swap trigger in the SQL snippet for shift exchanges.
3. Run.
4. Log in with demo users (e.g., `raja / raja123`).

## Notes

- Shift Exchanges: when a request is **approved**, the roster shifts are auto-swapped (via DB trigger).
- Admins can edit any shift manually.
