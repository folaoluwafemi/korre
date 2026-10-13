import { createHash } from "node:crypto";
import { mkdir, open, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";
import {
  expect,
  test,
  type Download,
  type Page,
  type Route,
  type TestInfo,
} from "@playwright/test";
import {
  COUNTERBALL_CONFIG_V1,
  ENTITY_IDS,
  QUATERNION_NORM_TOLERANCE,
  hashCanonicalJson,
  hashCounterballConfig,
  parseMatchState,
} from "@korre/game-protocol";
import { deriveRestartButtonPose } from "../../games/counterball/src/features/restarts/domain/placementPose.js";

type LifecycleSnapshot = {
  baselineEngines: number;
  engines: number;
  activeListeners: number;
  activeResizeObservers: number;
  phase: string;
};

type WindowWithDirectProbe = Window & {
  __counterballDirectProbeLifecycle?: () => LifecycleSnapshot;
  __counterballLoftMatrixHostAck?: (
    attestation: LoftMatrixHostAttestation,
  ) => Promise<boolean>;
};

type LoftMatrixHostAttestation = Readonly<{
  runId: string;
  fileName: string;
  byteLength: number;
  sha256: string;
}>;

const TRANSPORT_BYTES = 504_365_056;
const TRANSPORT_CHUNK_BYTES = 256 * 1024;
const TRANSPORT_CHUNK_COUNT = 1_924;
const TRANSPORT_READY_STATUS =
  "The bounded OPFS file is complete and ready to download.";
const TRANSPORT_FAILED_STATUS =
  "The export failed and no successful download is available.";
const MATRIX_MAXIMUM_BYTES = 504_365_056;
const MATRIX_CASE_MAXIMUM_BYTES = 20_971_520;
const MATRIX_METADATA_MAXIMUM_BYTES = 65_536;
const MATRIX_ROW_MAXIMUM_BYTES = 512;
const MATRIX_SWEEP_ROW_MAXIMUM_BYTES = 1_024;
const MATRIX_ROW_MAXIMUM_COUNT = 27_015;
const MATRIX_CONTACT_MAXIMUM_COUNT = 8_192;
const MATRIX_SWEEP_MAXIMUM_COUNT = 1_801;
const MATRIX_TOTAL_BODY_MAXIMUM_COUNT = 648_360;
const MATRIX_TOTAL_CONTACT_MAXIMUM_COUNT = 196_608;
const MATRIX_TOTAL_CALL_MAXIMUM_COUNT = 2_073_600;
const MATRIX_TOTAL_BATCH_MAXIMUM_COUNT = 17_280;
const MATRIX_FIXTURE_MAXIMUM_BYTES = 65_536;
const MATRIX_EXPECTED_FIXTURE_FILE_SHA256 =
  "e4ede68e3ab82e801fbcd42b03196ded4f0ad81683290e40af7634d914364c35";
const MATRIX_READY_STATUS =
  "The bounded OPFS file is complete and ready to download.";
const MATRIX_FAILED_STATUS =
  "The export failed and no successful download is available.";

type MatrixTuple = readonly [number, number, number, number];
type MatrixRecord = Record<string, unknown>;

const MATRIX_ENTITY_IDS = [
  "button",
  "home-0",
  "home-1",
  "home-2",
  "home-3",
  "home-4",
  "home-5",
  "home-6",
  "away-0",
  "away-1",
  "away-2",
  "away-3",
  "away-4",
  "away-5",
  "away-6",
] as const;
const MATRIX_STATIC_IDS = [
  "goal-frame-0",
  "goal-frame-1",
  "goal-frame-2",
  "goal-frame-3",
  "goal-frame-4",
  "goal-frame-5",
  "support-apron",
] as const;
const MATRIX_KNOWN_BODY_IDS: ReadonlySet<string> = new Set([
  ...MATRIX_ENTITY_IDS,
  ...MATRIX_STATIC_IDS,
]);
const MATRIX_IDENTITY_KEYS = [
  "guardSchemaVersion",
  "scope",
  "matrixId",
  "algorithmVersion",
  "protocolVersion",
  "configSchemaVersion",
  "configVersion",
  "configHash",
  "fixtureId",
  "fixturePayloadSha256",
  "fixtureFileSha256",
  "physicsVersion",
  "adapterVersion",
  "wasmSha256",
  "matchId",
  "runtimeIdentity",
] as const;
const MATRIX_CASE_METADATA_KEYS = [
  ...MATRIX_IDENTITY_KEYS,
  "tuple",
  "matrixIndex",
  "initialStateHashAlgorithm",
  "initialStateHash",
  "dynamicBodies",
  "materials",
  "staticBodies",
  "preImpulseMeasuredShiftedEnergy",
  "preImpulsePredictedShiftedEnergy",
  "finalBodies",
  "settlingWindow",
  "eligibility",
  "executeStepCalls",
  "batches",
  "wallTimeMs",
] as const;
const MATRIX_BODY_STATE_KEYS = [
  "id",
  "position",
  "rotation",
  "linearVelocity",
  "angularVelocity",
] as const;
const MATRIX_BODY_ROW_KEYS = [
  "tuple",
  "nominalTick",
  ...MATRIX_BODY_STATE_KEYS,
] as const;
const MATRIX_CONTACT_ROW_KEYS = [
  "tuple",
  "nominalTick",
  "callIndex",
  "pair",
  "eventType",
  "point",
] as const;
const MATRIX_SWEEP_ROW_KEYS = [
  "tuple",
  "nominalTick",
  "actualCheckedCallCount",
  "maximumShiftedEnergy",
  "maximumCandidateRelativeComDrop",
  "minimumApronMargin",
  "minimumSlabUndersideMargin",
  "maximumPointSweep",
  "maximumRotationSweep",
  "minimumWholeButtonObstacleClearance",
  "intervalClassification",
  "allFinite",
  "all15Settled",
] as const;
const MATRIX_GUARD = Object.freeze({
  schemaVersion:
    COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.schemaVersion,
  scope: COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.scope,
  matrixId: COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.matrixId,
  algorithmVersion:
    COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.algorithmVersion,
  protocolVersion:
    COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.protocolVersion,
  configSchemaVersion:
    COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.configSchemaVersion,
  configVersion: COUNTERBALL_CONFIG_V1.configVersion,
  fixtureId: COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.fixture.id,
  fixturePayloadSha256:
    COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.fixture.payloadSha256,
  physicsVersion: COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.physicsVersion,
  adapterVersion:
    COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.physicsVersion.slice(
      COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.physicsVersion.lastIndexOf(
        "/",
      ) + 1,
    ),
  wasmSha256: COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.wasmSha256,
  matchId: COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.matchId,
});

function expectedMatrixTuples(): readonly MatrixTuple[] {
  const tuples: MatrixTuple[] = [];
  const matrix = COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.matrix;
  for (const gap of matrix.gapOffsets) {
    for (const tilt of matrix.tiltDegrees) {
      for (const impulse of matrix.impulseMagnitudes) {
        for (const azimuth of matrix.azimuthDegrees) {
          tuples.push([gap, tilt, impulse, azimuth]);
        }
      }
    }
  }
  return tuples;
}

const EXPECTED_MATRIX_TUPLES = expectedMatrixTuples();
const MATRIX_READY_ACK_STATUS =
  "The host saved and verified the download; temporary storage was removed.";

type DownloadDigest = Readonly<{ byteLength: number; sha256: string }>;

type MatrixTotals = Readonly<{
  caseCount: number;
  bodyRows: number;
  contactRows: number;
  sweepRows: number;
  executeStepCalls: number;
  batches: number;
  wallTimeMs: number;
  matrixBytes: number;
  envelopeBytes: number;
  eligibleCases: number;
  measuredMatrixWallTimeMs: number;
}>;

type JsonSpan = Readonly<{ start: number; end: number }>;

class MatrixJsonFileReader {
  private readonly buffer = Buffer.alloc(64 * 1024);
  private readonly hash = createHash("sha256");
  private cursor = 0;
  private available = 0;
  private eof = false;
  private byteLength = 0;

  constructor(
    private readonly file: Awaited<ReturnType<typeof open>>,
  ) {}

  get bytesRead(): number {
    return this.byteLength;
  }

  private async fill(): Promise<boolean> {
    if (this.cursor < this.available) return true;
    if (this.eof) return false;
    const { bytesRead } = await this.file.read(
      this.buffer,
      0,
      this.buffer.byteLength,
      null,
    );
    if (bytesRead === 0) {
      this.eof = true;
      this.cursor = 0;
      this.available = 0;
      return false;
    }
    this.byteLength += bytesRead;
    if (this.byteLength > MATRIX_MAXIMUM_BYTES) {
      throw new Error("The downloaded matrix exceeds its inclusive byte cap.");
    }
    this.hash.update(this.buffer.subarray(0, bytesRead));
    this.cursor = 0;
    this.available = bytesRead;
    return true;
  }

  async readByte(): Promise<number | null> {
    if (!(await this.fill())) return null;
    const value = this.buffer[this.cursor];
    if (value === undefined) throw new Error("A JSON byte is missing.");
    this.cursor += 1;
    return value;
  }

  async consumeAscii(text: string): Promise<void> {
    for (const character of text) {
      const actual = await this.readByte();
      if (actual !== character.charCodeAt(0)) {
        throw new Error(`The matrix is missing its exact ${JSON.stringify(text)} delimiter.`);
      }
    }
  }

  async readObject(maximumBytes: number, label: string): Promise<string> {
    const opening = await this.readByte();
    if (opening !== 0x7b) throw new Error(`${label} must begin with an object.`);
    const chunks: Buffer[] = [Buffer.from([opening])];
    let capturedBytes = 1;
    let depth = 1;
    let inString = false;
    let escaped = false;

    while (true) {
      if (!(await this.fill())) throw new Error(`${label} is truncated.`);
      const start = this.cursor;
      let complete = false;
      while (this.cursor < this.available) {
        const byte = this.buffer[this.cursor];
        if (byte === undefined) throw new Error(`${label} contains a missing byte.`);
        this.cursor += 1;
        capturedBytes += 1;
        if (capturedBytes > maximumBytes) {
          throw new Error(`${label} exceeds its ${maximumBytes}-byte cap.`);
        }

        if (inString) {
          if (escaped) escaped = false;
          else if (byte === 0x5c) escaped = true;
          else if (byte === 0x22) inString = false;
          continue;
        }
        if (byte === 0x22) inString = true;
        else if (byte === 0x7b || byte === 0x5b) depth += 1;
        else if (byte === 0x7d || byte === 0x5d) {
          depth -= 1;
          if (depth < 0) throw new Error(`${label} has unbalanced JSON delimiters.`);
          if (depth === 0) {
            complete = true;
            break;
          }
        }
      }
      chunks.push(Buffer.from(this.buffer.subarray(start, this.cursor)));
      if (complete) {
        const encoded = Buffer.concat(chunks, capturedBytes);
        return new TextDecoder("utf-8", { fatal: true }).decode(encoded);
      }
    }
  }

  async assertEnd(): Promise<DownloadDigest> {
    if ((await this.readByte()) !== null) {
      throw new Error("The downloaded matrix has trailing bytes.");
    }
    return { byteLength: this.byteLength, sha256: this.hash.digest("hex") };
  }
}

function asRecord(value: unknown, label: string): MatrixRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as MatrixRecord;
}

function assertExactKeys(
  value: unknown,
  expected: readonly string[],
  label: string,
): MatrixRecord {
  const record = asRecord(value, label);
  const actualKeys = Object.keys(record).sort();
  const expectedKeys = [...expected].sort();
  expect(actualKeys, `${label} keys`).toEqual(expectedKeys);
  return record;
}

function finiteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite.`);
  }
  return value;
}

function boundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  label: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(`${label} is outside its accepted integer range.`);
  }
  return value;
}

function rethrowCaughtError(error: unknown, message: string): never {
  if (error instanceof Error) throw error;
  throw new Error(message, { cause: error });
}

function assertTuple(value: unknown, expected: MatrixTuple, label: string): void {
  expect(Array.isArray(value), `${label} must be an array`).toBe(true);
  expect(value, `${label} must equal its canonical tuple`).toEqual(expected);
}

function assertVector(value: unknown, label: string): void {
  const vector = assertExactKeys(value, ["x", "y", "z"], label);
  for (const axis of ["x", "y", "z"] as const) {
    finiteNumber(vector[axis], `${label}.${axis}`);
  }
}

function assertQuaternion(value: unknown, label: string): void {
  const rotation = assertExactKeys(value, ["x", "y", "z", "w"], label);
  const components = [rotation["x"], rotation["y"], rotation["z"], rotation["w"]].map(
    (component, index) => finiteNumber(component, `${label}[${index}]`),
  );
  const [x, y, z, w] = components;
  if (x === undefined || y === undefined || z === undefined || w === undefined) {
    throw new Error(`${label} is missing a quaternion component.`);
  }
  expect(Math.abs(Math.hypot(x, y, z, w) - 1)).toBeLessThanOrEqual(
    QUATERNION_NORM_TOLERANCE,
  );
}

function assertHash(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${label} must be a lowercase SHA-256 digest.`);
  }
}

function isCompactJson(text: string): boolean {
  let inString = false;
  let escaped = false;
  for (const character of text) {
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
    } else if (character === '"') inString = true;
    else if (character === " " || character === "\n" || character === "\r" || character === "\t") {
      return false;
    }
  }
  return !inString && !escaped;
}

function skipJsonValue(text: string, start: number): number {
  const first = text[start];
  if (first === undefined) throw new Error("A JSON value is truncated.");
  if (first === '"') {
    let escaped = false;
    for (let index = start + 1; index < text.length; index += 1) {
      const character = text[index];
      if (character === undefined) break;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') return index + 1;
    }
    throw new Error("A JSON string is truncated.");
  }
  if (first !== "{" && first !== "[") {
    let index = start;
    while (index < text.length && ![",", "]", "}"].includes(text[index] ?? "")) {
      index += 1;
    }
    if (index === start) throw new Error("A JSON primitive is empty.");
    return index;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (character === undefined) break;
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "{" || character === "[") depth += 1;
    else if (character === "}" || character === "]") {
      depth -= 1;
      if (depth === 0) return index + 1;
      if (depth < 0) throw new Error("JSON delimiters are unbalanced.");
    }
  }
  throw new Error("A JSON container is truncated.");
}

function objectValueSpans(text: string): Map<string, JsonSpan> {
  const spans = new Map<string, JsonSpan>();
  if (text[0] !== "{" || text.at(-1) !== "}") {
    throw new Error("A JSON object boundary is missing.");
  }
  let cursor = 1;
  while (cursor < text.length - 1) {
    const keyEnd = skipJsonValue(text, cursor);
    const key = JSON.parse(text.slice(cursor, keyEnd)) as unknown;
    if (typeof key !== "string" || text[keyEnd] !== ":") {
      throw new Error("A JSON object property is malformed.");
    }
    const valueStart = keyEnd + 1;
    const valueEnd = skipJsonValue(text, valueStart);
    if (spans.has(key)) throw new Error(`Duplicate JSON key ${key}.`);
    spans.set(key, { start: valueStart, end: valueEnd });
    if (valueEnd === text.length - 1) break;
    if (text[valueEnd] !== ",") throw new Error("A JSON object separator is missing.");
    cursor = valueEnd + 1;
    if (cursor >= text.length - 1) throw new Error("A JSON object has a trailing comma.");
  }
  return spans;
}

function* arrayValueSpans(
  text: string,
  span: JsonSpan,
  label: string,
): Generator<JsonSpan> {
  if (text[span.start] !== "[" || text[span.end - 1] !== "]") {
    throw new Error(`${label} must be a JSON array.`);
  }
  let cursor = span.start + 1;
  while (cursor < span.end - 1) {
    const valueEnd = skipJsonValue(text, cursor);
    if (valueEnd > span.end - 1) throw new Error(`${label} has a truncated row.`);
    yield { start: cursor, end: valueEnd };
    if (valueEnd === span.end - 1) return;
    if (text[valueEnd] !== ",") throw new Error(`${label} has a missing separator.`);
    cursor = valueEnd + 1;
    if (cursor >= span.end - 1) throw new Error(`${label} has a trailing comma.`);
  }
}

function omitConfigHashLeaves(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(omitConfigHashLeaves);
  if (typeof value !== "object" || value === null) return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(record)
      .filter(([key]) => key !== "configHash")
      .map(([key, child]) => [key, omitConfigHashLeaves(child)]),
  );
}

function collectConfigHashLeaves(value: unknown, output: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const child of value) collectConfigHashLeaves(child, output);
  } else if (typeof value === "object" && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      if (key === "configHash" && typeof child === "string") output.push(child);
      else collectConfigHashLeaves(child, output);
    }
  }
  return output;
}

async function readPinnedFixture(): Promise<{
  rawSha256: string;
  initialState: ReturnType<typeof parseMatchState>;
}> {
  const path = resolve(process.cwd(), "tests/fixtures/counterball-v1.json");
  const file = await open(path, "r");
  let primaryFailure: { readonly value: unknown } | null = null;
  let result:
    | { rawSha256: string; initialState: ReturnType<typeof parseMatchState> }
    | undefined;
  try {
    const stats = await file.stat();
    if (stats.size > MATRIX_FIXTURE_MAXIMUM_BYTES) {
      throw new Error("The pinned fixture exceeds its pre-read byte cap.");
    }
    const bytes = Buffer.alloc(stats.size);
    let offset = 0;
    const hash = createHash("sha256");
    while (offset < bytes.byteLength) {
      const { bytesRead } = await file.read(
        bytes,
        offset,
        bytes.byteLength - offset,
        offset,
      );
      if (bytesRead === 0) throw new Error("The pinned fixture was truncated.");
      hash.update(bytes.subarray(offset, offset + bytesRead));
      offset += bytesRead;
    }
    if ((await file.read(Buffer.alloc(1), 0, 1, offset)).bytesRead !== 0) {
      throw new Error("The pinned fixture changed while it was being read.");
    }
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const fixture = JSON.parse(raw) as unknown;
    const fixtureRecord = asRecord(fixture, "Pinned fixture");
    expect(fixtureRecord["id"]).toBe(MATRIX_GUARD.fixtureId);
    const versions = asRecord(fixtureRecord["versions"], "Fixture versions");
    const configHash = await hashCounterballConfig();
    const leaves = collectConfigHashLeaves(fixture);
    expect(leaves).toHaveLength(8);
    expect(leaves.every((value) => value === configHash)).toBe(true);
    const payloadHash = await hashCanonicalJson(omitConfigHashLeaves(fixture));
    expect(payloadHash).toBe(MATRIX_GUARD.fixturePayloadSha256);
    expect(hash.digest("hex")).toBe(MATRIX_EXPECTED_FIXTURE_FILE_SHA256);
    expect(versions["configHash"]).toBe(configHash);
    const states = asRecord(fixtureRecord["states"], "Fixture states");
    result = {
      rawSha256: MATRIX_EXPECTED_FIXTURE_FILE_SHA256,
      initialState: parseMatchState(states["initial"]),
    };
  } catch (error) {
    primaryFailure = { value: error };
  }
  let closeFailure: { readonly value: unknown } | null = null;
  try {
    await file.close();
  } catch (error) {
    closeFailure = { value: error };
  }
  if (primaryFailure !== null && closeFailure !== null) {
    throw new AggregateError(
      [primaryFailure.value, closeFailure.value],
      "Fixture verification failed and its handle did not close cleanly.",
      { cause: primaryFailure.value },
    );
  }
  if (primaryFailure !== null) {
    rethrowCaughtError(primaryFailure.value, "Fixture verification failed with a non-Error value.");
  }
  if (closeFailure !== null) {
    rethrowCaughtError(closeFailure.value, "Fixture handle close failed with a non-Error value.");
  }
  if (result === undefined) throw new Error("Fixture verification ended without a result.");
  return result;
}

function regeneratedInitialState(
  fixture: ReturnType<typeof parseMatchState>,
  tuple: MatrixTuple,
): ReturnType<typeof parseMatchState> {
  const [gap, tiltDegrees, , azimuthDegrees] = tuple;
  const geometry = COUNTERBALL_CONFIG_V1.geometry;
  const guard = COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard;
  const capY = geometry.surfaceY + geometry.capHeight / 2;
  const selectedPosition = { x: 0, y: capY, z: -5 };
  const pose = deriveRestartButtonPose(
    selectedPosition,
    (azimuthDegrees * Math.PI) / 180,
    (tiltDegrees * Math.PI) / 180,
    COUNTERBALL_CONFIG_V1,
  );
  const obstaclePosition = {
    x: 0,
    y: capY,
    z: pose.position.z + geometry.buttonRadius + geometry.capRadius + gap,
  };
  const originals = new Map(fixture.bodies.map((body) => [body.id, body]));
  const fillerIds = ENTITY_IDS.filter(
    (id) => id !== "button" && id !== "home-0" && id !== "home-1",
  );
  const slots = guard.setup.fillerX.flatMap((x) =>
    guard.setup.fillerZ.map((z) => ({ x, y: capY, z })),
  );
  if (fillerIds.length !== 12 || slots.length !== fillerIds.length) {
    throw new Error("Canonical setup filler inputs do not form twelve slots.");
  }
  let fillerIndex = 0;
  const bodies = ENTITY_IDS.map((id) => {
    const original = originals.get(id);
    if (original === undefined) throw new Error(`Fixture body ${id} is missing.`);
    let position: typeof original.position;
    let rotation = { x: 0, y: 0, z: 0, w: 1 };
    if (id === "home-0") position = selectedPosition;
    else if (id === "home-1") position = obstaclePosition;
    else if (id === "button") {
      position = pose.position;
      rotation = pose.rotation;
    } else {
      const slot = slots[fillerIndex];
      if (slot === undefined) throw new Error("A canonical filler slot is missing.");
      position = slot;
      fillerIndex += 1;
    }
    return {
      ...original,
      position,
      rotation,
      linearVelocity: { x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
    };
  });
  return parseMatchState({ ...fixture, bodies });
}

function validateMatrixIdentity(
  value: unknown,
  configHash: string,
  fixtureFileSha256: string,
): MatrixRecord {
  const metadata = assertExactKeys(value, MATRIX_IDENTITY_KEYS, "Matrix metadata");
  for (const [field, expected] of Object.entries(MATRIX_GUARD)) {
    const actualField = field === "schemaVersion" ? "guardSchemaVersion" : field;
    expect(metadata[actualField], `Matrix identity ${actualField}`).toBe(expected);
  }
  expect(metadata["configHash"]).toBe(configHash);
  expect(metadata["fixtureFileSha256"]).toBe(fixtureFileSha256);
  assertHash(metadata["configHash"], "Matrix configHash");
  assertHash(metadata["fixturePayloadSha256"], "Matrix fixturePayloadSha256");
  expect(metadata["fixturePayloadSha256"]).toBe(
    COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.fixture.payloadSha256,
  );
  assertHash(metadata["fixtureFileSha256"], "Matrix fixtureFileSha256");
  assertHash(metadata["wasmSha256"], "Matrix wasmSha256");
  const identity = metadata["runtimeIdentity"];
  if (
    typeof identity !== "string" || identity.length === 0 ||
    identity.length > 1_024 || !identity.startsWith("browser:") ||
    !identity.endsWith(`;physics:${MATRIX_GUARD.physicsVersion}`)
  ) {
    throw new Error("Matrix runtime identity is missing or outside its bound.");
  }
  return metadata;
}

function assertFilterPair(value: unknown, label: string): readonly [number, number] {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error(`${label} must contain two native collision masks.`);
  }
  const membership: unknown = value[0];
  const collide: unknown = value[1];
  for (const [mask, name] of [
    [membership, "membership"],
    [collide, "collide"],
  ] as const) {
    if (
      typeof mask !== "number" || !Number.isSafeInteger(mask) ||
      mask < -0x80000000 || mask > 0xffffffff
    ) {
      throw new Error(`${label} ${name} mask is invalid.`);
    }
  }
  if (typeof membership !== "number" || typeof collide !== "number") {
    throw new Error(`${label} mask values are missing.`);
  }
  return [membership, collide];
}

function filtersCollide(
  left: readonly [number, number],
  right: readonly [number, number],
): boolean {
  return (left[0] & right[1]) !== 0 && (right[0] & left[1]) !== 0;
}

function assertMaterialValues(value: unknown, label: string): void {
  const material = assertExactKeys(
    value,
    ["friction", "staticFriction", "restitution", "frictionCombine", "restitutionCombine"],
    label,
  );
  expect(finiteNumber(material["friction"], `${label}.friction`)).toBe(
    COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.materials.friction,
  );
  expect(finiteNumber(material["staticFriction"], `${label}.staticFriction`)).toBe(
    COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.materials.staticFriction,
  );
  expect(finiteNumber(material["restitution"], `${label}.restitution`)).toBe(
    COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.materials.restitution,
  );
  expect(material["frictionCombine"]).toBe(
    COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.materials.frictionCombine,
  );
  expect(material["restitutionCombine"]).toBe(
    COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.materials.restitutionCombine,
  );
}

function assertBodyState(value: unknown, expectedId: string, label: string): MatrixRecord {
  const body = assertExactKeys(value, MATRIX_BODY_STATE_KEYS, label);
  expect(body["id"]).toBe(expectedId);
  assertVector(body["position"], `${label}.position`);
  assertQuaternion(body["rotation"], `${label}.rotation`);
  assertVector(body["linearVelocity"], `${label}.linearVelocity`);
  assertVector(body["angularVelocity"], `${label}.angularVelocity`);
  return body;
}

function assertSameVector(left: unknown, right: unknown, label: string): void {
  const lhs = asRecord(left, `${label} left`);
  const rhs = asRecord(right, `${label} right`);
  for (const axis of ["x", "y", "z"] as const) {
    expect(lhs[axis], `${label}.${axis}`).toBe(rhs[axis]);
  }
}

function assertSameQuaternion(
  left: unknown,
  right: unknown,
  label: string,
): void {
  const lhs = asRecord(left, `${label} left`);
  const rhs = asRecord(right, `${label} right`);
  for (const axis of ["x", "y", "z", "w"] as const) {
    const delta = Math.abs(
      finiteNumber(lhs[axis], `${label}.left.${axis}`) -
        finiteNumber(rhs[axis], `${label}.right.${axis}`),
    );
    expect(delta, `${label}.${axis} delta`).toBeLessThanOrEqual(
      QUATERNION_NORM_TOLERANCE,
    );
  }
}

function validateCaseMetadata(
  value: unknown,
  identity: MatrixRecord,
  tuple: MatrixTuple,
  index: number,
  expectedState: ReturnType<typeof parseMatchState>,
): MatrixRecord {
  const metadata = assertExactKeys(
    value,
    MATRIX_CASE_METADATA_KEYS,
    `Case ${index} metadata`,
  );
  for (const field of MATRIX_IDENTITY_KEYS) {
    expect(metadata[field], `Case ${index} identity ${field}`).toEqual(identity[field]);
  }
  assertTuple(metadata["tuple"], tuple, `Case ${index} tuple`);
  expect(boundedInteger(metadata["matrixIndex"], 0, 23, `Case ${index} index`)).toBe(index);
  expect(metadata["initialStateHashAlgorithm"]).toBe(
    COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.setup.initialStateHashAlgorithm,
  );
  assertHash(metadata["initialStateHash"], `Case ${index} initialStateHash`);

  const expectedBodies = new Map(expectedState.bodies.map((body) => [body.id, body]));
  const dynamicValue = metadata["dynamicBodies"];
  if (!Array.isArray(dynamicValue) || dynamicValue.length !== MATRIX_ENTITY_IDS.length) {
    throw new Error(`Case ${index} must describe all 15 dynamic bodies.`);
  }
  const dynamicFilters = new Map<string, readonly [number, number]>();
  dynamicValue.forEach((item: unknown, bodyIndex: number) => {
    const label = `Case ${index} dynamic body ${bodyIndex}`;
    const body = assertExactKeys(
      item,
      [
        "id", "nativeMass", "centerOfMassOffset", "principalInertias",
        "inertiaOrientation", "colliderDimensions", "collisionFilter",
        "initialLinearVelocity", "initialAngularVelocity", "configuredMassProjection",
      ],
      label,
    );
    const id = MATRIX_ENTITY_IDS[bodyIndex];
    if (id === undefined) throw new Error(`${label} has no canonical id.`);
    expect(body["id"]).toBe(id);
    const nativeMass = finiteNumber(body["nativeMass"], `${label}.nativeMass`);
    expect(nativeMass).toBeGreaterThan(0);
    assertVector(body["centerOfMassOffset"], `${label}.centerOfMassOffset`);
    const inertias = asRecord(body["principalInertias"], `${label}.principalInertias`);
    assertVector(inertias, `${label}.principalInertias`);
    for (const axis of ["x", "y", "z"] as const) {
      expect(finiteNumber(inertias[axis], `${label}.inertia.${axis}`)).toBeGreaterThan(0);
    }
    assertQuaternion(body["inertiaOrientation"], `${label}.inertiaOrientation`);
    const dimensions = asRecord(body["colliderDimensions"], `${label}.colliderDimensions`);
    assertVector(dimensions, `${label}.colliderDimensions`);
    const geometry = COUNTERBALL_CONFIG_V1.geometry;
    expect(dimensions).toEqual(
      id === "button"
        ? { x: geometry.buttonRadius * 2, y: geometry.buttonThickness, z: geometry.buttonRadius * 2 }
        : { x: geometry.capRadius * 2, y: geometry.capHeight, z: geometry.capRadius * 2 },
    );
    for (const axis of ["x", "y", "z"] as const) {
      expect(finiteNumber(dimensions[axis], `${label}.dimensions.${axis}`)).toBeGreaterThan(0);
    }
    const filter = assertFilterPair(body["collisionFilter"], `${label}.collisionFilter`);
    dynamicFilters.set(id, filter);
    assertVector(body["initialLinearVelocity"], `${label}.initialLinearVelocity`);
    assertVector(body["initialAngularVelocity"], `${label}.initialAngularVelocity`);
    for (const velocityField of ["initialLinearVelocity", "initialAngularVelocity"] as const) {
      const velocity = asRecord(body[velocityField], `${label}.${velocityField}`);
      for (const axis of ["x", "y", "z"] as const) {
        expect(velocity[axis], `${label}.${velocityField}.${axis}`).toBe(0);
      }
    }
    const configuredMass = id === "button"
      ? COUNTERBALL_CONFIG_V1.bodies.buttonMass
      : COUNTERBALL_CONFIG_V1.bodies.capMass;
    const projection = assertExactKeys(
      body["configuredMassProjection"],
      ["configuredMass", "projectedMass", "observedNativeMass", "tolerance", "withinTolerance"],
      `${label}.configuredMassProjection`,
    );
    const projectedMass = Math.fround(configuredMass);
    const tolerance =
      COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.energy.nativeMassToleranceMultiplier *
      Number.EPSILON * Math.max(1, configuredMass);
    expect(projection["configuredMass"]).toBe(configuredMass);
    expect(projection["projectedMass"]).toBe(projectedMass);
    expect(projection["observedNativeMass"]).toBe(nativeMass);
    expect(projection["tolerance"]).toBe(tolerance);
    expect(projection["withinTolerance"]).toBe(true);
    expect(Math.abs(nativeMass - projectedMass)).toBeLessThanOrEqual(tolerance);

    const initialBody = expectedBodies.get(id);
    if (initialBody === undefined) throw new Error(`${label} is absent from fixture setup.`);
    if (bodyIndex === 0) {
      // State-row setup checks below prove each configured transform and all-zero velocity.
      expect(initialBody.id).toBe("button");
    }
  });

  const materialsValue = metadata["materials"];
  if (!Array.isArray(materialsValue) || materialsValue.length !== 22) {
    throw new Error(`Case ${index} must record all 22 shape material readbacks.`);
  }
  const materialByShape = new Map<string, MatrixRecord>();
  for (const [materialIndex, item] of materialsValue.entries()) {
    const label = `Case ${index} material ${materialIndex}`;
    const material = assertExactKeys(item, ["bodyId", "shapeIndex", "setter", "readback"], label);
    const bodyId = material["bodyId"];
    if (typeof bodyId !== "string" || !MATRIX_KNOWN_BODY_IDS.has(bodyId)) {
      throw new Error(`${label} references an unknown body.`);
    }
    expect(boundedInteger(material["shapeIndex"], 0, 0, `${label}.shapeIndex`)).toBe(0);
    const key = `${bodyId}:0`;
    expect(materialByShape.has(key)).toBe(false);
    assertMaterialValues(material["setter"], `${label}.setter`);
    assertMaterialValues(material["readback"], `${label}.readback`);
    expect(material["setter"]).toEqual(material["readback"]);
    materialByShape.set(key, asRecord(material["readback"], `${label}.readback`));
  }
  for (const id of [...MATRIX_ENTITY_IDS, ...MATRIX_STATIC_IDS]) {
    expect(materialByShape.has(`${id}:0`), `Material for ${id}`).toBe(true);
  }

  const staticValue = metadata["staticBodies"];
  if (!Array.isArray(staticValue) || staticValue.length !== MATRIX_STATIC_IDS.length) {
    throw new Error(`Case ${index} must record all seven static colliders.`);
  }
  const staticFilters = new Map<string, readonly [number, number]>();
  staticValue.forEach((item: unknown, staticIndex: number) => {
    const label = `Case ${index} static body ${staticIndex}`;
    const body = assertExactKeys(item, ["id", "colliderDimensions", "collisionFilter", "material"], label);
    const id = MATRIX_STATIC_IDS[staticIndex];
    if (id === undefined) throw new Error(`${label} has no canonical id.`);
    expect(body["id"]).toBe(id);
    const dimensions = asRecord(body["colliderDimensions"], `${label}.dimensions`);
    assertVector(dimensions, `${label}.dimensions`);
    const geometry = COUNTERBALL_CONFIG_V1.geometry;
    const expected = id === "support-apron"
      ? { x: geometry.pitchWidth + 650, y: geometry.surfaceThickness, z: geometry.pitchLength + 650 }
      : id === "goal-frame-2" || id === "goal-frame-5"
        ? { x: geometry.goalWidth, y: geometry.goalFrameRadius * 2, z: geometry.goalFrameRadius * 2 }
        : { x: geometry.goalFrameRadius * 2, y: geometry.goalHeight, z: geometry.goalFrameRadius * 2 };
    expect(dimensions).toEqual(expected);
    const filter = assertFilterPair(body["collisionFilter"], `${label}.collisionFilter`);
    staticFilters.set(id, filter);
    assertMaterialValues(body["material"], `${label}.material`);
    expect(body["material"]).toEqual(materialByShape.get(`${id}:0`));
  });

  for (const dynamicId of MATRIX_ENTITY_IDS) {
    const dynamicFilter = dynamicFilters.get(dynamicId);
    if (dynamicFilter === undefined) throw new Error(`Filter for ${dynamicId} is missing.`);
    for (const staticId of MATRIX_STATIC_IDS) {
      const staticFilter = staticFilters.get(staticId);
      if (staticFilter === undefined || !filtersCollide(dynamicFilter, staticFilter)) {
        throw new Error(`${dynamicId} cannot collide with ${staticId}.`);
      }
    }
  }
  for (let leftIndex = 0; leftIndex < MATRIX_ENTITY_IDS.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < MATRIX_ENTITY_IDS.length; rightIndex += 1) {
      const leftId = MATRIX_ENTITY_IDS[leftIndex];
      const rightId = MATRIX_ENTITY_IDS[rightIndex];
      if (leftId === undefined || rightId === undefined) throw new Error("Dynamic filter order is incomplete.");
      const left = dynamicFilters.get(leftId);
      const right = dynamicFilters.get(rightId);
      if (left === undefined || right === undefined || !filtersCollide(left, right)) {
        throw new Error(`${leftId} cannot collide with ${rightId}.`);
      }
    }
  }

  for (const field of ["preImpulseMeasuredShiftedEnergy", "preImpulsePredictedShiftedEnergy"] as const) {
    const energy = finiteNumber(metadata[field], `Case ${index} ${field}`);
    expect(energy).toBeGreaterThanOrEqual(0);
    expect(energy).toBeLessThanOrEqual(COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.energy.maximum);
  }

  const finalBodies = metadata["finalBodies"];
  if (!Array.isArray(finalBodies) || finalBodies.length !== MATRIX_ENTITY_IDS.length) {
    throw new Error(`Case ${index} must contain all 15 final body states.`);
  }
  finalBodies.forEach((body, bodyIndex) => {
    const id = MATRIX_ENTITY_IDS[bodyIndex];
    if (id === undefined) throw new Error(`Case ${index} final body id is missing.`);
    assertBodyState(body, id, `Case ${index} final body ${bodyIndex}`);
  });

  const settling = assertExactKeys(
    metadata["settlingWindow"],
    ["startTick", "endTick", "linearSpeedThreshold", "angularSpeedThreshold", "ticks"],
    `Case ${index} settlingWindow`,
  );
  const startTick = boundedInteger(settling["startTick"], 0, 1_800, `Case ${index} settle start`);
  const endTick = boundedInteger(settling["endTick"], 0, 1_800, `Case ${index} settle end`);
  expect(endTick - startTick + 1).toBe(60);
  const linearThreshold = finiteNumber(settling["linearSpeedThreshold"], `Case ${index} linear settle threshold`);
  const angularThreshold = finiteNumber(settling["angularSpeedThreshold"], `Case ${index} angular settle threshold`);
  expect(linearThreshold).toBe(COUNTERBALL_CONFIG_V1.simulation.linearSettleThreshold);
  expect(angularThreshold).toBe(COUNTERBALL_CONFIG_V1.simulation.angularSettleThreshold);
  const settleTicks = settling["ticks"];
  if (!Array.isArray(settleTicks) || settleTicks.length !== 60) {
    throw new Error(`Case ${index} must preserve all 60 settling ticks.`);
  }
  for (let settleIndex = 0; settleIndex < settleTicks.length; settleIndex += 1) {
    const value: unknown = settleTicks[settleIndex];
    const tick = assertExactKeys(value, ["tick", "linearSpeeds", "angularSpeeds", "settledMask"], `Case ${index} settle tick ${settleIndex}`);
    expect(boundedInteger(tick["tick"], startTick, endTick, `Case ${index} settle tick id`)).toBe(startTick + settleIndex);
    const linear = tick["linearSpeeds"];
    const angular = tick["angularSpeeds"];
    if (!Array.isArray(linear) || !Array.isArray(angular) || linear.length !== 15 || angular.length !== 15) {
      throw new Error(`Case ${index} settle tick ${settleIndex} does not include all bodies.`);
    }
    const mask = boundedInteger(tick["settledMask"], 0, 0x7fff, `Case ${index} settle mask`);
    let expectedMask = 0;
    for (let bodyIndex = 0; bodyIndex < 15; bodyIndex += 1) {
      const linearSpeed = finiteNumber(linear[bodyIndex], `Case ${index} settle linear speed`);
      const angularSpeed = finiteNumber(angular[bodyIndex], `Case ${index} settle angular speed`);
      if (linearSpeed < 0 || angularSpeed < 0) throw new Error("Settling speeds cannot be negative.");
      if (linearSpeed <= linearThreshold && angularSpeed <= angularThreshold) expectedMask |= 1 << bodyIndex;
    }
    expect(mask).toBe(expectedMask);
  }

  const executeStepCalls = boundedInteger(
    metadata["executeStepCalls"],
    1,
    COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.workload.maximumExecuteStepCallsPerCase,
    `Case ${index} executeStepCalls`,
  );
  const batches = boundedInteger(
    metadata["batches"],
    1,
    COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.workload.maximumBatchesPerCase,
    `Case ${index} batches`,
  );
  expect(batches).toBeLessThanOrEqual(executeStepCalls);
  expect(batches * COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.workload.maximumCallsPerBatch).toBeGreaterThanOrEqual(executeStepCalls);
  const wallTimeMs = finiteNumber(metadata["wallTimeMs"], `Case ${index} wallTimeMs`);
  expect(wallTimeMs).toBeGreaterThanOrEqual(0);
  expect(wallTimeMs).toBeLessThanOrEqual(COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.workload.maximumWallTimePerCaseMs);
  const eligibility = assertExactKeys(metadata["eligibility"], ["eligible", "reasons"], `Case ${index} eligibility`);
  if (typeof eligibility["eligible"] !== "boolean" || !Array.isArray(eligibility["reasons"])) {
    throw new Error(`Case ${index} eligibility is malformed.`);
  }
  expect((eligibility["eligible"] === true) === (eligibility["reasons"].length === 0)).toBe(true);

  return metadata;
}

function parseObjectSpan(text: string, span: JsonSpan, label: string): unknown {
  const source = text.slice(span.start, span.end);
  if (!isCompactJson(source)) throw new Error(`${label} is not compact JSON.`);
  const value: unknown = JSON.parse(source);
  asRecord(value, label);
  return value;
}

function validateSweepRow(
  value: unknown,
  tuple: MatrixTuple,
  rowIndex: number,
  label: string,
): number {
  const row = assertExactKeys(value, MATRIX_SWEEP_ROW_KEYS, label);
  assertTuple(row["tuple"], tuple, `${label}.tuple`);
  expect(boundedInteger(row["nominalTick"], 0, 1_800, `${label}.nominalTick`)).toBe(rowIndex);
  const calls = boundedInteger(
    row["actualCheckedCallCount"],
    1,
    COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.sweep.maximumCallsPerNominalTick,
    `${label}.actualCheckedCallCount`,
  );
  const workload = COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard;
  const energy = assertExactKeys(
    row["maximumShiftedEnergy"],
    ["value", "callIndex"],
    `${label}.maximumShiftedEnergy`,
  );
  const maximumEnergy = finiteNumber(energy["value"], `${label}.maximumShiftedEnergy.value`);
  expect(maximumEnergy).toBeGreaterThanOrEqual(0);
  expect(maximumEnergy).toBeLessThanOrEqual(workload.energy.maximum);
  boundedInteger(energy["callIndex"], 0, calls - 1, `${label}.maximumShiftedEnergy.callIndex`);

  const bodyExtrema = [
    ["maximumCandidateRelativeComDrop", workload.energy.maximumRestComDrop, "maximum"],
    ["minimumApronMargin", 0, "minimum"],
    ["minimumSlabUndersideMargin", 0, "minimum"],
    ["maximumPointSweep", workload.sweep.maximumPointSweepPerCall, "maximum"],
    ["maximumRotationSweep", workload.sweep.maximumRotationPerCall, "maximum"],
  ] as const;
  for (const [key, limit, direction] of bodyExtrema) {
    const extremum = assertExactKeys(
      row[key],
      ["value", "callIndex", "bodyId"],
      `${label}.${key}`,
    );
    const number = finiteNumber(extremum["value"], `${label}.${key}.value`);
    boundedInteger(extremum["callIndex"], 0, calls - 1, `${label}.${key}.callIndex`);
    expect(MATRIX_ENTITY_IDS).toContain(extremum["bodyId"]);
    if (direction === "maximum") expect(number).toBeLessThanOrEqual(limit);
    else expect(number).toBeGreaterThanOrEqual(limit);
    if (key === "maximumPointSweep" || key === "maximumRotationSweep") {
      expect(number).toBeGreaterThanOrEqual(0);
    }
  }

  const clearance = assertExactKeys(
    row["minimumWholeButtonObstacleClearance"],
    ["value", "callIndex", "obstaclePair"],
    `${label}.minimumWholeButtonObstacleClearance`,
  );
  finiteNumber(clearance["value"], `${label}.minimumWholeButtonObstacleClearance.value`);
  boundedInteger(clearance["callIndex"], 0, calls - 1, `${label}.minimumWholeButtonObstacleClearance.callIndex`);
  expect(clearance["obstaclePair"]).toEqual(["button", "home-1"]);
  const classification = row["intervalClassification"];
  expect([
    "no-horizontal-overlap",
    "contact",
    "clear-above-margin",
    "clearance-at-or-below-margin",
  ]).toContain(classification);
  expect(row["allFinite"]).toBe(true);
  expect(typeof row["all15Settled"]).toBe("boolean");
  return calls;
}

type MatrixCaseCounts = Readonly<{
  bodyRows: number;
  contactRows: number;
  sweepRows: number;
  executeStepCalls: number;
  batches: number;
  wallTimeMs: number;
  eligible: boolean;
}>;

async function validateMatrixCase(
  raw: string,
  index: number,
  tuple: MatrixTuple,
  identity: MatrixRecord,
  fixtureState: ReturnType<typeof parseMatchState>,
): Promise<MatrixCaseCounts> {
  if (!isCompactJson(raw)) throw new Error(`Case ${index} is not compact JSON.`);
  const rawBytes = Buffer.byteLength(raw, "utf8");
  expect(rawBytes).toBeLessThanOrEqual(MATRIX_CASE_MAXIMUM_BYTES);
  const caseSpans = objectValueSpans(raw);
  expect([...caseSpans.keys()].sort()).toEqual(
    ["bodyRows", "contactRows", "metadata", "sweepRows"].sort(),
  );
  const metadataSpan = caseSpans.get("metadata");
  const bodySpan = caseSpans.get("bodyRows");
  const contactSpan = caseSpans.get("contactRows");
  const sweepSpan = caseSpans.get("sweepRows");
  if (!metadataSpan || !bodySpan || !contactSpan || !sweepSpan) {
    throw new Error(`Case ${index} is missing a required field.`);
  }
  const metadataBytes = Buffer.byteLength(raw.slice(metadataSpan.start, metadataSpan.end), "utf8");
  expect(metadataBytes).toBeLessThanOrEqual(MATRIX_METADATA_MAXIMUM_BYTES);
  const metadata = validateCaseMetadata(
    parseObjectSpan(raw, metadataSpan, `Case ${index} metadata`),
    identity,
    tuple,
    index,
    regeneratedInitialState(fixtureState, tuple),
  );
  const expectedState = regeneratedInitialState(fixtureState, tuple);
  expect(metadata["initialStateHash"]).toBe(await hashCanonicalJson(expectedState));

  let bodyRows = 0;
  let bodyTick = 0;
  let bodyIndex = 0;
  let startStates: Map<string, MatrixRecord> | undefined;
  let finalStates = new Map<string, MatrixRecord>();
  let currentTickStates = new Map<string, MatrixRecord>();
  const endpointSettleFacts: Array<Readonly<{ settled: boolean; linear: readonly number[]; angular: readonly number[] }>> = [];
  const expectedBodies = new Map(expectedState.bodies.map((body) => [body.id, body]));
  for (const span of arrayValueSpans(raw, bodySpan, `Case ${index} bodyRows`)) {
    const rowText = raw.slice(span.start, span.end);
    expect(Buffer.byteLength(rowText, "utf8")).toBeLessThanOrEqual(MATRIX_ROW_MAXIMUM_BYTES);
    const row = assertExactKeys(JSON.parse(rowText) as unknown, MATRIX_BODY_ROW_KEYS, `Case ${index} body row ${bodyRows}`);
    assertTuple(row["tuple"], tuple, `Case ${index} body tuple`);
    const tick = boundedInteger(row["nominalTick"], 0, 1_800, `Case ${index} body tick`);
    expect(tick).toBe(bodyTick);
    const id = MATRIX_ENTITY_IDS[bodyIndex];
    if (id === undefined) throw new Error(`Case ${index} body ordering exceeded 15 ids.`);
    const state = assertBodyState(
      {
        id: row["id"],
        position: row["position"],
        rotation: row["rotation"],
        linearVelocity: row["linearVelocity"],
        angularVelocity: row["angularVelocity"],
      },
      id,
      `Case ${index} body row ${bodyRows}`,
    );
    if (bodyIndex === 0) currentTickStates = new Map();
    currentTickStates.set(id, state);
    if (tick === 0) {
      const expected = expectedBodies.get(id);
      if (!expected) throw new Error(`Case ${index} expected setup is missing ${id}.`);
      assertSameVector(state["position"], expected.position, `Case ${index} initial ${id} position`);
      assertSameQuaternion(state["rotation"], expected.rotation, `Case ${index} initial ${id} rotation`);
      if (id === "home-0") {
        const facts = metadata["dynamicBodies"] as unknown[];
        const selected = facts.find((value) => asRecord(value, "dynamic fact")["id"] === id);
        if (!selected) throw new Error(`Case ${index} selected cap facts are missing.`);
        const mass = finiteNumber(asRecord(selected, "selected cap fact")["nativeMass"], "selected cap mass");
        const expectedPostImpulseVelocity = { x: 0, y: 0, z: tuple[2] / mass };
        assertSameVector(state["linearVelocity"], expectedPostImpulseVelocity, `Case ${index} tick-zero impulse velocity`);
      } else {
        assertSameVector(state["linearVelocity"], expected.linearVelocity, `Case ${index} initial ${id} linear velocity`);
      }
      assertSameVector(state["angularVelocity"], expected.angularVelocity, `Case ${index} initial ${id} angular velocity`);
    }
    bodyRows += 1;
    bodyIndex += 1;
    if (bodyIndex === MATRIX_ENTITY_IDS.length) {
      if (tick === 0) startStates = new Map(currentTickStates);
      finalStates = new Map(currentTickStates);
      const linear: number[] = [];
      const angular: number[] = [];
      let settled = true;
      for (const entityId of MATRIX_ENTITY_IDS) {
        const sample = currentTickStates.get(entityId);
        if (!sample) throw new Error(`Case ${index} tick ${tick} is missing ${entityId}.`);
        const linearVelocity = asRecord(sample["linearVelocity"], "body linear velocity");
        const angularVelocity = asRecord(sample["angularVelocity"], "body angular velocity");
        const linearSpeed = Math.hypot(
          finiteNumber(linearVelocity["x"], "linear x"),
          finiteNumber(linearVelocity["y"], "linear y"),
          finiteNumber(linearVelocity["z"], "linear z"),
        );
        const angularSpeed = Math.hypot(
          finiteNumber(angularVelocity["x"], "angular x"),
          finiteNumber(angularVelocity["y"], "angular y"),
          finiteNumber(angularVelocity["z"], "angular z"),
        );
        linear.push(linearSpeed);
        angular.push(angularSpeed);
        if (
          linearSpeed > COUNTERBALL_CONFIG_V1.simulation.linearSettleThreshold ||
          angularSpeed > COUNTERBALL_CONFIG_V1.simulation.angularSettleThreshold
        ) settled = false;
      }
      endpointSettleFacts.push({ settled, linear, angular });
      bodyIndex = 0;
      bodyTick += 1;
    }
  }
  if (
    bodyRows < 30 ||
    bodyRows > MATRIX_ROW_MAXIMUM_COUNT ||
    bodyRows % MATRIX_ENTITY_IDS.length !== 0
  ) throw new Error(`Case ${index} has an invalid complete-body row count.`);
  const tickCount = bodyRows / MATRIX_ENTITY_IDS.length;
  expect(bodyTick).toBe(tickCount);
  expect(bodyIndex).toBe(0);
  expect(tickCount).toBeLessThanOrEqual(1_801);
  if (!startStates || finalStates.size !== MATRIX_ENTITY_IDS.length) {
    throw new Error(`Case ${index} is missing complete start or final body states.`);
  }
  const finalBodies = metadata["finalBodies"];
  if (!Array.isArray(finalBodies) || finalBodies.length !== MATRIX_ENTITY_IDS.length) {
    throw new Error(`Case ${index} final body list is malformed.`);
  }
  finalBodies.forEach((value: unknown, bodyIndex: number) => {
    const id = MATRIX_ENTITY_IDS[bodyIndex];
    if (id === undefined) throw new Error(`Case ${index} final id is missing.`);
    const state = assertBodyState(value, id, `Case ${index} final body ${id}`);
    const sampled = finalStates.get(id);
    if (!sampled) throw new Error(`Case ${index} final sample ${id} is missing.`);
    for (const key of ["position", "linearVelocity", "angularVelocity"] as const) {
      assertSameVector(state[key], sampled[key], `Case ${index} final ${id} ${key}`);
    }
    assertSameQuaternion(state["rotation"], sampled["rotation"], `Case ${index} final ${id} rotation`);
  });

  let contactRows = 0;
  let previousContactTick = -1;
  let previousContactCall = -1;
  let buttonObstacleContact = false;
  const contactAddresses: Array<readonly [tick: number, call: number]> = [];
  for (const span of arrayValueSpans(raw, contactSpan, `Case ${index} contactRows`)) {
    const rowText = raw.slice(span.start, span.end);
    expect(Buffer.byteLength(rowText, "utf8")).toBeLessThanOrEqual(MATRIX_ROW_MAXIMUM_BYTES);
    const row = assertExactKeys(JSON.parse(rowText) as unknown, MATRIX_CONTACT_ROW_KEYS, `Case ${index} contact row ${contactRows}`);
    assertTuple(row["tuple"], tuple, `Case ${index} contact tuple`);
    const tick = boundedInteger(row["nominalTick"], 0, tickCount - 1, `Case ${index} contact tick`);
    const call = boundedInteger(row["callIndex"], 0, COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.workload.maximumExecuteStepCallsPerCase - 1, `Case ${index} contact call`);
    if (tick < previousContactTick || call < previousContactCall) {
      throw new Error(`Case ${index} contact occurrence order moved backwards.`);
    }
    previousContactTick = tick;
    previousContactCall = call;
    contactAddresses.push([tick, call]);
    if (call >= finiteNumber(metadata["executeStepCalls"], `Case ${index} calls`)) {
      throw new Error(`Case ${index} contact call is beyond its executed calls.`);
    }
    const pair = row["pair"];
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`Case ${index} contact pair is malformed.`);
    if (typeof pair[0] !== "string" || typeof pair[1] !== "string") {
      throw new Error(`Case ${index} contact pair members are not strings.`);
    }
    const contactOrder = [...MATRIX_ENTITY_IDS, ...MATRIX_STATIC_IDS];
    const leftIndex = contactOrder.findIndex((id) => id === pair[0]);
    const rightIndex = contactOrder.findIndex((id) => id === pair[1]);
    if (leftIndex < 0 || rightIndex < 0 || leftIndex >= rightIndex) {
      throw new Error(`Case ${index} contact pair is unknown, identical, or noncanonical.`);
    }
    if (typeof row["eventType"] !== "string" || row["eventType"].length === 0 || Buffer.byteLength(row["eventType"], "utf8") > COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.artifact.maximumEventTypeBytes) {
      throw new Error(`Case ${index} event type is invalid or over its byte cap.`);
    }
    if (row["point"] !== null) assertVector(row["point"], `Case ${index} contact point`);
    if (pair[0] === "button" && pair[1] === "home-1") buttonObstacleContact = true;
    contactRows += 1;
  }
  expect(contactRows).toBeLessThanOrEqual(MATRIX_CONTACT_MAXIMUM_COUNT);

  let sweepRows = 0;
  let checkedCalls = 0;
  let anyOverlap = false;
  let everyOverlappingSweepClear = true;
  const callRanges: Array<readonly [start: number, end: number]> = [];
  for (const span of arrayValueSpans(raw, sweepSpan, `Case ${index} sweepRows`)) {
    const rowText = raw.slice(span.start, span.end);
    expect(Buffer.byteLength(rowText, "utf8")).toBeLessThanOrEqual(MATRIX_SWEEP_ROW_MAXIMUM_BYTES);
    const row = JSON.parse(rowText) as unknown;
    const intervalCalls = validateSweepRow(row, tuple, sweepRows, `Case ${index} sweep row ${sweepRows}`);
    callRanges.push([checkedCalls, checkedCalls + intervalCalls - 1]);
    checkedCalls += intervalCalls;
    const sweep = asRecord(row, `Case ${index} sweep row`);
    const endpointFacts = endpointSettleFacts[sweepRows + 1];
    if (!endpointFacts) throw new Error(`Case ${index} sweep has no matching endpoint state.`);
    expect(sweep["all15Settled"]).toBe(endpointFacts.settled);
    const classification = sweep["intervalClassification"];
    if (classification !== "no-horizontal-overlap") {
      anyOverlap = true;
      const clearance = asRecord(sweep["minimumWholeButtonObstacleClearance"], "sweep clearance");
      if (finiteNumber(clearance["value"], "sweep clearance value") <= COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.sweep.verticalClearanceMargin) {
        everyOverlappingSweepClear = false;
      }
    }
    sweepRows += 1;
  }
  expect(sweepRows).toBe(tickCount - 1);
  expect(sweepRows).toBeLessThanOrEqual(MATRIX_SWEEP_MAXIMUM_COUNT);
  for (const [tick, call] of contactAddresses) {
    const range = callRanges[tick];
    if (!range || call < range[0] || call > range[1]) {
      throw new Error(`Case ${index} contact call does not belong to its nominal interval.`);
    }
  }
  const workload = COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.workload;
  const executeStepCalls = boundedInteger(metadata["executeStepCalls"], 1, workload.maximumExecuteStepCallsPerCase, `Case ${index} executeStepCalls`);
  expect(checkedCalls).toBe(executeStepCalls);
  const batches = boundedInteger(metadata["batches"], 1, workload.maximumBatchesPerCase, `Case ${index} batches`);
  expect(batches).toBeLessThanOrEqual(executeStepCalls);
  expect(batches * COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.workload.maximumCallsPerBatch).toBeGreaterThanOrEqual(executeStepCalls);
  const wallTimeMs = finiteNumber(metadata["wallTimeMs"], `Case ${index} wallTimeMs`);
  expect(wallTimeMs).toBeGreaterThanOrEqual(0);
  expect(wallTimeMs).toBeLessThanOrEqual(COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.workload.maximumWallTimePerCaseMs);

  const settling = asRecord(metadata["settlingWindow"], `Case ${index} settlingWindow`);
  const endTick = boundedInteger(settling["endTick"], 0, tickCount - 1, `Case ${index} settling endTick`);
  expect(endTick).toBe(tickCount - 1);
  const settlingTicks = settling["ticks"];
  if (!Array.isArray(settlingTicks) || settlingTicks.length !== 60) throw new Error(`Case ${index} must include all 60 settle samples.`);
  const startTick = boundedInteger(settling["startTick"], 0, tickCount - 1, `Case ${index} settle startTick`);
  expect(endTick - startTick + 1).toBe(60);
  expect(finiteNumber(settling["linearSpeedThreshold"], "settling linear threshold")).toBe(COUNTERBALL_CONFIG_V1.simulation.linearSettleThreshold);
  expect(finiteNumber(settling["angularSpeedThreshold"], "settling angular threshold")).toBe(COUNTERBALL_CONFIG_V1.simulation.angularSettleThreshold);
  let allSettled = true;
  for (let settleIndex = 0; settleIndex < settlingTicks.length; settleIndex += 1) {
    const value: unknown = settlingTicks[settleIndex];
    const item = assertExactKeys(value, ["tick", "linearSpeeds", "angularSpeeds", "settledMask"], `Case ${index} settle sample ${settleIndex}`);
    const tick = boundedInteger(item["tick"], 0, tickCount - 1, `Case ${index} settle tick`);
    expect(tick).toBe(startTick + settleIndex);
    const mask = boundedInteger(item["settledMask"], 0, 0x7fff, `Case ${index} settle mask`);
    const linear = item["linearSpeeds"];
    const angular = item["angularSpeeds"];
    if (!Array.isArray(linear) || !Array.isArray(angular) || linear.length !== 15 || angular.length !== 15) throw new Error(`Case ${index} settle speed arrays are malformed.`);
    const expectedMask = linear.reduce((bits: number, speed: unknown, bodyIndex: number) => {
      const linearSpeed = finiteNumber(speed, `Case ${index} settle linear speed`);
      const angularSpeed = finiteNumber(angular[bodyIndex], `Case ${index} settle angular speed`);
      if (linearSpeed < 0 || angularSpeed < 0) throw new Error("Settle speeds cannot be negative.");
      return linearSpeed <= finiteNumber(settling["linearSpeedThreshold"], "linear threshold") && angularSpeed <= finiteNumber(settling["angularSpeedThreshold"], "angular threshold") ? bits | (1 << bodyIndex) : bits;
    }, 0);
    expect(mask).toBe(expectedMask);
    const endpoint = endpointSettleFacts[tick];
    if (!endpoint) throw new Error(`Case ${index} settle row has no body-state endpoint.`);
    expect(linear).toEqual(endpoint.linear);
    expect(angular).toEqual(endpoint.angular);
    if (mask !== 0x7fff) allSettled = false;
  }

  const buttonFact = (metadata["dynamicBodies"] as unknown[]).find((value) => asRecord(value, "dynamic fact")["id"] === "button");
  const obstacleFact = (metadata["dynamicBodies"] as unknown[]).find((value) => asRecord(value, "dynamic fact")["id"] === "home-1");
  if (!buttonFact || !obstacleFact) throw new Error(`Case ${index} lacks button/obstacle collider facts.`);
  const buttonDimensions = asRecord(asRecord(buttonFact, "button fact")["colliderDimensions"], "button dimensions");
  const obstacleDimensions = asRecord(asRecord(obstacleFact, "obstacle fact")["colliderDimensions"], "obstacle dimensions");
  const buttonRadius = Math.hypot(
    finiteNumber(buttonDimensions["x"], "button dimension x") / 2,
    finiteNumber(buttonDimensions["y"], "button dimension y") / 2,
    finiteNumber(buttonDimensions["z"], "button dimension z") / 2,
  );
  const obstacleRadius = Math.hypot(
    finiteNumber(obstacleDimensions["x"], "obstacle dimension x") / 2,
    finiteNumber(obstacleDimensions["y"], "obstacle dimension y") / 2,
    finiteNumber(obstacleDimensions["z"], "obstacle dimension z") / 2,
  );
  const startButton = startStates.get("button");
  const startObstacle = startStates.get("home-1");
  const endButton = finalStates.get("button");
  const endObstacle = finalStates.get("home-1");
  if (!startButton || !startObstacle || !endButton || !endObstacle) throw new Error(`Case ${index} is missing crossing endpoints.`);
  const startsBefore = finiteNumber(asRecord(startButton["position"], "start button position")["z"], "start button z") + buttonRadius < finiteNumber(asRecord(startObstacle["position"], "start obstacle position")["z"], "start obstacle z") - obstacleRadius;
  const finishesBeyond = finiteNumber(asRecord(endButton["position"], "end button position")["z"], "end button z") - buttonRadius > finiteNumber(asRecord(endObstacle["position"], "end obstacle position")["z"], "end obstacle z") + obstacleRadius;
  const expectedReasons: string[] = [];
  if (!startsBefore) expectedReasons.push("button-does-not-start-fully-before-obstacle");
  if (!finishesBeyond) expectedReasons.push("button-does-not-finish-fully-beyond-obstacle");
  if (!anyOverlap) expectedReasons.push("no-full-horizontal-overlap-sampled");
  if (!everyOverlappingSweepClear) expectedReasons.push("vertical-clearance-not-above-diagnostic-margin");
  if (buttonObstacleContact) expectedReasons.push("button-obstacle-contact-observed");
  if (!allSettled) expectedReasons.push("all-body-settling-window-not-achieved");
  const eligibility = assertExactKeys(metadata["eligibility"], ["eligible", "reasons"], `Case ${index} eligibility`);
  expect(eligibility["reasons"]).toEqual(expectedReasons);
  expect(eligibility["eligible"]).toBe(expectedReasons.length === 0);

  return { bodyRows, contactRows, sweepRows, executeStepCalls, batches, wallTimeMs, eligible: expectedReasons.length === 0 };
}

async function validateMatrixFile(path: string): Promise<{
  digest: DownloadDigest;
  totals: MatrixTotals;
  identity: MatrixRecord;
}> {
  const file = await open(path, "r");
  let primaryFailure: { readonly value: unknown } | null = null;
  let result: { digest: DownloadDigest; totals: MatrixTotals; identity: MatrixRecord } | undefined;
  try {
    const stats = await file.stat();
    if (stats.size > MATRIX_MAXIMUM_BYTES) throw new Error("The downloaded matrix exceeds its inclusive file cap.");
    const reader = new MatrixJsonFileReader(file);
    await reader.consumeAscii('{"metadata":');
    const metadataJson = await reader.readObject(MATRIX_METADATA_MAXIMUM_BYTES, "Matrix metadata");
    if (!isCompactJson(metadataJson)) throw new Error("Matrix metadata is not compact JSON.");
    const fixture = await readPinnedFixture();
    const configHash = await hashCounterballConfig();
    const identity = validateMatrixIdentity(JSON.parse(metadataJson) as unknown, configHash, fixture.rawSha256);
    await reader.consumeAscii(',"cases":[');
    const aggregate = { caseCount: 0, bodyRows: 0, contactRows: 0, sweepRows: 0, executeStepCalls: 0, batches: 0, wallTimeMs: 0, eligibleCases: 0 };
    for (let index = 0; index < EXPECTED_MATRIX_TUPLES.length; index += 1) {
      if (index > 0) await reader.consumeAscii(",");
      const tuple = EXPECTED_MATRIX_TUPLES[index];
      if (!tuple) throw new Error(`Canonical matrix tuple ${index} is missing.`);
      const rawCase = await reader.readObject(MATRIX_CASE_MAXIMUM_BYTES, `Case ${index}`);
      const counts = await validateMatrixCase(rawCase, index, tuple, identity, fixture.initialState);
      aggregate.caseCount += 1;
      aggregate.bodyRows += counts.bodyRows;
      aggregate.contactRows += counts.contactRows;
      aggregate.sweepRows += counts.sweepRows;
      aggregate.executeStepCalls += counts.executeStepCalls;
      aggregate.batches += counts.batches;
      aggregate.wallTimeMs += counts.wallTimeMs;
      if (counts.eligible) aggregate.eligibleCases += 1;
      if (aggregate.bodyRows > MATRIX_TOTAL_BODY_MAXIMUM_COUNT || aggregate.contactRows > MATRIX_TOTAL_CONTACT_MAXIMUM_COUNT || aggregate.sweepRows > MATRIX_SWEEP_MAXIMUM_COUNT * EXPECTED_MATRIX_TUPLES.length || aggregate.executeStepCalls > MATRIX_TOTAL_CALL_MAXIMUM_COUNT || aggregate.batches > MATRIX_TOTAL_BATCH_MAXIMUM_COUNT || aggregate.wallTimeMs > COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.workload.maximumWallTimeMatrixMs) {
        throw new Error("The matrix exceeds a frozen aggregate row/workload cap.");
      }
    }
    await reader.consumeAscii('],"envelope":');
    const envelopeJson = await reader.readObject(MATRIX_METADATA_MAXIMUM_BYTES, "Matrix envelope");
    const envelopeBytes = Buffer.byteLength(envelopeJson, "utf8");
    expect(envelopeBytes).toBeLessThanOrEqual(MATRIX_METADATA_MAXIMUM_BYTES);
    if (!isCompactJson(envelopeJson)) throw new Error("Matrix envelope is not compact JSON.");
    const envelope = assertExactKeys(JSON.parse(envelopeJson) as unknown, ["tuples", "caseCount", "bodyRows", "contactRows", "sweepRows", "executeStepCalls", "batches", "wallTimeMs"], "Matrix envelope");
    expect(envelope["tuples"]).toEqual(EXPECTED_MATRIX_TUPLES);
    for (const key of ["caseCount", "bodyRows", "contactRows", "sweepRows", "executeStepCalls", "batches"] as const) {
      expect(envelope[key], `Envelope ${key}`).toBe(aggregate[key]);
    }
    expect(envelope["wallTimeMs"]).toBe(aggregate.wallTimeMs);
    await reader.consumeAscii("}");
    const digest = await reader.assertEnd();
    expect(digest.byteLength).toBe(stats.size);
    expect(digest.byteLength).toBeLessThanOrEqual(MATRIX_MAXIMUM_BYTES);
    const totals: MatrixTotals = { ...aggregate, matrixBytes: digest.byteLength, envelopeBytes, measuredMatrixWallTimeMs: 0 };
    result = { digest, totals, identity };
  } catch (error) {
    primaryFailure = { value: error };
  }
  let closeFailure: { readonly value: unknown } | null = null;
  try {
    await file.close();
  } catch (error) {
    closeFailure = { value: error };
  }
  if (primaryFailure !== null && closeFailure !== null) {
    throw new AggregateError([primaryFailure.value, closeFailure.value], "Matrix validation failed and its file handle did not close.", { cause: primaryFailure.value });
  }
  if (primaryFailure !== null) {
    rethrowCaughtError(primaryFailure.value, "Matrix validation failed with a non-Error value.");
  }
  if (closeFailure !== null) {
    rethrowCaughtError(closeFailure.value, "Matrix file close failed with a non-Error value.");
  }
  if (!result) throw new Error("Matrix validation ended without a result.");
  return result;
}

function validateBrowserMatrixSummary(value: unknown, totals: MatrixTotals, identity: MatrixRecord): void {
  const summary = assertExactKeys(value, ["caseCount", "bodyRows", "contactRows", "sweepRows", "executeStepCalls", "batches", "wallTimeMs", "matrixBytes", "envelopeBytes", "configHash", "fixtureFileSha256", "fixturePayloadSha256", "wasmSha256", "runtimeIdentity", "eligibleCases", "measuredMatrixWallTimeMs"], "Browser matrix summary");
  for (const key of ["caseCount", "bodyRows", "contactRows", "sweepRows", "executeStepCalls", "batches", "wallTimeMs", "matrixBytes", "envelopeBytes"] as const) {
    expect(summary[key], `Browser summary ${key}`).toBe(totals[key]);
  }
  expect(summary["configHash"]).toBe(identity["configHash"]);
  expect(summary["fixtureFileSha256"]).toBe(identity["fixtureFileSha256"]);
  expect(summary["fixturePayloadSha256"]).toBe(identity["fixturePayloadSha256"]);
  expect(summary["wasmSha256"]).toBe(identity["wasmSha256"]);
  expect(summary["runtimeIdentity"]).toBe(identity["runtimeIdentity"]);
  const eligibleCases = boundedInteger(summary["eligibleCases"], 0, 24, "Browser eligibleCases");
  expect(eligibleCases).toBe(totals.eligibleCases);
  const measured = finiteNumber(summary["measuredMatrixWallTimeMs"], "Browser measuredMatrixWallTimeMs");
  expect(measured).toBeGreaterThanOrEqual(0);
  expect(measured).toBeGreaterThanOrEqual(totals.wallTimeMs);
  expect(measured).toBeLessThanOrEqual(COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.workload.maximumWallTimeMatrixMs);
}

function expectedTransportDigest(): string {
  const chunk = new Uint8Array(TRANSPORT_CHUNK_BYTES);
  for (let index = 0; index < chunk.length; index += 1) {
    chunk[index] = index % 251;
  }
  const hash = createHash("sha256");
  for (let index = 0; index < TRANSPORT_CHUNK_COUNT; index += 1) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}

async function hashDownloadedFile(path: string): Promise<DownloadDigest> {
  const hash = createHash("sha256");
  let byteLength = 0;
  const file = await open(path, "r");
  try {
    const buffer = new Uint8Array(64 * 1024);
    while (true) {
      const { bytesRead } = await file.read(buffer, 0, buffer.byteLength, null);
      if (bytesRead === 0) break;
      byteLength += bytesRead;
      if (byteLength > TRANSPORT_BYTES) {
        throw new Error("The downloaded transport file exceeds its exact cap.");
      }
      hash.update(buffer.subarray(0, bytesRead));
    }
  } catch (error) {
    let closeFailed = false;
    let closeError: unknown;
    try {
      await file.close();
    } catch (errorWhileClosing) {
      closeFailed = true;
      closeError = errorWhileClosing;
    }
    if (closeFailed) {
      throw new AggregateError(
        [error, closeError],
        "The downloaded transport could not be read or closed.",
        { cause: error },
      );
    }
    throw error;
  }
  await file.close();
  return { byteLength, sha256: hash.digest("hex") };
}

async function cleanupBrowserTransport(page: Page): Promise<void> {
  const cancelButton = page.getByTestId("loft-matrix-cancel");
  if (await cancelButton.isVisible()) {
    await cancelButton.click();
    await expect(cancelButton).toHaveCount(0, { timeout: 30_000 });
  }

  const discardButton = page.getByTestId("loft-matrix-discard");
  if (await discardButton.isVisible()) {
    await discardButton.click();
    await expect(page.getByTestId("loft-matrix-export")).toHaveCount(0, {
      timeout: 30_000,
    });
  }
}

type ProbeTrace = {
  scope: string;
  fixtureId: string;
  termination: string;
  capId: string;
  impulse: { x: number; y: number; z: number };
  applicationPoint: { x: number; y: number; z: number };
  settledBodyCount: number;
  contactPairs: string[][];
  capMovement: number;
  buttonMovement: number;
  changedWebGlPixels: number;
  pixelWidth: number;
  pixelHeight: number;
};

async function lifecycle(page: Page): Promise<LifecycleSnapshot> {
  return page.evaluate(() => {
    const read = (window as WindowWithDirectProbe)
      .__counterballDirectProbeLifecycle;
    if (!read) throw new Error("Direct-probe lifecycle evidence is missing.");
    return read();
  });
}

async function openDiagnostic(page: Page): Promise<void> {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Try the browser flick diagnostic" })
    .click();
  await expect(page.getByTestId("counterball-direct-probe")).toHaveAttribute(
    "data-phase",
    "ready",
    { timeout: 30_000 },
  );
  await expect(page.getByText("Diagnostic only · not playable")).toBeVisible();
}

type CanvasBounds = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

type PointerPoint = Readonly<{ x: number; y: number }>;

async function canvasBoundsInsideViewport(page: Page): Promise<CanvasBounds> {
  const canvas = page.getByTestId("counterball-canvas");
  await canvas.scrollIntoViewIfNeeded();
  const bounds = await canvas.boundingBox();
  const viewport = page.viewportSize();
  expect(bounds).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (!bounds || !viewport) {
    throw new Error("The diagnostic canvas or browser viewport has no bounds.");
  }

  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
  return bounds;
}

function assertPointerPointsInsideViewport(
  page: Page,
  points: readonly PointerPoint[],
): void {
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  if (!viewport) throw new Error("The browser viewport has no bounds.");

  for (const point of points) {
    expect(point.x).toBeGreaterThanOrEqual(0);
    expect(point.y).toBeGreaterThanOrEqual(0);
    expect(point.x).toBeLessThan(viewport.width);
    expect(point.y).toBeLessThan(viewport.height);
  }
}

async function assertAcceptedSceneFacts(page: Page): Promise<void> {
  const facts = await page.getByTestId("scene-facts").evaluate((element) => {
    const parsed: unknown = JSON.parse(element.textContent ?? "null");
    return parsed as {
      pieceCount: number;
      homeCaps: number;
      awayCaps: number;
      buttonCount: number;
      visibleButtonHoles: number;
      buttonBodyVertices: number;
      greenConcreteTexture: string | null;
      enclosingWallCount: number;
    };
  });
  expect(facts).toEqual({
    pieceCount: 15,
    homeCaps: 7,
    awayCaps: 7,
    buttonCount: 1,
    visibleButtonHoles: 4,
    buttonBodyVertices: expect.any(Number),
    greenConcreteTexture: "counterball-green-concrete-grain",
    enclosingWallCount: 0,
  });
  expect(facts.buttonBodyVertices).toBeGreaterThan(0);
}

async function flickAndReadTrace(
  page: Page,
  testInfo: TestInfo,
): Promise<ProbeTrace> {
  const canvas = page.getByTestId("counterball-canvas");
  await canvas.scrollIntoViewIfNeeded();

  const initialLifecycle = await lifecycle(page);
  expect(initialLifecycle.activeListeners).toBeGreaterThan(0);
  expect(initialLifecycle.activeResizeObservers).toBe(1);
  await canvas.screenshot({
    path: testInfo.outputPath("direct-probe-before.png"),
  });

  // Element screenshots may scroll the page. Read fresh bounds after the
  // screenshot's scroll so the pointer gesture uses current viewport space.
  const box = await canvasBoundsInsideViewport(page);
  const startX = box.x + box.width * 0.2;
  const startY = box.y + box.height * 0.78;
  const endX = startX + 64;
  const endY = startY - 32;
  assertPointerPointsInsideViewport(page, [
    { x: startX, y: startY },
    { x: endX, y: endY },
  ]);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 8 });
  await page.mouse.up();

  const result = page.getByTestId("probe-result");
  const error = page.getByTestId("probe-error");
  await expect
    .poll(async () => (await result.isVisible()) || (await error.isVisible()), {
      timeout: 30_000,
    })
    .toBe(true);
  if (await error.isVisible()) {
    const errorText = await error.textContent();
    if (!errorText) throw new Error("The direct-probe error is empty.");
    const lifecycleBeforeCleanup = await lifecycle(page);
    await testInfo.attach("counterball-direct-probe-error.json", {
      body: JSON.stringify(
        { error: errorText, lifecycleBeforeCleanup },
        null,
        2,
      ),
      contentType: "application/json",
    });
    await assertUnmountedAtBaseline(page);
    const lifecycleAfterCleanup = await lifecycle(page);
    await testInfo.attach("counterball-direct-probe-error-teardown.json", {
      body: JSON.stringify(
        { error: errorText, lifecycleAfterCleanup },
        null,
        2,
      ),
      contentType: "application/json",
    });
    throw new Error(`Direct browser diagnostic failed: ${errorText}`);
  }
  const traceText = await result.textContent();
  if (!traceText) throw new Error("The direct-shot trace is empty.");
  const trace = JSON.parse(traceText) as ProbeTrace;

  expect(trace.scope).toBe("browser-direct-impulse-v1");
  expect(trace.termination).toBe("settled");
  expect(trace.capId).toBe("home-6");
  expect(trace.impulse).toEqual({ x: 0, y: 0, z: 8 });
  expect(trace.applicationPoint).toEqual({ x: 0, y: 0.06, z: -4 });
  expect(trace.settledBodyCount).toBe(15);
  expect(trace.contactPairs).toContainEqual(
    expect.arrayContaining(["home-6", "button"]),
  );
  expect(trace.capMovement).toBeGreaterThan(0.0001);
  expect(trace.buttonMovement).toBeGreaterThan(0.0001);
  expect(trace.changedWebGlPixels).toBeGreaterThan(0);
  expect(trace.pixelWidth).toBeGreaterThan(0);
  expect(trace.pixelHeight).toBeGreaterThan(0);

  await canvas.screenshot({
    path: testInfo.outputPath("direct-probe-after.png"),
  });
  const sceneFactsText = await page.getByTestId("scene-facts").textContent();
  const sceneFacts: unknown = JSON.parse(sceneFactsText ?? "null");
  await testInfo.attach("counterball-direct-probe-trace.json", {
    body: JSON.stringify(
      {
        trace,
        sceneFacts,
        lifecycleBeforeFlick: initialLifecycle,
        lifecycleAfterFlick: await lifecycle(page),
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
  return trace;
}

async function assertUnmountedAtBaseline(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Back to Counterball" }).click();
  await expect(page.getByTestId("counterball-canvas")).toHaveCount(0);
  await expect(page.getByTestId("counterball-direct-probe")).toHaveCount(0);
  await expect
    .poll(async () => {
      const state = await lifecycle(page);
      return [
        state.engines === state.baselineEngines,
        state.activeListeners === 0,
        state.activeResizeObservers === 0,
      ];
    })
    .toEqual([true, true, true]);
}

test("a real pointer flick runs browser Havok and changes rendered WebGL pixels", async ({
  page,
}, testInfo) => {
  test.setTimeout(150_000);
  await openDiagnostic(page);
  await assertAcceptedSceneFacts(page);

  await flickAndReadTrace(page, testInfo);
  await assertUnmountedAtBaseline(page);
  const finalLifecycle = await lifecycle(page);
  await testInfo.attach("counterball-direct-probe-teardown.json", {
    body: JSON.stringify(finalLifecycle, null, 2),
    contentType: "application/json",
  });
  expect(finalLifecycle.engines).toBe(finalLifecycle.baselineEngines);
  expect(finalLifecycle.activeListeners).toBe(0);
  expect(finalLifecycle.activeResizeObservers).toBe(0);
});

test("a blocked real WASM load is visible and retry cleans up before a real shot", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  let blockedWasmRequests = 0;
  const blockWasm = async (route: Route): Promise<void> => {
    blockedWasmRequests += 1;
    await route.abort("failed");
  };
  await page.route("**/*.wasm*", blockWasm);
  await openDiagnostic(page);
  await assertAcceptedSceneFacts(page);

  const box = await canvasBoundsInsideViewport(page);
  const startX = box.x + box.width * 0.2;
  const startY = box.y + box.height * 0.78;
  const endX = startX + 64;
  const endY = startY - 32;
  assertPointerPointsInsideViewport(page, [
    { x: startX, y: startY },
    { x: endX, y: endY },
  ]);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 8 });
  await page.mouse.up();

  await expect(page.getByTestId("probe-error")).toContainText("Havok/WASM", {
    timeout: 30_000,
  });
  await expect.poll(() => blockedWasmRequests).toBeGreaterThan(0);
  await expect
    .poll(async () => {
      const state = await lifecycle(page);
      return [
        state.engines === state.baselineEngines,
        state.activeListeners === 0,
        state.activeResizeObservers === 0,
      ];
    })
    .toEqual([true, true, true]);
  await testInfo.attach("counterball-wasm-failure-teardown.json", {
    body: JSON.stringify(
      {
        blockedWasmRequests,
        error: await page.getByTestId("probe-error").textContent(),
        lifecycle: await lifecycle(page),
      },
      null,
      2,
    ),
    contentType: "application/json",
  });

  await page.unroute("**/*.wasm*", blockWasm);
  await page.getByRole("button", { name: "Retry WebGL and Havok" }).click();
  await expect(page.getByTestId("counterball-direct-probe")).toHaveAttribute(
    "data-phase",
    "ready",
    { timeout: 30_000 },
  );
  await assertAcceptedSceneFacts(page);
  await flickAndReadTrace(page, testInfo);
  await assertUnmountedAtBaseline(page);
  const finalLifecycle = await lifecycle(page);
  await testInfo.attach("counterball-retry-teardown.json", {
    body: JSON.stringify(finalLifecycle, null, 2),
    contentType: "application/json",
  });
  expect(finalLifecycle.engines).toBe(finalLifecycle.baselineEngines);
  expect(finalLifecycle.activeListeners).toBe(0);
  expect(finalLifecycle.activeResizeObservers).toBe(0);
});

test("the maximum synthetic transport streams through the browser download", async ({
  page,
}, testInfo) => {
  test.setTimeout(480_000);
  await openDiagnostic(page);

  await expect(page.getByTestId("loft-matrix-panel")).toBeVisible({
    timeout: 5_000,
  });
  await expect(
    page.getByRole("button", { name: "Write transport test file" }),
  ).toBeVisible({ timeout: 5_000 });
  const hostAcknowledgementAvailable = await page.evaluate(
    () =>
      typeof (window as WindowWithDirectProbe)
        .__counterballLoftMatrixHostAck === "function",
  );
  expect(hostAcknowledgementAvailable).toBe(true);

  const expectedSha256 = expectedTransportDigest();
  const status = page.getByTestId("loft-matrix-status");
  let hostPath: string | undefined;
  let browserDownload: Download | undefined;
  let hasPrimaryError = false;
  let primaryError: unknown;
  const cleanupErrors: unknown[] = [];

  try {
    await page
      .getByRole("button", { name: "Write transport test file" })
      .click();
    await expect
      .poll(
        async () => {
          const value = await status.textContent();
          return (
            value === TRANSPORT_READY_STATUS ||
            value === TRANSPORT_FAILED_STATUS
          );
        },
        { timeout: 300_000 },
      )
      .toBe(true);

    const statusText = await status.textContent();
    if (statusText !== TRANSPORT_READY_STATUS) {
      const error = await page.getByTestId("loft-matrix-error").textContent();
      const reason = error ?? statusText ?? "unknown failure";
      throw new Error(`The browser transport did not become ready: ${reason}`);
    }

    const outputText = await page
      .getByTestId("loft-matrix-export")
      .textContent();
    if (!outputText) {
      throw new Error("The transport export metadata is missing.");
    }
    const output = JSON.parse(outputText) as {
      phase: string;
      export: {
        runId: string;
        fileName: string;
        byteLength: number;
        kind: string;
        summary: {
          matrixBytes: number;
          chunkBytes: number;
          chunkCount: number;
          pattern: string;
        };
      };
    };
    expect(output.phase).toBe("ready");
    expect(output.export.kind).toBe("synthetic");
    expect(output.export.byteLength).toBe(TRANSPORT_BYTES);
    expect(output.export.fileName).toMatch(/^counterball-l01-[0-9a-f-]+\.bin$/);
    expect(output.export.runId).not.toBe("");
    expect(output.export.summary).toEqual({
      matrixBytes: TRANSPORT_BYTES,
      chunkBytes: TRANSPORT_CHUNK_BYTES,
      chunkCount: TRANSPORT_CHUNK_COUNT,
      pattern: "repeated-256-kib-block-byte-index-mod-251",
    });

    const downloadPromise = page.waitForEvent("download", {
      timeout: 60_000,
    });
    await page.getByRole("button", { name: "Download transport file" }).click();
    browserDownload = await downloadPromise;
    expect(browserDownload.suggestedFilename()).toBe(output.export.fileName);

    hostPath = testInfo.outputPath("counterball-transport-download.tmp");
    await browserDownload.saveAs(hostPath);
    const actual = await hashDownloadedFile(hostPath);
    expect(actual.byteLength).toBe(TRANSPORT_BYTES);
    expect(actual.sha256).toBe(expectedSha256);

    const attestation: LoftMatrixHostAttestation = {
      runId: output.export.runId,
      fileName: output.export.fileName,
      byteLength: actual.byteLength,
      sha256: actual.sha256,
    };
    const acknowledged = await page.evaluate(async (value) => {
      const acknowledge = (window as WindowWithDirectProbe)
        .__counterballLoftMatrixHostAck;
      return acknowledge ? acknowledge(value) : false;
    }, attestation);
    expect(acknowledged).toBe(true);
    await expect(status).toHaveText(
      "The host saved and verified the download; temporary storage was removed.",
    );
  } catch (error) {
    hasPrimaryError = true;
    primaryError = error;
  } finally {
    try {
      await cleanupBrowserTransport(page);
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      await browserDownload?.delete();
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (hostPath) {
      try {
        await rm(hostPath, { force: true });
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
  }

  if (hasPrimaryError) {
    if (cleanupErrors.length > 0) {
      throw new AggregateError(
        [primaryError, ...cleanupErrors],
        "The transport test failed and cleanup was incomplete.",
        { cause: primaryError },
      );
    }
    throw primaryError;
  }
  if (cleanupErrors.length > 0) {
    throw new AggregateError(
      cleanupErrors,
      "The transport test failed to remove every temporary file.",
    );
  }
});

test("the full real-Havok loft matrix downloads and passes bounded host validation", async ({
  page,
}, testInfo) => {
  test.setTimeout(1_100_000);
  await openDiagnostic(page);
  await expect(page.getByTestId("loft-matrix-panel")).toBeVisible({ timeout: 5_000 });

  const status = page.getByTestId("loft-matrix-status");
  let temporaryPath: string | undefined;
  let finalPath: string | undefined;
  let browserDownload: Download | undefined;
  let hasPrimaryError = false;
  let primaryError: unknown;
  let artifactAttached = false;
  const cleanupErrors: unknown[] = [];

  try {
    await page.getByRole("button", { name: "Run 24-case Havok matrix" }).click();
    await expect
      .poll(
        async () => {
          const text = await status.textContent();
          if (text === MATRIX_FAILED_STATUS) {
            const error = await page.getByTestId("loft-matrix-error").textContent();
            throw new Error(`The browser matrix failed before download: ${error ?? "unknown reason"}`);
          }
          return text;
        },
        { timeout: 780_000, intervals: [1_000, 3_000, 10_000] },
      )
      .toBe(MATRIX_READY_STATUS);

    const outputText = await page.getByTestId("loft-matrix-export").textContent();
    if (!outputText || Buffer.byteLength(outputText, "utf8") > MATRIX_METADATA_MAXIMUM_BYTES) {
      throw new Error("The compact browser matrix summary is missing or over its bound.");
    }
    const output = asRecord(JSON.parse(outputText) as unknown, "Browser export output");
    expect(output["phase"]).toBe("ready");
    const exportInfo = assertExactKeys(
      output["export"],
      ["runId", "fileName", "byteLength", "kind", "summary"],
      "Browser matrix export",
    );
    expect(exportInfo["kind"]).toBe("matrix");
    const runId = exportInfo["runId"];
    if (typeof runId !== "string" || !/^[0-9a-f-]{36}$/i.test(runId)) {
      throw new Error("The browser matrix run id is malformed.");
    }
    const fileName = `counterball-l01-${runId}.json`;
    expect(exportInfo["fileName"]).toBe(fileName);
    boundedInteger(exportInfo["byteLength"], 1, MATRIX_MAXIMUM_BYTES, "Browser matrix byteLength");
    const browserSummary = asRecord(exportInfo["summary"], "Browser matrix summary");

    const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
    await page.getByRole("button", { name: "Download matrix" }).click();
    browserDownload = await downloadPromise;
    expect(browserDownload.suggestedFilename()).toBe(fileName);

    await mkdir(testInfo.outputPath(), { recursive: true });
    temporaryPath = testInfo.outputPath("counterball-l01-matrix.json.tmp");
    finalPath = testInfo.outputPath("counterball-l01-matrix.json");
    await browserDownload.saveAs(temporaryPath);
    const validated = await validateMatrixFile(temporaryPath);
    expect(validated.digest.byteLength).toBeLessThanOrEqual(MATRIX_MAXIMUM_BYTES);
    expect(exportInfo["byteLength"]).toBe(validated.digest.byteLength);
    validateBrowserMatrixSummary(browserSummary, validated.totals, validated.identity);

    const attestation: LoftMatrixHostAttestation = {
      runId,
      fileName,
      byteLength: validated.digest.byteLength,
      sha256: validated.digest.sha256,
    };
    const acknowledged = await page.evaluate(async (value) => {
      const acknowledge = (window as WindowWithDirectProbe)
        .__counterballLoftMatrixHostAck;
      return acknowledge ? acknowledge(value) : false;
    }, attestation);
    expect(acknowledged).toBe(true);
    await expect(status).toHaveText(MATRIX_READY_ACK_STATUS, { timeout: 60_000 });
    await cleanupBrowserTransport(page);
    await browserDownload.delete();
    browserDownload = undefined;

    await rename(temporaryPath, finalPath);
    temporaryPath = undefined;
    await testInfo.attach("counterball-l01-matrix-host-validation.json", {
      body: JSON.stringify(
        {
          sha256: validated.digest.sha256,
          byteLength: validated.digest.byteLength,
          totals: validated.totals,
          identity: validated.identity,
          matrixTupleCount: EXPECTED_MATRIX_TUPLES.length,
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
    await testInfo.attach("counterball-l01-matrix.json", {
      path: finalPath,
      contentType: "application/json",
    });
    artifactAttached = true;
  } catch (error) {
    hasPrimaryError = true;
    primaryError = error;
  } finally {
    if (!artifactAttached) {
      try {
        await cleanupBrowserTransport(page);
      } catch (error) {
        cleanupErrors.push(error);
      }
      try {
        await browserDownload?.delete();
      } catch (error) {
        cleanupErrors.push(error);
      }
      for (const path of [temporaryPath, finalPath]) {
        if (path !== undefined) {
          try {
            await rm(path, { force: true });
          } catch (error) {
            cleanupErrors.push(error);
          }
        }
      }
    }
  }

  if (hasPrimaryError) {
    if (cleanupErrors.length > 0) {
      throw new AggregateError(
        [primaryError, ...cleanupErrors],
        "The matrix test failed and cleanup was incomplete.",
        { cause: primaryError },
      );
    }
    throw primaryError;
  }
  if (cleanupErrors.length > 0) {
    throw new AggregateError(cleanupErrors, "Matrix test cleanup failed.");
  }
  expect(artifactAttached).toBe(true);
});
