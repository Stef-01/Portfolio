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

Both explainers open with a **scroll-triggered unit-person theatre** (`assets/dotfield.js`, no
libraries): 200 procedurally drawn people (skin/hair variety from a seeded PRNG; faces resolve
when the camera comes close) that move through composed scenes — cloud → **scan sweep** (figures
take persona colours) → ranked queue / persona clusters → the story's own choreography (queue
separation and backfill in E01; doctor matching, outbound pulses and retention in E02) → stat
count-ups. All layouts are procedural (phyllotaxis packing, stable across resizes); the camera
is a projective transform that can lock onto one named person; composition lives inside the
**stage box** — a rect that excludes the caption column, caps at 1150 px and insets from the
topbar and stage floor — with figure size derived from a legibility target against that box. **Interaction model (post-RCA): scroll SELECTS a scene —
crossing a step threshold fires a timed, eased tween (≤1.4 s) that always completes.** The only
states that can persist on screen are the composed scenes themselves; in-scene effects play
during the entry tween and rest in their completed pose (see
`docs/rca-animation-postmortem.md`).

Research basis: the original Surgo explainer is confirmed (designer/developer portfolio + on-page
captions) to be a Scrollama + D3 **animated-circle unit visualization** whose circles re-sort from
demographic groups into the 5 persona segments on scroll, with 24–41-word captions, 5 persona
hues, ~3 element groups per scene, and hover only in the finale — this theatre reproduces that
grammar for the care-model domain.

### The clutter budget (numeric, enforced in code and audited)

| Metric | Budget (source) | This build |
|---|---|---|
| Focus text per scene | ≤ 30 words (Flourish/ONA one-idea-per-step; Surgo measured 24–41) | 11–30 words, one block, longest measured 30; windows sized so two captions never co-exist |
| Active hues per scene | 1 accent + gray context; ≤ 7 ceiling (Datawrapper); 5 persona hues when the segmentation IS the story (Surgo) | neutral-gray scenes until the scan; then the 5 validated persona hues + 1 accent |
| Concurrent choreographies | 1 (Heer & Robertson staged transitions) | one morph at a time; extras animate only while dots hold |
| Non-data elements on stage | ≤ 5–6 labels + caption, zero chrome | ≤ 5 persona labels + 1 caption + at most 1 narrative card; no gridlines/borders/axes on stage |
| Resting states | only composed scenes may persist (the reference's Scrollama+D3 trigger pattern) | scroll selects the scene; the entry tween always completes, so parking anywhere settles on a composed pose (byte-verified by `care-personas/tests/theatre-qa.mjs`) |
| Idle motion at rest | zero autonomous/looping motion (WCAG 2.2.2) | zero after settle — motion is a single ≤1.4 s one-shot tween per step crossing, plus one 0.9 s count-up |
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

- **Fix-all round (v3.1, 2026-08-10) — every deferred RCA item closed.**
  *R4 closed for real:* labels can bind to a group (`{group, dx, dy}`) and ride its **live
  centroid** through transitions — E02's persona labels now fly WITH their people into the
  match scenes instead of hovering where the cluster used to be; E01's pool titles ride the
  book as it grows; builtin cluster labels bound likewise. Offsets ease between scenes so
  radius changes don't pop.
  *Clinicians respect scene dimming* (`dimWith`): in E02's zoom, the four non-focus doctors
  recede with their patients. *Clinician name font* clamped to 10–15 px (was scaling to ~27 px
  under the zoom camera). *Multi-scene jumps* teleport to one scene short of the target and
  play a single clean tween instead of a 1.4 s fast-forward through the whole story.
  *`<dialog>` fallback:* the MBS pop-out now works without `showModal` (older Safari) — same
  centred card, shadow-cast backdrop, Escape/×/backdrop-click all close it.
  *Sprite cache — evaluated and REJECTED on measurement:* baking colour-stable figures to
  offscreen sprites made the 12× CPU-throttle p95 **worse** (27.3 ms vs 22 ms live), because a
  scaled `drawImage` costs ~3× the glyph's three path fills under software rasterization and
  native-size blits only reach parity while adding bake spikes. Kept instead: scan endpoints
  return shared palette refs and identical-colour transitions skip `mixRgb`, so at-rest and
  same-colour frames allocate nothing. 12× p95 ≈ 22 ms, max 26–28 ms (spike-free).
  *Process (A6) made real:* `care-personas/tests/theatre-qa.mjs` is a committed, dependency-free
  harness that drives REAL scrolling at 390/1280/2000 px, parks 60% into transitions and
  byte-compares the settled canvas against the composed scene, then checks stillness, completed
  scan at rest, one-caption discipline, mobile overflow and reduced-motion stillness.
  *Docs truthed up:* this plan's theatre description and budget table now describe the
  trigger-tween model (the dwell:travel row died with the scrub).

- **Composition sweep (v3.2, 2026-08-10) — every stage/caption collision closed.**
  A full-surface capture (all 4 pages × 390/1280/2000 px, every resting scene plus every
  below-theatre section) surfaced one root cause and a family of composition defects, all fixed:
  *Root cause:* the generic `section{padding:84px 0 36px}` applied to the theatre too, so the
  sticky stage pinned 84 px late — scene 0's caption hung below the fold on entry (clipped
  outright at 800 px-tall viewports). `.theatre` now zeroes that padding; the stage pins at
  exactly the story top on every viewport.
  *Narrow (390):* E01's specialist queue and pool titles started inside the caption block —
  geometry now starts below it (queue top 0.42 H, pools 0.50/0.70 H) and the eConsult arc apex
  clamps below the caption; E02's doctor rail began at 0.14 H (rings colliding with the topbar
  and headline) — now 0.30–0.86 H, with the narrow cluster column nudged off the rail and the
  practice/retention captions moved to the stage foot.
  *Short desktop (1280×800):* the queue title rendered under the opaque topbar (y0 now floors
  at 128 px); clinicians now recede in dim-everything scenes so the stats overlay reads clean;
  the orange cluster and doctor row no longer graze the caption column (slot 1 → [0.38, 0.64],
  doc row → 0.38 + 0.14 g, zoom cameras retargeted).
  *Detail:* doctor name labels drop below their declared-focus ring instead of through it;
  quiz/demo chips and the model-reset button gained visible keyboard focus rings.
  Verified: stage pin + caption-inside-fold probes at all three widths, full theatre-qa matrix
  green, exec summary still exactly one printed page.

- **Narrative rebuild (v4, 2026-08-11) — a person before the population; scenes roughly doubled.**
  A second post-mortem (`docs/rca-animation-postmortem.md`, post-mortem #2) measured what the
  "still looks terrible" screenshot showed: four consecutive Explainer-02 scenes had **zero
  painted pixels in the top half** of a 2000×950 stage, with 11–12 of 20 horizontal bands empty
  and doctor rings running off the bottom edge. Three root causes: no composition frame (R7),
  caption and graphic sharing one surface (R8), and no human anywhere in the story (R9).
  *The stage box (A7/A8):* the engine now computes one rect — caption column excluded, capped at
  1150 px, inset from topbar and floor — and every layout is authored in a plain `box.w × box.h`
  rect translated into it. The caption is a real column (`clamp(300px, 28vw, 460px)`, vertically
  centred; a top band when narrow), and the box begins where the column ends.
  *Persona units in a 3-over-2 grid (A9)* fill both axes at roughly twice the previous size.
  *Narrative cards + focus camera (A10):* a card pins plain-language lines to one named person
  (rows reveal during the entry tween; marks are bullet, tick, or struck-through cross),
  `cam: { on: 'focus' }` tracks a chosen individual at any viewport, and per-person
  `fadeDot`/`greyDot` hooks isolate one figure from two hundred.
  *Both stories rewritten (A11).* **E02 (10 → 18 scenes)** follows one patient: her four
  requirements as bullet points, her neighbours' different ones, the whole population's, the
  directory that stores none of them, the stranger she books with every line struck through, the
  52% who stop coming back — then rewind, ask first, and match on exactly what they said.
  **E01 (9 → 17 scenes)** opens inside the GP's book: heart failure and hypertension are 30% of
  it; the GP already manages half comfortably; the referred half splits cleanly into nine that a
  GP could hold with a 72-hour answer and condition-specific upskilling (mild fluid overload in
  known HF, hypertension needing a third agent, post-discharge titration) and nine that genuinely
  need whole-of-training care (new cardiomyopathy, resistant hypertension, valve disease) — then
  all eighteen posted down one unsorted pathway, the clinic filling with titration, and the nine
  who needed a cardiologist waiting at the back for 127 days.
  *Arithmetic reconciled:* with the cohort in the queue the ranked line is 99 figures, so the
  bottom 20% is now the nine palmed-off plus the pool's stable end (20 figures) and every caption,
  label and backfill count moves from sixteen to twenty; the genuinely-specialist nine rank at the
  top of the sorted queue, not the bottom.
  *Measured after:* zero scenes with a dead top half (was four), painted ink 2.6–8.8% (was
  2.2–3.8%), full `theatre-qa.mjs` matrix green at 390/1280/2000 for both storyboards.

- **Loop-closure revision (v4.1, 2026-08-11) — the payoff for the complex nine made visible.**
  User appraisal: after the routine work moved to the GP, the story never showed the genuinely
  complex patients *reaching the cardiologist earlier* — the reason the whole mechanism exists.
  Three fixes, all verified frame-by-frame:
  *The colour thread no longer breaks.* From the rank scene onward the cohort groups (GP-manages
  green, palmed-off orange, genuinely-specialist dark blue) stayed neutral — the identity chain
  snapped exactly where the mechanism began. All mechanism scenes now colour the cohort
  (`TRACK`), so the viewer can follow the same nine from the breakdown into the queue and out.
  *The rank scene names the rise:* "The nine from this book rise straight to the top" — and the
  ranked layout puts them there, directly under the cardiologist.
  *A new scene 14 closes the loop* (E01 is now 18 scenes): same backfill layout, camera glides to
  the front of the queue, everything but the nine recedes, and a ticked card revisits the same
  three conditions from the breakdown — "New cardiomyopathy — echo in week three · Resistant
  hypertension — work-up under way · Valve disease — surgical opinion booked" — under the caption
  "The complex nine are seen in 55 days, not 127" (consistent with the −57% wait stat). On
  phones the card compacts to a single tick: "Straight to the cardiologist."
  *Supporting corrections:* the backfill layout keeps the nine at the front (the twenty
  waitlist arrivals slot in behind them), the false "including the nine" backfill caption is
  gone, and the unsorted-arrival scenes now subtitle the queue "unsorted — in the order they
  were referred" instead of claiming "most complex first". Full theatre-qa matrix green;
  captions still ≤30 words.

- **Alignment-mechanism revision (v4.2, 2026-08-11) — why concordance works, made explicit.**
  User appraisal: the match story showed *who* patients get but not *what changes in the room* —
  the actual mechanism by which a culture- and language-aligned GP reduces disengagement.
  Three layers added, all Hoa-consistent:
  *Theatre (E02 now 20 scenes):* a "two consultations" pair. After the mismatch, a cross-marked
  card shows what she was told — "Cut the rice" (rice is dinner, every night), the weight
  lecture, a plan in English her daughter translates at 9 pm, the herbal tonic waved away — under
  "She nods, goes home, and nothing changes. Advice that collides with her food, her language and
  her beliefs can't be followed — only endured." After her match, the tick-marked mirror: diabetes
  explained through the meals she actually cooks (swaps, not bans); **asks what she believes
  caused it and builds the plan from her answer** (explanatory models); her tonic checked
  alongside the metformin; Vietnamese first — under "a plan understood is a plan she can follow."
  *Persona cards:* every persona gained an "In the room, that means" block — first-language
  consults with no child interpreter and diagnosis explained inside the patient's own aetiology
  (wind/heat/worry) for the Mirror Seeker; cuisine-internal prescribing, fasting-aware dose
  re-timing and festival obligations treated as fixed points for the Table Matcher; lecture-free
  disclosure-first consults for the No-Judgement Seeker; trends-on-screen-first titration for the
  Data Devotee; family-in-the-room decision-making for the Continuity Craver.
  *Section block:* "Same diagnosis, two consultations" — a five-row misaligned/aligned contrast
  (theory of illness reconciled vs overridden; cuisine banned vs built-in; fasting/festivals as
  lapses vs fixed points; remedies underground vs reconciled; child interpreters and trampled
  decision rules vs elders present, no shame tax), each side ending in its outcome: quiet
  non-adherence vs "the patient can repeat the plan back in their own words."
  Full theatre-qa matrix green (20-scene E02, rmScene 14); captions still ≤30 words.

- **Aesthetic-harmony polish (v4.3, 2026-08-11) — one surface language for canvas and page.**
  Screenshot-verified round unifying the theatre's drawn chrome with the page's card system:
  *Cards:* narrative cards now share the page's exact border (#e3e7f0), radii (16/11px), and a
  softer lifted shadow (rgba(15,24,52,.14), blur 22, offset 7) with a 10px entry rise — the same
  object at rest whether drawn on canvas or laid out in HTML. *Colour:* one success green
  everywhere — `--good` and the canvas tick mark both #0b7d3e (was two greens). *Type:* big
  canvas labels adopt the page kickers' letter-spacing (1.4px, progressive enhancement via
  `ctx.letterSpacing`). *Composition:* E01's specialist queue gained a faint rounded track
  (#1c5cab at 5.5% alpha) behind all queue scenes, giving the column the same "zone" treatment
  the pools always had; the ranked queue's "least complex — stable" endpoint label moved clear of
  the bottom figure (was overprinting it); the backfill annotation became a two-line stack pulled
  inside the stage at 1280px (single line clipped the canvas edge) and is dropped at narrow
  widths where the caption already states it and the stage has no room. Verified by eyeballing
  1500/1280/390px captures of every touched scene; full theatre-qa matrix green.

## Roadmap (v2)

Real MBS item lookups. The product is otherwise feature-complete for its purpose.
