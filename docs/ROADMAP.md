# Roadmap

Prioritized by impact-vs-effort. Each phase assumes the previous one has real
users giving feedback before you build the next layer — don't build V3
features before V1 has retention data.

## MVP — 0 to 3 months (this repo gets you started here)

Goal: prove that people log data and come back daily for the coach + score.

| Feature | Why it's in the MVP |
|---|---|
| Auth + onboarding | Table stakes |
| AI Health Twin (v1: rules-based scoring, not ML yet) | The core "one score, one profile" hook |
| Dashboard (Health Score, Today's Priorities) | Daily open-the-app reason #1 |
| AI Coach (free tier: rule-based → local LLM) | Daily open-the-app reason #2, cheapest possible version |
| Manual nutrition logging | Needed to feed the Health Twin; photo/barcode is Phase 2 |
| Streak + XP data model (UI can be basic) | Retention infrastructure, cheap to add now vs. retrofit later |

**Explicitly deferred from MVP:** wearable integrations, coach marketplace,
blood report analysis, community/leaderboards, payments. These all depend on
the Health Twin + dashboard already existing.

## V2 — 3 to 6 months

- Wearable integrations (start with Apple Health + Google Health Connect —
  covers the largest share of users for least integration effort)
- Food photo recognition (single biggest UX upgrade to nutrition logging)
- Real gamification UI: streaks, daily quests, achievements
- Upgrade AI Coach to a paid model (Claude/OpenAI) once usage justifies cost
- Basic workout generator

## V3 — 6 to 12 months

- Coach platform (client management, chat, revenue dashboard) — this turns
  the product into a two-sided marketplace, a real moat
- Blood report analysis (start with OCR + reference-range flagging, not
  diagnosis — see compliance notes in ARCHITECTURE.md)
- Community: challenges, groups, accountability partners
- Subscription billing (Stripe) + coach marketplace take-rate

## V4 — 12 to 18 months

- Predictive health risk modeling (requires 12+ months of longitudinal data
  from your own users — this is why V1-V3 data collection matters)
- Corporate wellness / enterprise dashboard
- Additional wearables: WHOOP, Oura, Garmin, smart scales
- Symptom checker (partner with a licensed medical content provider —
  don't build unsupervised diagnostic logic in-house)

## Global launch — 18-24 months

- Localization (units, food databases, language)
- Regional compliance (GDPR done by V1; add region-specific health-data law
  as you expand — e.g. DPDP in India, HIPAA-adjacent rules if handling US
  clinical data)
- Multi-currency billing, regional payment methods

## 5-year vision

- Health Twin becomes predictive enough to flag risk before symptoms appear,
  validated against real clinical outcomes (this requires partnering with
  research institutions or payers — not a pure software problem)
- Insurance/payer partnerships where lower risk scores translate into
  premium discounts (aligns incentives: user, platform, and insurer all want
  the same outcome)
- Platform for third-party health coaches and clinics to run their practice
  entirely inside your ecosystem (the marketplace becomes the moat, not the
  tracking features — those get commoditized)

## Prioritization principle used throughout

Every feature above answers "yes" to at least two of: (1) does it feed the
Health Twin better data, (2) does it give someone a reason to open the app
today rather than tomorrow, (3) does it get harder for a competitor to copy
the longer you run it (data moat, marketplace moat, or trust/compliance
moat). Features that only answer "yes" to "it would look impressive to
investors" are deliberately pushed later — they're expensive and don't
compound.
