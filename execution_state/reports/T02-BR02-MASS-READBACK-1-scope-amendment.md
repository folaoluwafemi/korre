# T02-BR02-MASS-READBACK-1 scope amendment

## Reason

The first independent source review at `T02-BR02-MASS-READBACK-1-source-review.md` returned CHANGES_REQUIRED for full packet acceptance. It correctly observed that `ENTITY_IDS` begins with `button` and `readBodyMetrics()` throws immediately on the first mass mismatch. With the known button rejection, this formatter cannot observe or classify any later cap mass.

## Amended diagnostic boundary

Before any new hosted execution, the coordinator narrows this card to the immediate measurement it can safely deliver: report the exact configured mass, native readback, delta, tolerance, and ID of the first failing body. In the current ordered browser probe, that is the button. Cap masses remain explicitly unmeasured. This card and its future artifact must not infer that caps pass, fail, or share the button's numeric behavior. A separate evidence step is required before any cap-mass claim or repair based on cap values.

This amendment does not change source, the mass comparison, tolerance, world creation, or browser assertions. It does not lower the real-browser requirement: the updated error must still be observed in Chromium with the pinned WASM, zero skips, and an exact hosted SHA. It remains diagnostic evidence only, not a shot or playable-game acceptance.

## Review state

The implementation is limited to the two original source paths and its worker's scoped diff check passed. The independent review of the original full criterion remains CHANGES_REQUIRED. The amended criterion and unchanged exact diff are now assigned to `/root/br02_review` at `T02-BR02-MASS-READBACK-1-scope-review.md`; no hosted application check starts before that review passes. No app test, install, build, browser, physics, deployment, Wrangler, or Railway command ran for this amendment.
