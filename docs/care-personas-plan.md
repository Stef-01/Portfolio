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

## The dot-field theatre (animation-first layer)

Both explainers open with a **scroll-driven unit-dot theatre** (`assets/dotfield.js`, ~9 KB, no
libraries): 200 procedurally placed dots (each dot = 10 appointments / 1 patient) that morph
through choreographed scenes as the reader scrolls — cloud → complexity/preference **scan sweep**
(dots take persona colours) → **amalgamation** into 5 circle-packed clusters → amalgamation into
the segmented bar → **camera zoom in** on the target segment → zoom out into the split/match/
outbound choreography → stat count-ups. All layouts are procedural (phyllotaxis packing, seeded
PRNG so they're stable across resizes); the camera is a projective transform interpolated per
scene; every beat is **fully user-paced** — nothing moves unless the reader scrolls.

Research basis: the original Surgo explainer is confirmed (designer/developer portfolio + on-page
captions) to be a Scrollama + D3 **animated-circle unit visualization** whose circles re-sort from
demographic groups into the 5 persona segments on scroll, with 24–41-word captions, 5 persona
hues, ~3 element groups per scene, and hover only in the finale — this theatre reproduces that
grammar for the care-model domain.

### The clutter budget (numeric, enforced in code and audited)

| Metric | Budget (source) | This build |
|---|---|---|
| Focus text per scene | ≤ 30 words (Flourish/ONA one-idea-per-step; Surgo measured 24–41) | 10–16 words, one block; windows sized so two captions never co-exist |
| Active hues per scene | 1 accent + gray context; ≤ 7 ceiling (Datawrapper); 5 persona hues when the segmentation IS the story (Surgo) | neutral-gray scenes until the scan; then the 5 validated persona hues + 1 accent |
| Concurrent choreographies | 1 (Heer & Robertson staged transitions) | one morph at a time; extras animate only while dots hold |
| Non-data elements on stage | ≤ 5–6 labels + caption, zero chrome | ≤ 5 persona labels + 1 caption; no gridlines/borders/axes on stage |
| Dwell : travel | ≥ 2:1 of scroll distance | 67 : 33 per scene |
| Idle motion at rest | zero autonomous/looping motion (WCAG 2.2.2) | scroll-driven only; single 0.9 s one-shot count-up |
| Reduced motion | static states / crossfades (WCAG 2.3.3, C39) | single static composed frame + instant stat values |
| Text position | one fixed slot, 0 layout jumps (Bostock/Pudding) | fixed bottom-left slot every scene |
| Camera moves per story | ≤ 1 per scene, ~3–5 per story | 2 per story (zoom in, zoom out) |

Micro-animation elsewhere stays inside the same budget: comparison bars grow once on reveal,
sections fade up once; nothing loops.

### Measured audit results (six-agent verification, 2026-08-09)

- **Clutter (both pages, every integer and half-point scene position):** max caption 22 words
  (budget ≤30); max simultaneous captions **1** (verified by a 0.05-step sweep — second-highest
  caption opacity 0.000); material hue buckets ≤5 (the 5 persona hues; accent shares the orange
  bucket); ≤5 non-data elements on stage; zero chrome (no gridlines/borders/axes drawn).
- **Stillness at rest:** two canvas snapshots 1.5 s apart are byte-identical at every tested
  scene — including the outbound-rings scene — because all motion is a pure function of scroll
  progress; zero `requestAnimationFrame` activity while idle.
- **Amalgamation geometry:** the bar scene resolves into exactly 5 adjacent hue regions in
  persona order with spans proportional to the shares; the zoom scene measures 2.29× dot size
  vs the configured camera z = 2.2.
- **Performance:** p95 frame time 16.8 ms (60 fps) at DPR 1 and 2 on both pages; zero long
  tasks >100 ms; `.set()` median 0.7–0.8 ms over 500 calls; heap drift ≤0.07 MB; no listener growth.
- **Accessibility/degradation:** reduced-motion renders one static composed frame with final
  stat values (resize-safe); no-JS hides the theatre and shows 100% of section content; the
  theatre is `aria-hidden`; segments and chips are keyboard-reachable with focus tooltips.
- **Mobile:** zero page-level horizontal overflow at 390 px **and** 320 px across every scene;
  five clusters disjoint at 390 px (min gap 109 px); match-demo chips tappable; stats unclipped.
- Post-audit fixes applied: final caption now yields to the stats overlay as it fades in;
  reduced-motion overlays pinned across resizes; grid min-content propagation stopped
  (`min-width:0` + `minmax(min(px,100%),1fr)`); tiny-screen (≤380 px) type/topbar compaction;
  bar-grow fallback timer replaced with a `beforeprint` hook; canvas repaints once webfonts load.

## Hosting

Deploy `care-personas/` as a static-site root (Vercel/Netlify/GitHub Pages). Only external
dependency: Google Fonts. Canonical home: https://github.com/Stef-01/GP-specialty-visual-
(product at repo root); the Portfolio repo carries a mirror under `care-personas/`.

## Shipped since v1

- **Live scenario model (Explainer 01, §04):** four sliders (pipeline share 10–30%, appointments
  per FTE 1,600–2,400, eConsult fee $40–100, department FTEs 4–10) recompute the full ledger —
  specialist uplift, per-GP gain and GP headcount, network benefit, trial payback, new Medicare
  outlay, median wait — using exactly the arithmetic of the static cards; defaults reproduce the
  canonical figures. Keyboard-accessible ranges, `aria-live` outputs, reset button.
- **Persona quiz (Explainer 02, §09):** "Which care-match persona are you?" — five questions,
  one screen at a time, closing the story the way the reference explainer closes its own. The
  result card carries the persona avatar (ringed in its validated hue), population share, a
  first-person blurb, and a jump to the full persona card. Tally ties break toward the larger
  segment; focus moves to the next question for keyboard users; entirely client-side with
  nothing stored. JS-gated with a static five-persona summary as the no-JS fallback.

- **Specialty switcher + national scaling (Explainer 01, §08):** five specialties (cardiology,
  endocrinology, respiratory, gastroenterology, rheumatology) each with their own bottom-quintile
  exemplars, escalation triggers, share, freed slots, uplift and modelled wait — proving the
  mechanism is specialty-agnostic. Every uplift figure reconciles exactly with the live scenario
  model when driven to that specialty's parameters (verified programmatically; the respiratory
  figure was corrected from $37k to $36k when the cross-check caught it). Scaling is stated
  **per 1,000 specialist FTE** — 400,000 appointments redirected, 240,000 extra complex
  assessments, 130,000 patients into GP-led care, $116M network benefit against ~$93M new
  Medicare outlay — so no national workforce headcount is assumed or invented.

- **Motion pass (engine v2.1):** three changes, each measured.
  *Quality:* people now move **individually rather than as a block** — each figure starts at its
  own moment inside the travel window (34% of travel spent staggering entries) and walks a
  slightly **bowed bezier path**, so amalgamation reads as a crowd of individuals crossing, not a
  rigid slide. Clinicians and labels shared between two scenes now **travel to their new
  position** instead of crossfading into a visible second copy of themselves (this was ghosting
  "the cardiologist" mid-transition).
  *Cost:* memoised colour strings (a scroll frame was allocating ~600 throwaway strings) and a
  sub-pixel render-skip guard. Net effect at CPU throttle 12× (low-end phone): p95 render
  **27.6 ms → 21.2 ms**, worst frame **36.2 ms → 24.3 ms** (no dropped frames); unthrottled
  desktop median **1.3 ms → 0.7 ms** — faster despite the added per-dot maths.
  *Invariants re-verified:* the dwell window of an extra-free scene is byte-identical across its
  whole span, scene landings are idempotent, and nothing moves at rest — the stagger is
  normalised so every figure is exactly at its destination by the end of travel.
- **Storyboard v3 + scroll smoothing (engine v2.2):** rebuilt both theatres to be step-by-step
  after feedback that stages were being skipped.
  *Explainer 01 (9 stages):* pools → the specialist's patients **line up in complexity order**
  (ranked line, most complex left) → the bottom 20% **separate** ("medication optimisation, not a
  specialist") → zoom to faces ("GP-managed, followed up with eConsults") → the sixteen **move**
  to the GP → the **backfill**: sixteen more-complex patients waiting in general practice take
  the freed slots (the queue visibly advances) → the **incentive** ("the GP is paid properly for
  the borderline cases", +$449/patient/yr, eConsult arc) → the payoff (specialist pool fully
  complex, same size, better sorted) → stats.
  *Explainer 02 (10 stages):* population → scan → personas → **doctors declare what they bring**
  (five clinicians appear, each wearing a ring in the persona colour they declared for — culture
  & language, lived experience of the condition, lifestyle-first non-drug care, data literacy,
  whole-family books) → **match by colour** (every patient flows to the doctor wearing their
  colour) → zoom ("the doctor actually understands them") → outbound pulses from every doctor →
  "disengagement collapses" (48% → 81%) → stats.
  *Smoothness:* rendered progress now **chases the scroll target with critical damping** (settles
  ≈300 ms after the reader stops), so discrete wheel events no longer step the story; dwell:travel
  moved from 67:33 to **50:50** — a deliberate budget deviation, trading dwell for legible travel
  per Heer & Robertson's ~1 s/stage tracking guidance.
  *Cost:* `ctx.font` assignments cached (CSS font parsing was the new hot path) and label/clinician
  pairings memoised per scene pair. At CPU throttle 12×: p95 render **19.3 ms** (was 31.8 ms after
  the storyboard grew, 27.6 ms originally); dwell-freeze, stillness-at-rest and reduced-motion
  invariants re-verified; zero caption/canvas collisions and zero overflow at 390 px re-verified
  scene-by-scene.
- **Engine v3 — trigger-tween rebuild (see `docs/rca-animation-postmortem.md`):** a ten-stage
  RCA traced the "clunky/poor animation" verdict to six root causes, chief among them the
  scrub-driven morph model (every mid-transition frame was a legal resting state) and a figure
  scale capped at a dev-viewport constant. The engine now works like the reference explainer
  actually does: **scroll selects the scene, crossing a threshold fires a timed tween that
  always completes** (≤1.4 s, reverse on scroll-back, zero motion after settle), scenes at rest
  display their *completed* state (scan finished, packet docked), figures scale to a legibility
  target inside a centred ≤1500 px content column, and stagger/bows were tightened into
  coherent flocking. Verified byte-exact: parking mid-transition on a 2000×950 viewport now
  settles on the composed scene pose; figure height 18.7→23.4 px there; stillness, RM,
  overflow, collisions and throttle all re-verified.
- **Critical-appraisal round (v2.3):** four presentation defects found and fixed.
  *E01:* the two horizontal specialist rows became **one vertical queue** (two-abreast, most
  complex at the top) so the bottom 20% sit literally at the bottom; the stats overlay was
  re-ordered so the **GP benefit sits over the GP's side** and the specialist's over theirs;
  headline units made **uniform per-clinician-per-year** (+$15k per participating GP vs +$35k
  per specialist FTE — the $449/patient derivation moves to the caption and pop-out);
  and the money cards now carry **named MBS items** (23, 36, 44, 721, 732, 110, 116, plus the
  eConsult line explicitly flagged as a *proposed* item — no current MBS asynchronous-advice
  item exists) as clickable chips opening an **itemised pop-out derivation** (native `<dialog>`,
  fee × volume → subtotal → net, with the "today" comparator rows).
  *E02:* persona labels now persist through the doctor-row scene; the doctor row moved out of
  the caption column (it was parking two doctors under the story text in every scene from
  step 3 on); and the retention beat got a real visual — the arcs **tighten around their
  doctor** ("twelve months on — still here") instead of a caption over an unchanged frame.
  All invariants re-verified after the round (dwell freeze, stillness, overflow, caption
  collisions, 12× throttle p95 19.5 ms).
- **One-page executive summary (`executive-summary.html`):** both concepts side by side —
  problem, mechanism, four headline numbers each, generalisability, guardrails, and both asks —
  plus a "why the two belong together" note ($840k buys evidence for both). Print CSS targets
  **A4 portrait at 11 mm margins and is verified to render as exactly one page** (measured by
  generating the PDF and counting `/Type /Page` objects; the responsive column-stacking
  breakpoint is scoped to `screen` so print keeps two columns). Screen view carries a
  print/save-as-PDF button; linked from the hub and both explainer footers.

## Roadmap (v2)

Real MBS item lookups. The product is otherwise feature-complete for its purpose.
