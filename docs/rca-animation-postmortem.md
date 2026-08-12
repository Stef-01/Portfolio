# RCA & post-mortem — why the theatres read as clunky, with poor animation

**Trigger:** user report with a live screenshot of Explainer 02's "Match them — by colour" scene
on a wide monitor: figures scattered in a diagonal smear, floating half-faded labels, dead space
across the top half, tiny people. Verdict accepted: *both theatres are visually clunky and the
animation is poor.* This document is the ten-stage root-cause analysis, the corrective actions,
and what changes in process so it does not recur.

---

## Stage 1 — Problem statement & scope

Five concrete defects, from the exhibit and from re-inspection of both explainers:

1. **Smeared resting states.** Mid-transition frames — figures strung out between layouts —
   can persist on screen indefinitely.
2. **Figures are specks on real monitors.** People and their faces are illegibly small at
   desktop sizes larger than the dev viewport.
3. **Dead composition.** Large regions of empty canvas; content pinned to corners; no visual
   centre, especially on wide screens.
4. **Floating annotations.** Persona labels hold their old positions while their people leave,
   hovering over nothing and colliding with passers-by.
5. **Motion tempo is wrong.** A fast flick teleports the story; a slow scroll makes figures
   crawl; either way transitions rarely play as designed.

## Stage 2 — Evidence (measured, not asserted)

Reproduced at the user's viewport class (2000 × 950, Chromium, real scrolling):

- **Exhibit A — resting mid-transition:** parking the scroll 60% into the scene 4→5 transition
  left the story resting at progress **4.599** — a permanent smear frame. Painted pixels:
  **2.42%** of the canvas, scattered across a bounding box covering **58.6%** of it: maximum
  dispersion, minimum ink — the numerical signature of "scattered mess".
- **Exhibit B — scale:** the figure-size unit clamps at **U = 11 px**, so a person is
  **18.7 px ≈ 1.97% of viewport height** on that monitor. For comparison, the persona cards'
  avatars — the size at which the faces actually read — are 64 px.
- **Exhibit C — process blindness:** every QA screenshot in the build history was taken at
  1280 × 800 via the audit API at *scene endpoints* (`set(N)`) or hand-picked mid-points held
  for a beat. Not one artefact sampled *where a real reader actually rests* on a large screen.

## Stage 3 — Timeline reconstruction (how we got here)

1. **v1 dots** — scroll-scrubbed morphs, endpoint screenshots looked good → shipped.
2. **v2 people** — richer glyphs on the same scrub model; complaints about smoothness begin.
3. **v2.1 stagger + bezier paths** — added charm *to the mid-states*, which also made
   mid-states larger and more dispersed (longer effective travel envelope).
4. **v2.2 damped chase** — smoothed *between wheel ticks*, i.e. treated the symptom
   (stepping) while preserving the disease (scrub coupling).
5. **v2.3 vertical queue, sided stats, pop-out maths** — fixed information design; motion
   model untouched.

Each round fixed the thing the last screenshot showed. None questioned the interaction model,
because the screenshots never showed it failing.

## Stage 4 — Causal chains (5-whys per defect)

**D1 Smeared resting states** → because the reader can stop mid-morph → because morph progress
is a *pure function of scroll position* (scrub) → because "fully user-paced" was written into
the motion budget and interpreted as *scrub* → because the reference explainer's interaction
model was never inspected closely: Scrollama + D3 pieces are **step-triggered** — crossing a
threshold *fires a timed tween that always completes*; the reader can never rest mid-state →
**Root cause R1: wrong animation paradigm (scrub-driven instead of trigger-driven).**

**D2 Speck figures** → because U = clamp(min(W,H) × 0.013, 6.5, **11**) — a ceiling tuned once
at 1280 × 800 → because scale was treated as an implementation constant, not a design token
with a legibility target → **Root cause R2: no viewport scale model.**

**D3 Dead composition** → because layouts place anchors at fractions of the *full* viewport
width, so wide screens stretch the same content over more emptiness → and captions reserve a
fixed left column even when nothing balances it → **Root cause R3: no content-width limit or
composition grid for the stage.**

**D4 Floating labels** → annotations are baked into static layout metas and crossfade in place
while their group departs → **Root cause R4: annotations not bound to the moving groups.**
(Severity collapses once R1 is fixed — the float lasts under a second instead of forever.)

**D5 Wrong tempo** → scrub couples animation velocity to scroll velocity, so the choreography
plays at whatever speed the reader's wrist chooses, from teleport to glacial → same **R1**.
Stagger spread (34% of travel) + long bows amplified dispersion mid-flight →
**Root cause R5: stagger/bow tuned for short hops, applied to cross-stage journeys.**

## Stage 5 — Root causes, consolidated

| # | Root cause | Type |
|---|---|---|
| R1 | Scrub-driven morphs: every intermediate frame is a legal resting state, and tempo is the reader's wrist speed | design |
| R2 | Figure scale capped at a dev-viewport constant (11 px) with no legibility target | design |
| R3 | Stage composed in full-viewport fractions; no max content width, no grid | design |
| R4 | Labels/annotations static while their subjects move | design |
| R5 | Stagger window and path bows sized for charm, not for coherence over long travel | design |
| R6 | QA sampled endpoint frames at one dev viewport via the audit API — the instrument could not see any of D1–D3 | **process** |

## Stage 6 — Contributing factors

- The clutter budget's phrase "fully user-paced — nothing moves unless the reader scrolls" was
  followed to the letter; the *reference product it cites does not work that way*.
- Contact-sheet review habit: endpoints look composed; transitions were judged by two or three
  hand-picked freeze frames.
- Chromium-only, one viewport, no trackpad/wheel feel testing.
- Iterating under live feedback rewarded the smallest visible patch each round.

## Stage 7 — Corrective actions

| # | Action | Addresses |
|---|---|---|
| A1 | **Trigger-tween engine:** scroll selects the scene (threshold at each step); crossing it fires a timed, eased tween (~0.9 s, capped 1.4 s on multi-step jumps) that **always completes**. Resting states are exactly the composed scenes. Scrolling back triggers the reverse. After settle: zero motion (WCAG 2.2.2 intact — single ≤1.4 s one-shot). | R1, D1, D5 |
| A2 | **Arrival semantics:** a scene at rest displays its *completed* state (scan finished, packet docked, rings frozen at staggered radii); in-scene progress effects play during the entry tween, not during a dwell that no longer exists. | R1 |
| A3 | **Scale model:** U derives from viewport height with a legibility target (≈ 2.6–3% of vh, floor 8 px, ceiling 18 px) instead of the 11 px cap. | R2, D2 |
| A4 | **Content-width cap:** stage content composes inside a centred ≤1500 px column; ultrawide gains margin, not dispersion. | R3, D3 |
| A5 | **Coherent flocking:** stagger window tightened (34% → 25% of the tween) and path bows reduced (5.5 U → 3.5 U) so groups read as a crowd crossing, not spray. | R5 |
| A6 | **Process:** QA must capture *real-scroll* frames (not audit-API poses) at ≥3 viewports including ≥1920 px, sampling *between* steps; "the user parks mid-transition" is now a standing test case. | R6 |

Deferred (accepted): full label-to-centroid binding (R4) — with A1 the float lasts <1 s during
a completing tween; revisit only if it still reads poorly.

## Stage 8 — Verification of the fixes (measured, this commit)

- **Exhibit A re-run (2000 × 950, both instant and smooth programmatic scroll):** parking 60%
  into the scene 4→5 transition now settles, within ≤1.4 s, on a canvas **byte-identical to the
  composed scene 5 pose** (`atRest === set(5)`); scrolling back settles byte-identical to
  scene 4. Zero motion after settle (1.5 s snapshots identical).
- **Scale (2000 × 950):** figure height 18.7 px → **23.4 px** (1.97% → **2.47%** of viewport
  height); painted-ink fraction at rest 3.68% vs 2.42% in the old smear frame, now inside a
  centred content column (left/right canvas margins 397/321 px instead of edge-to-edge spray).
- **Arrival semantics:** the ranked-queue scene at rest shows the scan *completed* (43.6% of
  painted pixels saturated with persona colour, vs ~0% under the old model where rest states
  froze the sweep at zero).
- Stillness after settle, reduced-motion static frame, 320/390 px overflow, caption collisions,
  and 12× CPU-throttle frame cost re-verified after the rebuild (results below in the repo's
  plan document).

## Stage 9 — Residual risks, accepted

- Up to ~1.4 s of motion continues after the reader stops scrolling (the completing tween).
  This is the reference product's own behaviour and WCAG-compatible; reduced-motion users never
  see it (static frame).
- Fast multi-step flicks fast-forward through intermediate scenes rather than skipping them —
  chosen deliberately so the story stays causally readable.
- Labels still crossfade in place during the sub-second tween (R4 deferral).
- Canvas text remains non-selectable; the aria-hidden theatre + duplicated sections remain the
  accessibility path. Safari/iOS still untested on-device.

## Stage 10 — Lessons learned

1. **Copy a reference's interaction model, not its screenshots.** The Surgo piece was studied
   for palette, captions and clutter — and imitated with the one mechanic it doesn't use.
2. **Endpoint screenshots cannot judge motion.** Transition quality lives in the frames a
   reader can actually rest on; test those, at real sizes, with real scrolling.
3. **"Smooth" is a property of the interaction model.** No easing curve rescues a scrub whose
   tempo is the reader's wrist.
4. **Scale is a design token.** Any clamp constant tuned at one viewport is a latent bug at
   every other viewport.
5. **Patch pressure hides paradigm errors.** Four rounds of competent symptom-fixes never
   touched the root; the fifth round required a user to photograph the failure. Budget one
   step-back review per feature, not per complaint.


---

# Post-mortem #2 — "it still looks terrible": the composition failure

**Trigger:** a second user screenshot, of Explainer 02's "the follow-up finds them" scene on a
wide monitor — everything crushed into the bottom third, a dead top half, doctor rings running
off the bottom edge, and the caption sitting inside the crowd. Verdict accepted again.

## Evidence (measured, 2000 x 950, every resting scene)

| Explainer 02 scene | painted ink | ink in the **top half** | empty 5% bands from the top |
|---|---|---|---|
| match / engine / retained / payoff | 2.7–3.8% | **0%** | **11–12 of 20** |
| clusters | 2.8% | 74% | 4 |

Four consecutive scenes had **literally zero painted pixels above the vertical midpoint**. The
top 55–60% of the stage was blank on every one of them. Explainer 01 was better balanced
(61–78% top-share) but had its own empty band: 0.93% ink on the zoom scene.

## Root causes

| # | Root cause | Type |
|---|---|---|
| R7 | **No composition frame.** Layouts anchored content to absolute viewport fractions (`doctor row at 0.84H`, patients stacked upward from it). Nothing centred an assembly, nothing knew how tall the assembly was, so its height was whatever the data made it and the remaining stage stayed empty. | design |
| R8 | **The caption and the graphic shared one surface.** Text was absolutely positioned over a full-bleed canvas, so every layout had to dodge it by hand — and each dodge pushed content further into a corner. The v3.2 backplate treated the symptom. | design |
| R9 | **The story had no human in it.** Both explainers argued at population scale from the first frame. "Match them by colour" is a mechanism, not a reason to care; nothing showed a single person, what they actually wanted, or what happens to them when the system ignores it. | narrative |

## Corrective actions

| # | Action | Addresses |
|---|---|---|
| A7 | **The stage box.** The engine computes one rect — caption column excluded, capped at 1150 px, inset from the topbar and the stage floor. Layouts are authored in a plain `box.w x box.h` rect starting at 0,0 and translated into it; the camera, the scan sweep and the projection origin are all box-relative. Composition can no longer be anchored to a viewport edge. | R7 |
| A8 | **The caption is a column, not an overlay.** `.df-step` occupies a fixed left column (`clamp(300px, 28vw, 460px)`, vertically centred) on desktop and a top band on narrow; the engine's box begins where that column ends. Text and figures cannot occupy the same ground, so no layout needs a dodge. | R8 |
| A9 | **Persona units in a 3-over-2 grid** instead of a 5-across row, so five crowds and their doctors fill both axes of the box at roughly twice the previous size. | R7 |
| A10 | **Narrative cards + a focus camera.** A card pins plain-language lines to one named person (rows reveal during the entry tween, marks can be a bullet, a tick or a struck-through cross), and `cam: { on: 'focus' }` tracks a chosen individual wherever the layout puts them — no per-viewport coordinates. Per-person `fadeDot`/`greyDot` hooks isolate one figure from two hundred. | R9 |
| A11 | **Both stories rewritten around a person, roughly doubling the scene count** (E02 10 → 18, E01 9 → 17). E02 now follows one patient: her four requirements, her neighbours' different ones, the whole population's, the directory that stores none of them, the stranger she books, what that costs at scale — then the same population matched on exactly what they said. E01 opens inside the GP's book: the HF/hypertension cohort, the half the GP already manages, and the referred half splitting cleanly into protocol work a GP could hold with backup and genuine whole-of-training work — before showing both halves posted down one pathway, the clinic filling with titration, and the people who needed it waiting behind. | R9 |

## Verification

- Stage pins at exactly the story top and the caption sits inside the fold at 390 / 1280 / 2000.
- `tests/theatre-qa.mjs` green across all three viewports for both rebuilt storyboards
  (park-anywhere byte-equality, stillness, completed scans at rest, one caption at a time,
  no mobile overflow, reduced-motion stillness).

## Lesson added

6. **A composition needs a frame, not just coordinates.** Every layout constant tuned against
   "the viewport" is a composition that will empty out on some screen. Give the graphic an
   explicit box, compose inside it, and let the box absorb the differences.
7. **Mechanism is not motivation.** A systems diagram at population scale can be perfectly
   accurate and still leave a reader cold. Show one person first; earn the aggregate.
