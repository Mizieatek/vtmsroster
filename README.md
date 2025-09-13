# VTMS Roster (vtmsroster)

Vite + React + TypeScript + Tailwind + Supabase.

## Local
```
npm install
cp .env.example .env
# fill your Supabase values
npm run dev
```

## Build / Deploy (Netlify)
- Build: `npm run build`
- Publish dir: `dist`
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Supabase
Open `supabase.sql` in this repo, copy all into Supabase SQL Editor, and RUN.
