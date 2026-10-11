import { readFileSync, writeFileSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";

// Documentation only: no application imports, test runners, dependency installs,
// network access, builds or mutation of execution_state/tasks.json.
const root = resolve(import.meta.dirname, "..");
const planDirectory = "knowledge_base/execution/completion";
const catalogues = ["COORDINATOR_PACKETS.json", "LOCAL_PACKETS.json", "ONLINE_PACKETS.json"];
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8").replace(/^\uFEFF/, ""));
const stateArgument = process.argv.indexOf("--state");
const statePath = stateArgument === -1 ? "execution_state/tasks.json" : process.argv[stateArgument + 1];
if (!statePath || (stateArgument !== -1 && process.argv.includes("--write-index"))) {
  throw new Error("--state requires a metadata fixture and cannot be combined with --write-index.");
}
const state = readJson(statePath);
const parents = new Map(state.tasks.map((task) => [task.id, task]));
const recordedPackets = new Map(state.tasks.flatMap((task) => task.packet_progress ?? []).map((packet) => [packet.id, packet]));
const packets = catalogues.flatMap((name) => {
  const content = readJson(`${planDirectory}/${name}`);
  if (!Array.isArray(content)) throw new Error(`${name}: expected a packet array.`);
  return content.map((packet) => ({ ...packet, catalogue: name }));
});
const errors = [];
const fail = (id, message) => errors.push(`${id}: ${message}`);
const strings = (value) => Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim());
const byId = new Map();
const shared = (path) => /^(packages\/game-protocol\/|packages\/game-sdk\/|\.github\/|tests\/fixtures\/|infrastructure\/database\/|knowledge_base\/execution\/|execution_state\/|(?:package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|.*config\.(?:ts|json|mjs)|\.env\.example)$)/.test(path)
  || /^(?:infrastructure\/(?:cloudflare|railway)\/)/.test(path)
  || /\/(?:package\.json|tsconfig.*\.json|wrangler\.(?:toml|jsonc))$/.test(path)
  || ["apps/web/src/App.tsx", "apps/web/src/main.tsx", "apps/api/src/index.ts", "apps/realtime/src/index.ts"].includes(path);
for (const packet of packets) {
  const { id } = packet;
  if (typeof id !== "string" || !/^[A-Z][A-Z0-9-]*$/.test(id)) fail(String(id), "invalid packet id.");
  if (byId.has(id)) fail(id, "duplicate id.");
  byId.set(id, packet);
  if (!parents.has(packet.parent)) fail(id, "unknown canonical parent.");
  if (!["coordinator", "worker"].includes(packet.role)) fail(id, "role must be coordinator or worker.");
  if (typeof packet.title !== "string" || !packet.title.trim()) fail(id, "missing title.");
  for (const field of ["depends_on", "read_paths", "write_paths", "outputs", "steps", "acceptance", "negative_cases", "review_questions", "stop_conditions"]) {
    if (!strings(packet[field])) fail(id, `invalid ${field} string array.`);
    if (!["depends_on", "write_paths"].includes(field) && packet[field]?.length === 0) fail(id, `empty ${field}.`);
  }
  if (packet.supersedes !== undefined && !strings(packet.supersedes)) fail(id, "invalid supersedes string array.");
  if ((packet.write_paths?.length ?? 0) > 5) fail(id, "more than five exact write paths.");
  if (packet.role === "worker" && packet.write_paths?.length === 0) fail(id, "worker must have concrete outputs; use coordinator role for an evidence gate.");
  for (const path of [...(packet.write_paths ?? []), ...(packet.read_paths ?? [])]) {
    if (typeof path !== "string") continue;
    const target = resolve(root, path);
    const within = relative(root, target);
    if (isAbsolute(path) || within.startsWith("..") || isAbsolute(within) || path.includes("\\") || /[{}*?]|\.\.\./.test(path)) fail(id, `non-exact or escaping path ${path}.`);
  }
  if (new Set(packet.write_paths?.map((path) => path.toLowerCase())).size !== packet.write_paths?.length) fail(id, "duplicate write path.");
  for (const path of packet.write_paths ?? []) {
    if (packet.role === "worker" && shared(path)) fail(id, `worker claims coordinator path ${path}.`);
    if (path.startsWith("execution_state/reports/")) fail(id, "reports are implicit unique report paths; do not spend implementation ownership on competing reports.");
  }
  if (!Array.isArray(packet.checks) || packet.checks.length === 0) fail(id, "missing concrete checks.");
  for (const check of packet.checks ?? []) {
    if (!check.command || !check.expected || !["local-document", "github", "source-review", "deployed", "human-device"].includes(check.environment)) fail(id, "check needs command, environment and expected result.");
  }
}

const children = (parent) => packets.filter((packet) => packet.parent === parent).map((packet) => packet.id);
const graph = new Map();
const requiredParents = new Map();
const requiredPackets = new Map();
for (const packet of packets) {
  const edges = new Set();
  const packetGates = new Set();
  const parentGates = new Set();
  const addParent = (parent) => {
    if (!parents.has(parent)) return fail(packet.id, `unknown parent dependency ${parent}.`);
    if (parent === packet.parent) return fail(packet.id, "explicit dependency on its own parent cannot become ready.");
    parentGates.add(parent);
    const required = children(parent);
    if (!required.length && parents.get(parent).status !== "ACCEPTED") fail(packet.id, `unaccepted parent ${parent} has no planned children.`);
    for (const child of required) edges.add(child);
  };
  for (const dependency of packet.depends_on ?? []) {
    if (dependency.startsWith("parent:")) addParent(dependency.slice(7));
    else if (byId.has(dependency)) { edges.add(dependency); packetGates.add(dependency); }
    else if (recordedPackets.get(dependency)?.status === "ACCEPTED") { edges.add(dependency); packetGates.add(dependency); }
    else fail(packet.id, `unknown packet dependency ${dependency}.`);
  }
  // Supersession orders write ownership and closes an older failed card. It is
  // deliberately not added to requiredPackets: only accepted dependencies
  // unblock execution.
  for (const supersededId of packet.supersedes ?? []) {
    const superseded = byId.get(supersededId);
    if (!superseded) fail(packet.id, `unknown superseded packet ${supersededId}.`);
    else if (superseded.parent !== packet.parent) fail(packet.id, `cannot supersede packet ${supersededId} under a different parent.`);
    else if (recordedPackets.get(supersededId)?.status === "ACCEPTED") fail(packet.id, `cannot supersede accepted packet ${supersededId}.`);
    edges.add(supersededId);
  }
  // Original parent gates remain mandatory, even if omitted from the card.
  for (const dependency of parents.get(packet.parent)?.dependencies ?? []) addParent(dependency);
  graph.set(packet.id, [...edges]);
  requiredParents.set(packet.id, [...parentGates]);
  requiredPackets.set(packet.id, [...packetGates]);
}
const visited = new Set();
const visiting = new Set();
function visit(id, trail = []) {
  if (visiting.has(id)) return fail(id, `cycle ${[...trail, id].join(" -> ")}.`);
  if (visited.has(id)) return;
  visiting.add(id);
  for (const dependency of graph.get(id) ?? []) visit(dependency, [...trail, id]);
  visiting.delete(id);
  visited.add(id);
}
for (const id of byId.keys()) visit(id);
const reaches = (from, to, seen = new Set()) => {
  if (from === to) return true;
  if (seen.has(from)) return false;
  seen.add(from);
  return (graph.get(from) ?? []).some((dependency) => reaches(dependency, to, seen));
};
for (let left = 0; left < packets.length; left++) {
  for (let right = left + 1; right < packets.length; right++) {
    const a = packets[left]; const b = packets[right];
    const overlap = a.write_paths.filter((path) => b.write_paths.some((other) => other.toLowerCase() === path.toLowerCase()));
    // Coordinator is one exclusive writer; its unordered cards still cannot run together.
    if (overlap.length && (a.role === "worker" || b.role === "worker") && !reaches(a.id, b.id) && !reaches(b.id, a.id)) fail(a.id, `unordered writer conflict with ${b.id}: ${overlap.join(", ")}.`);
  }
}
const remaining = state.tasks.filter((task) => task.status !== "ACCEPTED").map((task) => task.id);
for (const parent of remaining) if (!children(parent).length) fail(parent, "missing remaining-parent coverage.");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  const acceptedPackets = new Set(state.tasks.flatMap((task) => task.packet_progress ?? []).filter((packet) => packet.status === "ACCEPTED").map((packet) => packet.id));
  const supersededPackets = new Set(state.tasks.flatMap((task) => task.packet_progress ?? []).filter((packet) => packet.status === "SUPERSEDED").map((packet) => packet.id));
  const recordedStatus = new Map(state.tasks.flatMap((task) => task.packet_progress ?? []).map((packet) => [packet.id, packet.status]));
  const isReady = (packet) => (recordedStatus.get(packet.id) === undefined || ["PLANNED", "READY"].includes(recordedStatus.get(packet.id)))
    && !acceptedPackets.has(packet.id)
    && !supersededPackets.has(packet.id)
    && requiredParents.get(packet.id).every((id) => parents.get(id).status === "ACCEPTED")
    && requiredPackets.get(packet.id).every((id) => acceptedPackets.has(id));
  const ready = packets.filter(isReady).map((packet) => packet.id);
  console.log(JSON.stringify({ verdict: "PASS", packets: packets.length, remainingParents: remaining.length, initialReady: ready, note: "Plan consistency only; no implementation/runtime check ran." }, null, 2));
  if (process.argv.includes("--write-index")) {
    const counts = new Map();
    for (const packet of packets) counts.set(packet.parent, (counts.get(packet.parent) ?? 0) + 1);
    const rows = packets.map((packet) => `| ${packet.id} | ${packet.parent} | ${packet.title.replaceAll("|", "/")} | ${packet.role} | ${packet.depends_on.join(", ") || "None"} | ${packet.write_paths.length} |`);
    const index = `# Packet index\n\nGenerated from the three JSON catalogues. This is a plan, not a status ledger. Original parent gates are added automatically. Only ACCEPTED dependencies unblock work; supersedes closes a failed card and orders write ownership but is not an acceptance gate. Coordinator-role cards have one exclusive writer even when listed dependencies do not order shared files.\n\n${packets.length} bounded cards cover ${remaining.length} remaining parents. Initially ready: ${ready.join(", ") || "none"}.\n\n| ID | Parent | Outcome | Writer | Explicit prerequisites | Exact paths |\n|---|---|---|---|---|---|\n${rows.join("\n")}\n\nTo read one exact card: \`node scripts/check-completion-plan.mjs --packet <ID>\`. To revalidate or regenerate this index: \`node scripts/check-completion-plan.mjs --write-index\`. Both commands perform documentation work only. Runtime state remains execution_state/tasks.json.\n`;
    writeFileSync(resolve(root, planDirectory, "PACKETS.md"), index);
  }
  const argument = process.argv.indexOf("--packet");
  if (argument !== -1) {
    const selected = byId.get(process.argv[argument + 1]);
    if (!selected) throw new Error("Unknown --packet id.");
    console.log(JSON.stringify({ ...selected, ready: isReady(selected), required_parent_acceptance: requiredParents.get(selected.id) }, null, 2));
  }
}
