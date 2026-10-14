# Hosted lint and formatter repair

Run38643119698 on06f4a694 failed Verify after complete typecheck at3 ESLint no-unnecessary-type-assertion findings in assertNativeAabb. Root removed exactly3 redundant casts, retaining runtime assertions and TypeScript narrowing. Applied the exact hosted formatting-repair.patch via git apply (check then apply), limited to4consumer files. No physics/limits/schema/tests weakened. Unit/build/integration/browser NOTRUN in failed run. No local app command. Independent exact-diff review and full hostedrerun pending.
