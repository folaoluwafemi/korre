# T02-B1 calibration artifact — implementation report

**Source-only implementation complete; hosted verification pending.**

Added an opt-in artifact writer to `calibrationProbe.test.ts`. After the existing full-matrix, finite-observation, direct-motion, and real button-cap-contact assertions succeed, the test builds one result object with pinned runtime metadata, all candidate values, the observed trial count, and the complete observations array. It retains the existing `COUNTERBALL_CALIBRATION_PROBE` console record.

When `process.env["COUNTERBALL_CALIBRATION_OUTPUT"]` is set to a non-empty path, the test resolves that path from the workspace working directory, creates its parent directory recursively, and writes the completed result as UTF-8 JSON. With the variable absent or empty, it performs no artifact filesystem write. Because writing is after the assertions, failed or incomplete probes do not emit a success artifact.

The implementation preserves all 480 trial values/order, world setup and disposal, physics behavior, measurements, and assertions. No workflow, ignore, status, ledger, config, or other source path was changed.

No local build, test, lint, typecheck, formatter, or server command was run, per the hosted-verification requirement. The coordinator’s workflow configuration and upload step, a hosted rerun, artifact contents, and independent review remain pending. This local JSON artifact is not deployed Cloudflare Havok evidence and does not accept T02 or T04.
