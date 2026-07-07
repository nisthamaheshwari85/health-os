# Mobile (Phase 2)

Not built yet — intentionally. The web MVP needs to prove the core loop
(Health Score + AI Coach + logging → daily return visits) before doubling
the surface area to maintain.

When you start this:

1. Scaffold with `npx react-native@latest init HealthOS` (or Expo, if you
   want OTA updates and don't need custom native modules yet — Expo is the
   easier starting point for a solo/small team).
2. Add `@health-os/shared` as a dependency (same types as the web app) and
   `@supabase/supabase-js` — it's the **same Supabase project and schema**,
   so no backend work is needed to bring mobile online.
3. Wearable integrations (Apple Health / Google Health Connect) are a mobile
   app concern — this is the main reason mobile matters early in the
   roadmap, more than "users want an app icon." Prioritize the wearable
   sync screens first, since that's the thing the web app fundamentally
   cannot do.
4. Reuse the scoring logic conceptually from `apps/web/lib/healthScore.ts`,
   but note it currently lives in the web app — when mobile starts, move it
   into `packages/shared` so both apps compute the score identically.
