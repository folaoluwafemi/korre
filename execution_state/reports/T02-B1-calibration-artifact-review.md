# T02-B1 calibration artifact — independent review

**Verdict: PASS for the source and workflow changes. Hosted execution and artifact publication remain pending, so this does not accept T02.**

## Source review

- The writer reads `COUNTERBALL_CALIBRATION_OUTPUT` and writes only when the value is defined and non-empty. With the variable absent or blank, there is no artifact filesystem write.
- The result object includes runtime and probe metadata, `observedTrials`, and the full `observations` array. It is constructed and written only after the existing assertions, including exactly 480 total observations, 80 direct-cap trials, 400 restart-button trials, finite measurements, direct-cap movement, and button-cap contact.
- The new output path does not change the trial matrix, observations, or probe physics. It writes the same complete result represented by the retained console record.

## Workflow and ignore review

- The `Verify` step sets `COUNTERBALL_CALIBRATION_OUTPUT` to `.artifacts/counterball-calibration-observations.json`; the following `upload-artifact@v4` step uses that exact path and artifact name `counterball-calibration-observations`.
- The upload step has `if: always()` and `if-no-files-found: ignore`, so it runs after a failed verification step and cleanly skips when the probe did not produce a file.
- Workflow permissions remain `contents: read`. No secret is referenced or needed for local JSON output or artifact upload, and CI is not granted write access. `.artifacts/` is ignored by Git.

## Verification status

No local build, test, lint, typecheck, formatter, or server command was run, as required. The hosted rerun and uploaded artifact are pending. The artifact must still be retrieved and checked for 480 actual observations; it is not deployed-Cloudflare Havok evidence.
