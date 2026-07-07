# Product Spec

Full breakdown for every MVP feature (built or scaffolded in this repo), plus
a summary table for everything in V2 onward. Writing a full breakdown for all
~60 features in the original brief before you have a single user would be a
planning exercise, not a startup — the MVP features below are where the
actual bets are, and the rest is intentionally sequenced in `ROADMAP.md`.

---

## 1. AI Health Twin (v1)

- **Problem solved:** Health data is scattered across memory, apps, and
  paper — nobody sees the whole picture, so nobody acts on it.
- **User journey:** User logs sleep/food/mood/activity (manually at first) →
  Twin recalculates a single Health Score → user sees which input is
  dragging the score down today.
- **AI integration (v1 → later):** v1 is a transparent weighted-average
  scoring function (see `apps/web/lib/healthScore.ts`) — deliberately
  explainable, not a black box. Once you have enough users, replace the fixed
  weights with a per-user model that learns which inputs actually predict
  *this person's* energy/mood (that's the real "twin").
- **Required data:** sleep hours, meals logged, activity minutes, mood/stress
  self-report; later: wearable streams, lab values.
- **Technical approach:** Postgres tables (`health_metrics`) + a scoring
  function called on read; no ML infra needed until v2.
- **Business value:** the single-number hook that makes the rest of the app
  make sense at a glance; foundation every other feature reads from.
- **Monetization potential:** indirect — retention driver, not a paid
  feature itself.
- **Complexity:** Easy (v1) → Hard (personalized model, v2+).
- **Priority:** MVP.

## 2. Dashboard (Health Score + Today's Priorities)

- **Problem solved:** Users don't know what to do *today* — raw data isn't
  advice.
- **User journey:** Open app → see score + the 1-3 things that would move it
  most → tap one → logs an action.
- **AI integration:** priority ranking is a simple rule engine in v1
  (lowest-scoring input wins); becomes a recommendation model later.
- **Required data:** same as Health Twin.
- **Technical approach:** Next.js server component fetching from Supabase,
  no client-side loading spinner needed for the main score.
- **Business value:** primary daily-open surface.
- **Monetization potential:** none directly; premium tier can unlock deeper
  trend views (V2).
- **Complexity:** Easy.
- **Priority:** MVP.

## 3. AI Coach

- **Problem solved:** People need a nudge and a sounding board between
  sessions with a human coach (or in place of one, if they can't afford it).
- **User journey:** Open Coach tab → chat like texting a person → coach
  references today's logged data ("you slept 5h, want a lighter workout
  today?").
- **AI integration:** `apps/web/lib/ai.ts` is a provider-agnostic adapter.
  Ships with a free rule-based responder (keyword + state matching against
  the user's own logged data, zero API cost), upgradeable to a local Ollama
  model (still free, better quality) or a paid API (Claude/OpenAI) with a
  one-line env var change. Memory in v1 = last N messages + today's metrics;
  real long-term memory (V2) = a per-user summary table updated after each
  session, not the full transcript re-sent every time.
- **Required data:** chat history, current Health Twin snapshot.
- **Technical approach:** `app/api/coach/route.ts` API route, `chat_messages`
  table for history.
- **Business value:** highest-frequency touchpoint in the app.
- **Monetization potential:** "Coach+" tier with the paid-model upgrade and
  longer memory.
- **Complexity:** Easy (v1 rule-based) → Medium (local LLM) → Medium (paid
  API with memory).
- **Priority:** MVP.

## 4. Nutrition Logging (manual)

- **Problem solved:** Health Twin needs food data; photo/barcode recognition
  is a V2 investment, but you can't wait to start collecting data.
- **User journey:** Add meal → name, rough macros, time → feeds today's
  score.
- **AI integration:** none yet in v1; this is the data-collection step that
  V2's photo recognition will eventually replace as the primary input
  method.
- **Required data:** meal name, macros, timestamp.
- **Technical approach:** simple form → `meals` table.
- **Business value:** without this, the Health Twin has no nutrition signal
  at all.
- **Monetization potential:** none directly.
- **Complexity:** Easy.
- **Priority:** MVP.

## 5. Streaks / XP data model

- **Problem solved:** Habit formation needs a visible record of consistency,
  even before the full gamification UI exists.
- **User journey:** (UI arrives V2) — logging any metric today extends a
  streak; schema is built now so no data migration is needed later.
- **AI integration:** none — this is intentionally simple and transparent.
- **Required data:** daily log events.
- **Technical approach:** `streaks` and `xp_events` tables, updated by a
  Postgres trigger or a small server function on each log insert.
- **Business value:** retention infrastructure — cheapest to add at schema
  design time, expensive to retrofit.
- **Monetization potential:** none directly.
- **Complexity:** Easy.
- **Priority:** MVP (schema only; UI is V2).

---

## V2 onward — summary

| Feature | Priority | Complexity | One-line why |
|---|---|---|---|
| Food photo recognition | V2 | Hard | Removes the #1 friction point in nutrition logging |
| Apple Health / Google Health Connect sync | V2 | Medium | Covers most users for least integration effort |
| Gamification UI (quests, achievements) | V2 | Medium | Converts the V1 streak/XP data into a visible habit loop |
| Workout generator | V2 | Medium | Second daily-use surface beyond nutrition |
| Paid AI model upgrade for Coach | V2 | Easy | Quality jump once usage justifies API cost |
| Coach platform (marketplace) | V3 | Hard | Two-sided marketplace = real defensibility |
| Blood report analysis (OCR + reference ranges) | V3 | Hard | High trust bar; needs compliance review before launch |
| Community / challenges / leaderboards | V3 | Medium | Social retention layer once core loop is proven |
| Subscription billing + marketplace take-rate | V3 | Medium | Revenue infra |
| Predictive risk modeling | V4 | Hard | Needs 12+ months of your own longitudinal data first |
| Corporate wellness dashboard | V4 | Medium | New revenue channel, reuses existing data model |
| WHOOP / Oura / Garmin / smart scale integrations | V4 | Medium | Long tail of wearables, lower priority than Apple/Google |
| Symptom checker | V4 | Hard | Partner with licensed medical content provider, don't build diagnostic logic in-house |
| Localization + regional compliance | Global | Hard | Required before any non-home-market launch |
| Insurance/payer partnerships | 5yr | Hard | Requires validated outcomes data, not just usage data |

## Startup-strategy notes (why this can be defensible)

- **Why users choose this over Apple Health/WHOOP/Noom individually:** those
  apps each own one data type (sleep, food, mood) and don't talk to each
  other. The wedge here is the single Health Score that fuses all of them —
  the value compounds with more data types, not with a better UI for one
  data type.
- **Moat:** in order — (1) the longitudinal per-user data the personalized
  Twin model needs (a competitor starting today can't get last year's sleep
  data for your users), (2) the coach marketplace once it exists (two-sided
  networks are hard to bootstrap twice), (3) trust/compliance once you're
  handling lab data (a real regulatory and audit cost new entrants have to
  repeat).
- **Why it's hard to copy quickly:** the individual features (chat, food
  logging, wearable sync) are all copyable in isolation and several
  well-funded competitors already have pieces of this. The data moat and the
  marketplace are the parts that take years, not the UI.
