# Plan — “Care Personas”: a standalone two-explainer product

**Product folder:** `care-personas/` — plain HTML/CSS/JS, no build step, hostable on any static
host, independent of the portfolio app.
**Design brief:** read as a *direct continuation* of Surgo Ventures' vaccine-persona explainer —
geometric sans (Poppins/Inter), deep-navy color-blocking, bright persona hues, flat illustrated
avatars, a segmented population bar as the centrepiece, pill buttons, marker-highlight accents,
light-only.
**Shared assets:** `assets/style.css` (design system) · `assets/site.js` (reveal, tooltips,
scroll-to-persona).

---

## The shared method (both explainers, and the hub's framing)

1. **Segment** — replace the “average patient” with 5 named personas, sized as shares of a real
   book or population (full-width segmented bar, one validated colour per persona).
2. **Match** — assign each persona the clinician tier or relationship it actually needs.
3. **Align the money** — indicative dollars showing every stakeholder earns more.
4. **Ask small** — end with one fundable trial and hard KPIs.

## Explainer 01 — The Specialist-GP Pipeline (`specialist-gp-pipeline.html`)

**Argument:** the bottom quintile (~20%) of a specialist's caseload is mispriced work for a
specialist and premium work for an accredited GP. A **Complexity Screen** (stability · devices ·
comorbidity · admissions · titration · red flags → 0–100) routes it to **Specialist-GPs** with an
eConsult backstop (≤72 h routine / 24 h urgent, $65/episode, 85–90% resolved without transfer,
≤15%/yr escalation).

**Personas (share of 2,000 appts/yr per cardiology FTE):** The Steady State 12% · The Protocol
Titration 8% *(both → pipeline = 400 appts ≈ 130 patients)* · The Multimorbid Juggler 35% ·
The Diagnostic Puzzle 20% · The High-Stakes 25% *(specialist core)*.

**Key indicative economics (AUD, MBS-rounded):**
- GP: $86 → **$535/patient/yr** (2×C $83 + D $122 + GPMP $165 + review $82) = **+$449**;
  30–40 patients → **+$13–18k/yr per GP**.
- Specialist: 400 freed slots $36.8k → **$71.8k** (240 new complex × $170 + 160 reviews × $92 +
  250 eConsults × $65) = **+$35k/FTE/yr**, plus ≈ $200k/yr downstream diagnostics to the dept.
- Network (6 FTE): $384k/yr setting-shift ($290→$130/visit × 2,400) + $312k/yr avoided ED &
  admissions = **$696k/yr**; wait 127 → 55 days (−57%).
- Honest ledger: network payback ≈ 8 months on a $460k trial; Medicare pays ≈ +$560k/yr and buys
  1,440 extra complex assessments — throughput, not fee inflation.

**Trial:** 12 months, one 6-FTE department, ~24 accredited GPs, $460k; 8 KPIs incl. wait ≤75
days, eConsult resolution ≥85%, escalation ≤15%, no ED-representation increase, GP +8% /
specialist +9% billings, PREM ≥85%. Six risk→safeguard pairs close the page.

## Explainer 02 — The Matched Family GP (`matched-family-gp.html`)

**Argument:** patients disengage because the front door doesn't fit. Match them — in a
**20-second preference conversation** — against **clinician profiles built by onboarding
interviews** (“which patients do you want more of?”), then keep them with an **outbound engine**:
proactive slot offers (“reply YES to book”) and EHR-predicted cadences (post-MI q3mo year 1,
T2DM 3–6mo, mental-health plan reviews, postnatal, CKD). Revives the family-GP model; lets GPs
specialise in the medicine they love; a demand-triggered $15–25 out-of-pocket premium once a
diary runs >95% full (non-concession only).

**Personas (share of the ~40% loosely attached):** The Mirror Seeker 18% · The Table Matcher 14%
· The No-Judgement Seeker 24% · The Data Devotee 12% · The Continuity Craver 32%.

**Key indicative economics:** 560 lost appts/GP FTE/yr (≈$36k) → ~340 refilled (+$22k) +
re-engaged care plans (+$9k) ≈ **+$30k/FTE/yr**; visits 1.7 → 2.9/yr matched; retention 48% →
81%; no-shows 8% → <3%; chronic follow-up completion 52% → 78%; GP preferred-scope share 25% →
55%.

**Interactives:** the 20-second match demo (5 preference chips re-rank 6 fictional clinician
cards with “why this match” highlights) · phone mock of three outbound messages · post-MI cadence
timeline. **Pilot:** 6 months, 3 practices, 30 GPs, $380k, 7 KPIs (incl. opt-out ≤10%).
**Guardrails:** matching never gatekeeps; clinical governance owns cadences; consent-only data;
bulk-billing floor; quarterly bias audits; the engine never triages emergencies.

## Hub (`index.html`)

Brand mark (5 persona dots), headline, the shared method, two hub cards with mini segmented bars.

## Design system & validation

- Persona colours = validated categorical slots 1–5 (blue `#2a78d6`, orange `#eb6834`, aqua
  `#1baf7a`, yellow `#eda100`, magenta `#e87ba4`): all CVD checks pass on the light surface
  (worst adjacent ΔE 9.1); sub-3:1 hues (aqua/yellow/magenta) relieved with in-segment labels,
  chips and table views under every chart.
- Clinician tiers = blue ordinal ramp (GP `#86b6ef` / specialist `#1c5cab`).
- Comparison bars: Today `#8a93a8` vs proposed `#2a78d6`, legend on every pair, direct end labels,
  24px/20px marks, 2px surface gaps, 4px rounded data-ends, `tabular-nums` in tables only.
- Light-only by deliberate brand commitment (matches the reference site); `color-scheme: light`,
  explicit backgrounds throughout.
- Accessibility: keyboard-focusable segments with tooltips on focus, `<details>` table twins,
  `prefers-reduced-motion` respected, skip links, aria labels on charts and the diagram.

## Hosting

Deploy `care-personas/` as a static-site root (Vercel/Netlify/GitHub Pages). Only external
dependency: Google Fonts.

## Roadmap (v2)

Specialty switcher and scenario sliders recomputing the ledgers live · real MBS item lookups ·
per-1M-population state scaling · printable one-page executive summaries · a "which persona are
you?" patient-facing quiz for Explainer 02.
