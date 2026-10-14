# Existing M0 diagnostic preview served — 2026-10-14

- URL: http://127.0.0.1:4173/ (choose Try the browser flick diagnostic); static scene: /preview.
- Build source: 4d8a4d8da2827074ddd2767c3978e62fb305f9fc, GitHub run 38618192294, renderer-diagnostic build, harness flag set. Exact artifact reviewed in that run's independent report.
- Small static server: scripts/serve-preview.mjs, exec session 94849, bound to 127.0.0.1:4173. No local install/build/test/browser/physics command. HTTP HEAD / returned 200; this is availability evidence only.
- Use the home-page link; the small server does not deep-link directly to /diagnostic/direct-shot.
- Existing real browser flick diagnostic only; no full-match/runner/calibration acceptance. New goal-frame readback source is being checked separately on GitHub run 38624231947.
