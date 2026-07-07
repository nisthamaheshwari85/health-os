# Architecture

## Overview

```
apps/web (Next.js)  ──┐
apps/mobile (RN, V2) ──┼──►  Supabase (Postgres + Auth + Storage + RLS)
                       │
                       └──►  AI adapter (lib/ai.ts)
                              ├─ free: rule-based (default, $0)
                              ├─ free: local Ollama (self-hosted, $0)
                              └─ paid: Anthropic / OpenAI (swap via env var)
```

One backend (Supabase) serves both web and the future mobile app, using the
shared TypeScript types in `packages/shared`. This avoids building two
backends or duplicating the data model.

## Data pipeline (v1 → v2)

1. **Collection:** manual logging (v1) → wearable sync + photo recognition
   (v2). All writes land in the same `health_metrics`/`meals` tables
   regardless of source, tagged with a `source` column, so the scoring logic
   never needs to know where the number came from.
2. **Scoring:** `healthScore.ts` reads the last N days of metrics and
   computes a weighted score. This is intentionally a plain function, not a
   model, so the user (and you) can always see *why* the score moved.
3. **Recommendation engine (v1 → v2):** v1 just surfaces the lowest-scoring
   input as "today's priority." V2 replaces the fixed rule with a per-user
   model once you have enough history to know that, say, *this* user's mood
   tracks sleep more than exercise.
4. **Memory (AI Coach):** v1 sends the last few chat turns + today's score
   snapshot as context. V2 adds a `coach_memory` summary table, updated
   asynchronously after each session, so the model gets a compact durable
   summary instead of an ever-growing transcript.

## AI intelligence engine — component responsibilities

- **User profile:** `profiles` table — static facts (goals, constraints,
  injuries) that don't change daily.
- **Health Twin:** the combination of `health_metrics` + `healthScore.ts` —
  the "live" state.
- **Recommendation engine:** currently rule-based (see above); designed to
  be swapped for a model without changing its call signature
  (`getTodayPriorities(userId)`).
- **Confidence scoring:** not implemented in v1 — flagged here because once
  you add predictive features (V4), every prediction shown to a user should
  carry a confidence indicator so the product never overstates certainty
  about someone's health.
- **Notification engine:** not in this starter; when you add it, trigger off
  the same `health_metrics` writes rather than a separate cron-computed
  state, so notifications and the dashboard never disagree.

## Security, privacy, compliance

- **Row-Level Security (RLS):** every table in `schema.sql` has RLS enabled
  so a user can only read/write their own rows — this is non-negotiable for
  health data and is set up from day one, not retrofitted.
- **Secrets:** the anon Supabase key is safe to expose client-side (RLS is
  what actually protects data); never expose a Supabase *service role* key
  or an AI provider API key to the browser — both are used server-side only
  (see `app/api/*/route.ts`).
- **Compliance is a roadmap item, not a checkbox:** this starter is not
  HIPAA/GDPR-certified out of the box. Before handling real medical data
  (blood reports, diagnoses) you'll need: a signed BAA with any processor
  touching PHI (if operating in the US), a documented data retention/deletion
  policy, and legal review of your AI provider's data-handling terms. Do this
  before V3's blood-report feature, not after.
- **Diagnostic content:** the symptom checker and blood report analysis
  (V3/V4) should be built with a licensed medical content partner and clear
  "not a diagnosis" framing — this is a trust and liability boundary, not
  just a UX detail.

## Scalability notes

- Supabase Postgres scales vertically quite far before you need to think
  about sharding; the relational model (users → metrics → scores) benefits
  from real joins, which is why this isn't a document database.
- The AI adapter pattern means you can run the free/local tier for early
  users and switch cohorts to a paid model without a rewrite — useful when
  you want to control AI cost per user tier (e.g., paid subscribers get the
  better model).
- Keep the scoring function pure (input metrics → score) so it can later run
  as a background job over historical data without depending on request
  context.
