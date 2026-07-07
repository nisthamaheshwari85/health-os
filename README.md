# Health OS — AI-First Preventive Healthcare Platform

An "Operating System for Human Health": one AI Health Twin that learns from your
sleep, food, movement, mood and labs, and turns it into a daily plan — coached
by an AI that remembers you.

This repo is the **MVP starting point**, not the finished billion-dollar
product. It's structured so every one of the 18 feature areas in the original
product brief has a clear home to grow into. See `docs/ROADMAP.md` for the
full build sequence and `docs/PRODUCT_SPEC.md` for feature-level detail.

## What's actually working in this starter

- Email/password auth (Supabase)
- AI Health Twin data model (`supabase/schema.sql`)
- Dashboard with a live Health Score + Today's Priorities
- AI Coach chat — works **out of the box with zero API cost** (rule-based
  free engine), with a one-line switch to Ollama (free, local LLM) or a paid
  API (Claude/OpenAI) when you're ready for smarter conversations
- Nutrition logging (manual entry now, barcode/photo recognition stubbed for
  Phase 2 — see roadmap)
- Streaks/XP table wired into the schema, ready for the gamification UI

## Stack (and why)

| Layer | Choice | Why |
|---|---|---|
| Frontend (web) | Next.js 14 (App Router) + TypeScript + Tailwind | One codebase, fast iteration, server components for data-heavy dashboard |
| Frontend (mobile) | React Native (Phase 2, see `apps/mobile`) | Shares `packages/shared` types + the same Supabase backend, so no second backend to build |
| Backend | Supabase (Postgres + Auth + Storage + Row-Level Security) | Free tier is generous, gives you auth/db/storage/realtime on day one, and Postgres scales to a real relational health data model (you'll want joins across meals/labs/wearables later, not a document store) |
| AI (coach) | Pluggable adapter: free rule-based → free local Ollama → paid Claude/OpenAI | Start at $0, upgrade only when you have users to justify the API bill |

## Quick start

1. **Create a free Supabase project** at supabase.com → copy your Project URL
   and anon key.
2. Run the schema:
   ```bash
   # In the Supabase SQL editor, paste and run:
   supabase/schema.sql
   ```
3. Set up the web app (this is an npm workspaces monorepo — install from the root):
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   npm install
   npm run dev
   ```
4. Open http://localhost:3000 — sign up, log a meal, open the AI Coach.

### Making the AI Coach smarter (optional, still free)

Install [Ollama](https://ollama.com), pull a model, and set in `.env.local`:
```
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.1
```
No code changes needed — `apps/web/lib/ai.ts` already routes to it.

To later use Claude or OpenAI for production-quality coaching, set
`AI_PROVIDER=anthropic` or `AI_PROVIDER=openai` and add the matching API key —
see comments in `apps/web/lib/ai.ts`.

## Repo layout

```
health-os/
├── apps/
│   ├── web/          # Next.js app — the MVP lives here
│   └── mobile/        # React Native app — Phase 2, see its README
├── packages/
│   └── shared/        # Types shared between web + mobile
├── supabase/
│   └── schema.sql      # Full data model (profiles, metrics, meals, chat, streaks, xp)
└── docs/
    ├── ROADMAP.md       # MVP → V2 → V3 → V4 → Global → 5-year vision
    ├── PRODUCT_SPEC.md  # Feature-by-feature breakdown (problem, AI, business value, priority)
    └── ARCHITECTURE.md  # AI intelligence engine, data pipeline, security/compliance
```

## Design direction

The UI uses a "clinical calm" palette (deep biological green-black,
mint "vital" accent, coral for streaks/alerts) with a recurring **vital-line
waveform** motif as the app's signature element — it doubles as a section
divider and as the animated stroke on the Health Score card. Details in
`apps/web/tailwind.config.ts`.
