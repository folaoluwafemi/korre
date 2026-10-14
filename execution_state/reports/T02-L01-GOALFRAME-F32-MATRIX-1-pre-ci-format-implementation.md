# Pre-CI test formatting adjustment

Coordinator made one formatting-only adjustment after the implementation worker released ownership: the goal-frame positive assertion now uses one 80-character line, matching the existing helper assertion style. The arguments and assertion are unchanged. The negative assertions remain wrapped because their single-line forms exceed 80 characters. No formatter, app test or build ran locally; actual formatting remains a GitHub gate.

Only loftCoarseProbe.test.ts changed. Before SHA-256: 31625E4DD89A79C6DBDB758945490DC0D6539988D9E1C59ACAE5AC3126509406. After: EE98880940FF9340F3873F6A8B0FB6481751F29113C7515319A9E08DD2538ABA. Runner remains 30CBB8D4C29A61063685198EAC8E6FC1F82D0E1A91A0D524F436D1A7BD89FDC6. Scoped git diff --check exited 0. Independent confirmation is required before commit/push.
