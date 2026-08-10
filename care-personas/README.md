# Care Personas

A standalone concept product — **two interactive explainers** applying precision-persona
segmentation (in the style of Surgo Ventures' vaccine persona explainer) to health-system design:

| Page | What it argues | Audience |
|---|---|---|
| `index.html` | Product hub — the shared method | Everyone |
| `specialist-gp-pipeline.html` | **Explainer 01:** screen every referral for complexity; move the bottom 20% of the specialist caseload to accredited GPs with an eConsult backstop. GPs bill more, specialists bill more, waitlists halve. | Hospital networks, CMO |
| `matched-family-gp.html` | **Explainer 02:** match patients to doctors who fit them (culture, food, judgement-free care, wearables, whole-family) via a 20-second conversation, then run outbound follow-up on EHR-predicted need. | Primary-care networks, payers |
| `executive-summary.html` | **One-pager:** both concepts, their economics and both asks on a single sheet — prints to exactly one A4 page. | The room |

This folder is **deliberately independent of the portfolio app** — plain HTML/CSS/JS, no build
step, no framework. The only external requests are Google Fonts.

**Animation-first:** each explainer opens with a scroll-triggered unit-person theatre
(`assets/dotfield.js`, no libraries) — 200 procedurally drawn people take their persona colours
under a scan sweep, form ranked queues and clusters, and play out the story's choreography while
the camera zooms in and out. **Scroll selects the scene; crossing a step fires a timed tween
that always completes** — parking the page anywhere settles on a composed scene, never a
mid-transition frame (the interaction model of the reference explainer; see
`docs/rca-animation-postmortem.md`). Honours `prefers-reduced-motion` with static composed
frames, and is held to a numeric clutter budget documented in `docs/care-personas-plan.md`.

## Testing

`tests/theatre-qa.mjs` is the standing QA gate born of that RCA: it drives **real scrolling**
(not test-API poses) at 390/1280/2000 px, parks 60% into transitions and byte-compares what
settles against the composed target scene, then checks stillness after settle, completed scan
sweeps at rest, one-caption-at-a-time discipline, mobile overflow and reduced-motion stillness.

```sh
node tests/theatre-qa.mjs          # full matrix
node tests/theatre-qa.mjs --quick  # widest viewport only
```

Requires a Node ≥ 18 with Playwright + Chromium available (a global install works —
`createRequire` honours `NODE_PATH`).

## Hosting

Any static host works — deploy this folder as the site root:

- **Vercel / Netlify:** point the project at `care-personas/` (or drag-and-drop the folder).
- **GitHub Pages:** enable Pages on the repo; the site will serve at `/<repo>/care-personas/`.
- **Anywhere else:** copy the folder; open `index.html`.

## Notes

- All monetary values are indicative AUD rounded from published MBS schedule fees; all rates are
  illustrative modelling assumptions. Each explainer ends with the trial designed to measure them.
- The 5-colour persona palette is validated for colour-vision deficiency (adjacent-pair CVD
  ΔE ≥ 8, OKLab×100) on the light surface; sub-3:1-contrast hues are relieved with in-segment
  labels, legend chips and table views. See `docs/care-personas-plan.md` in the repo root.
- All demo clinicians are fictional.
