import { useEffect, useRef, useState } from "react";
import {
  COUNTERBALL_CONFIG_V1,
  Engine,
  EngineStore,
  createCounterballPresentation,
  createCounterballScene,
  runBrowserDirectProbe,
  runLoftCoarseMatrix,
  updateCounterballPresentation,
  type BodyState,
  type BrowserDirectProbeResult,
  type CounterballPieceRegistry,
  type LoftCoarseProgress,
  type LoftCoarseByteSink,
  type LoftCoarseRunSummary,
} from "@korre/counterball/browser";
import fixtureJson from "../../../tests/fixtures/counterball-v1.json";

type CounterballFixture = {
  states: { initial: { bodies: BodyState[] } };
};

type CounterballDirectProbeProps = {
  onNavigateHome: () => void;
};

type Phase = "starting" | "ready" | "running" | "complete" | "failed";

type LifecycleSnapshot = {
  baselineEngines: number;
  engines: number;
  activeListeners: number;
  activeResizeObservers: number;
  phase: Phase;
};

type WindowWithDirectProbe = Window & {
  __counterballDirectProbeLifecycle?: () => LifecycleSnapshot;
  /**
   * Development-only host acknowledgement. Playwright must call this only
   * after saving the download and checking its byte count and SHA-256.
   */
  __counterballLoftMatrixHostAck?: (
    attestation: LoftMatrixHostAttestation,
  ) => Promise<boolean>;
};

type PixelSnapshot = {
  width: number;
  height: number;
  pixels: Uint8Array;
};

type SceneFacts = {
  pieceCount: number;
  homeCaps: number;
  awayCaps: number;
  buttonCount: number;
  visibleButtonHoles: number;
  buttonBodyVertices: number;
  greenConcreteTexture: string | null;
  enclosingWallCount: number;
};

type ProbeTrace = {
  scope: BrowserDirectProbeResult["scope"];
  fixtureId: string;
  termination: BrowserDirectProbeResult["termination"];
  capId: BrowserDirectProbeResult["capId"];
  impulse: BrowserDirectProbeResult["impulse"];
  applicationPoint: BrowserDirectProbeResult["applicationPoint"];
  settledBodyCount: number;
  contactPairs: string[][];
  capMovement: number;
  buttonMovement: number;
  changedWebGlPixels: number;
  pixelWidth: number;
  pixelHeight: number;
};

type PointerStart = {
  pointerId: number;
  x: number;
  y: number;
};

type MatrixKind = "matrix" | "synthetic";
type MatrixPhase = "idle" | "running" | "ready" | "failed" | "acknowledged";

type LoftMatrixHostAttestation = Readonly<{
  runId: string;
  fileName: string;
  byteLength: number;
  sha256: string;
}>;

function isLoftMatrixHostAttestation(
  value: unknown,
): value is LoftMatrixHostAttestation {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return (
    keys.length === 4 &&
    keys[0] === "byteLength" &&
    keys[1] === "fileName" &&
    keys[2] === "runId" &&
    keys[3] === "sha256" &&
    typeof record["runId"] === "string" &&
    typeof record["fileName"] === "string" &&
    typeof record["byteLength"] === "number" &&
    typeof record["sha256"] === "string"
  );
}

type MatrixExportInfo = Readonly<{
  runId: string;
  fileName: string;
  byteLength: number;
  kind: MatrixKind;
  summary: LoftCoarseRunSummary | SyntheticTransportSummary;
}>;

type SyntheticTransportSummary = Readonly<{
  matrixBytes: number;
  chunkBytes: number;
  chunkCount: number;
  pattern: "repeated-256-kib-block-byte-index-mod-251";
}>;

type OpfsExportSession = {
  runId: string;
  fileName: string;
  kind: MatrixKind;
  expectedBytes: number;
  writtenBytes: number;
  signal: AbortSignal;
  directory?: FileSystemDirectoryHandle;
  fileHandle?: FileSystemFileHandle;
  writer?: FileSystemWritableFileStream;
  writerClosed: boolean;
  writerAbortAttempted: boolean;
  downloadStarted: boolean;
  abortListener?: (() => void) | undefined;
  objectUrl?: string | undefined;
  cleanupPromise?: Promise<void> | undefined;
  cleanupTimer?: number | undefined;
};

const MATRIX_MAXIMUM_BYTES =
  COUNTERBALL_CONFIG_V1.restartLoftDiagnosticGuard.artifact.maximumMatrixBytes;
const SYNTHETIC_TRANSPORT_BYTES = 504_365_056;
const OPFS_WRITE_CHUNK_BYTES = 256 * 1024;
const OPFS_ESTIMATE_HEADROOM_BYTES = 16 * 1024 * 1024;
const EXPORT_ACKNOWLEDGEMENT_TIMEOUT_MS = 15 * 60 * 1000;

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw signal.reason ?? new DOMException("The export was cancelled.", "AbortError");
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown browser export error.";
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "NotFoundError"
  );
}

async function cleanupOpfsExport(
  session: OpfsExportSession,
  reason: unknown,
): Promise<void> {
  if (session.cleanupPromise) return session.cleanupPromise;

  const operation = (async (): Promise<void> => {
    const cleanupErrors: unknown[] = [];
    if (session.abortListener) {
      session.signal.removeEventListener("abort", session.abortListener);
      session.abortListener = undefined;
    }
    if (
      session.writer &&
      !session.writerClosed &&
      !session.writerAbortAttempted
    ) {
      session.writerAbortAttempted = true;
      try {
        await session.writer.abort(reason);
        session.writerClosed = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (session.cleanupTimer !== undefined) {
      window.clearTimeout(session.cleanupTimer);
      session.cleanupTimer = undefined;
    }
    if (session.objectUrl) {
      URL.revokeObjectURL(session.objectUrl);
      session.objectUrl = undefined;
    }
    if (session.directory) {
      try {
        await session.directory.removeEntry(session.fileName);
      } catch (error) {
        if (!isNotFoundError(error)) cleanupErrors.push(error);
      }
    }
    if (cleanupErrors.length > 0) {
      throw new AggregateError(
        cleanupErrors,
        "One or more temporary browser-export cleanup steps failed.",
      );
    }
  })();

  session.cleanupPromise = operation;
  try {
    await operation;
  } catch (error) {
    session.cleanupPromise = undefined;
    throw error;
  }
}

async function openOpfsExport(
  kind: MatrixKind,
  expectedBytes: number,
  signal: AbortSignal,
): Promise<OpfsExportSession> {
  if (
    !Number.isSafeInteger(expectedBytes) ||
    expectedBytes <= 0 ||
    expectedBytes > MATRIX_MAXIMUM_BYTES
  ) {
    throw new Error(
      "The requested export size is outside the hashed matrix cap.",
    );
  }
  const session: OpfsExportSession = {
    runId: globalThis.crypto.randomUUID(),
    fileName: "",
    kind,
    expectedBytes,
    writtenBytes: 0,
    signal,
    writerClosed: false,
    writerAbortAttempted: false,
    downloadStarted: false,
  };
  const extension = kind === "matrix" ? "json" : "bin";
  session.fileName = `counterball-l01-${session.runId}.${extension}`;

  try {
    throwIfAborted(signal);
    const storage = navigator.storage;
    if (
      typeof storage?.estimate !== "function" ||
      typeof storage.getDirectory !== "function"
    ) {
      throw new Error("This browser does not provide the required OPFS APIs.");
    }
    const estimate = await storage.estimate();
    throwIfAborted(signal);
    const quota = estimate.quota;
    const usage = estimate.usage;
    if (
      typeof quota !== "number" ||
      typeof usage !== "number" ||
      !Number.isFinite(quota) ||
      !Number.isFinite(usage) ||
      quota < usage
    ) {
      throw new Error("The browser returned an invalid storage estimate.");
    }
    const availableBytes = quota - usage;
    if (
      availableBytes <
      expectedBytes + OPFS_ESTIMATE_HEADROOM_BYTES
    ) {
      throw new Error(
        "Estimated OPFS space is below the export size plus safety headroom.",
      );
    }
    session.directory = await storage.getDirectory();
    throwIfAborted(signal);
    session.fileHandle = await session.directory.getFileHandle(
      session.fileName,
      { create: true },
    );
    throwIfAborted(signal);
    session.writer = await session.fileHandle.createWritable({
      keepExistingData: false,
    });
    const abortListener = (): void => {
      void cleanupOpfsExport(
        session,
        signal.reason ?? new DOMException("The export was cancelled.", "AbortError"),
      ).catch(() => undefined);
    };
    session.abortListener = abortListener;
    signal.addEventListener("abort", abortListener, { once: true });
    throwIfAborted(signal);
    return session;
  } catch (error) {
    try {
      await cleanupOpfsExport(session, error);
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "OPFS setup failed and cleanup was incomplete.",
        { cause: cleanupError },
      );
    }
    throw error;
  }
}

async function writeOpfsChunk(
  session: OpfsExportSession,
  chunk: Uint8Array,
): Promise<void> {
  throwIfAborted(session.signal);
  if (!session.writer || session.writerClosed) {
    throw new Error("The OPFS export writer is not open.");
  }
  if (
    chunk.byteLength === 0 ||
    chunk.byteLength > OPFS_WRITE_CHUNK_BYTES ||
    session.writtenBytes + chunk.byteLength > session.expectedBytes
  ) {
    throw new Error("The OPFS chunk exceeds its bounded export contract.");
  }
  const fileChunk = new Uint8Array(chunk.byteLength);
  fileChunk.set(chunk);
  await session.writer.write(fileChunk);
  session.writtenBytes += chunk.byteLength;
  throwIfAborted(session.signal);
}

async function finalizeOpfsExport(session: OpfsExportSession): Promise<File> {
  throwIfAborted(session.signal);
  if (
    !session.writer ||
    !session.fileHandle ||
    session.writerClosed ||
    session.writtenBytes !== session.expectedBytes
  ) {
    throw new Error("The export is incomplete and cannot be finalized.");
  }
  await session.writer.close();
  session.writerClosed = true;
  throwIfAborted(session.signal);
  const file = await session.fileHandle.getFile();
  if (file.size !== session.expectedBytes) {
    throw new Error("The finalized OPFS file has an unexpected byte length.");
  }
  return file;
}

async function writeSyntheticTransport(
  session: OpfsExportSession,
): Promise<SyntheticTransportSummary> {
  if (session.expectedBytes !== SYNTHETIC_TRANSPORT_BYTES) {
    throw new Error(
      "The transport diagnostic must use its exact 504,365,056-byte size.",
    );
  }
  const chunk = new Uint8Array(OPFS_WRITE_CHUNK_BYTES);
  for (let index = 0; index < chunk.length; index += 1) {
    chunk[index] = index % 251;
  }
  let chunkCount = 0;
  while (session.writtenBytes < session.expectedBytes) {
    await writeOpfsChunk(session, chunk);
    chunkCount += 1;
  }
  if (chunkCount !== 1_924) {
    throw new Error("The synthetic transport used an unexpected chunk count.");
  }
  return {
    matrixBytes: session.writtenBytes,
    chunkBytes: OPFS_WRITE_CHUNK_BYTES,
    chunkCount,
    pattern: "repeated-256-kib-block-byte-index-mod-251",
  };
}

const fixture = fixtureJson as CounterballFixture;
const initialBodies = fixture.states.initial.bodies;
const MIN_FLICK_PIXELS = 24;
const MAX_FLICK_PIXELS = 240;
const MAX_DEVICE_PIXEL_RATIO = 1.5;

function distanceBetween(
  first: Pick<BodyState, "position">,
  second: Pick<BodyState, "position">,
): number {
  return Math.hypot(
    second.position.x - first.position.x,
    second.position.y - first.position.y,
    second.position.z - first.position.z,
  );
}

function captureWebGlPixels(gl: WebGL2RenderingContext): PixelSnapshot {
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  if (width <= 0 || height <= 0) {
    throw new Error("The WebGL drawing surface has no readable pixels.");
  }
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  const error = gl.getError();
  if (error !== gl.NO_ERROR) {
    throw new Error(`WebGL pixel capture failed with error ${error}.`);
  }
  return { width, height, pixels };
}

function countChangedPixels(
  before: PixelSnapshot,
  after: PixelSnapshot,
): number {
  if (before.width !== after.width || before.height !== after.height) {
    throw new Error("The WebGL surface changed size during the shot.");
  }
  let changed = 0;
  for (let offset = 0; offset < before.pixels.length; offset += 4) {
    if (
      Math.abs((before.pixels[offset] ?? 0) - (after.pixels[offset] ?? 0)) >
        3 ||
      Math.abs(
        (before.pixels[offset + 1] ?? 0) - (after.pixels[offset + 1] ?? 0),
      ) > 3 ||
      Math.abs(
        (before.pixels[offset + 2] ?? 0) - (after.pixels[offset + 2] ?? 0),
      ) > 3
    ) {
      changed += 1;
    }
  }
  return changed;
}

function readDiffuseTextureName(material: unknown): string | null {
  if (
    typeof material !== "object" ||
    material === null ||
    !("diffuseTexture" in material)
  ) {
    return null;
  }
  const texture = (material as { readonly diffuseTexture?: unknown })
    .diffuseTexture;
  if (typeof texture !== "object" || texture === null || !("name" in texture)) {
    return null;
  }
  const name = (texture as { readonly name?: unknown }).name;
  return typeof name === "string" ? name : null;
}

function createSceneFacts(
  scene: ReturnType<typeof createCounterballScene>,
  registry: CounterballPieceRegistry,
): SceneFacts {
  const homeCaps = initialBodies.filter((body) => body.id.startsWith("home-"));
  const awayCaps = initialBodies.filter((body) => body.id.startsWith("away-"));
  const button = registry.get("button");
  const ground = scene.getMeshByName("counterball-open-concrete-apron");
  const concreteMaterial = ground?.material;
  const greenConcreteTexture =
    concreteMaterial?.name === "counterball-concrete"
      ? readDiffuseTextureName(concreteMaterial)
      : null;
  const enclosingWallCount = scene.meshes.filter((mesh) =>
    /(?:^|[- ])wall(?:$|[- ])/i.test(mesh.name),
  ).length;

  if (
    homeCaps.length !== 7 ||
    awayCaps.length !== 7 ||
    !button ||
    button.kind !== "button" ||
    button.holes.length !== 4 ||
    button.bodyMesh.getTotalVertices() === 0 ||
    greenConcreteTexture !== "counterball-green-concrete-grain" ||
    enclosingWallCount !== 0
  ) {
    throw new Error(
      "The diagnostic scene is missing the accepted open-pitch, seven-cap, four-hole fixture.",
    );
  }

  return {
    pieceCount: initialBodies.length,
    homeCaps: homeCaps.length,
    awayCaps: awayCaps.length,
    buttonCount: initialBodies.filter((body) => body.id === "button").length,
    visibleButtonHoles: button.holes.length,
    buttonBodyVertices: button.bodyMesh.getTotalVertices(),
    greenConcreteTexture,
    enclosingWallCount,
  };
}

export default function CounterballDirectProbe({
  onNavigateHome,
}: CounterballDirectProbeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("starting");
  const [status, setStatus] = useState("Preparing the real browser scene.");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sceneFacts, setSceneFacts] = useState<SceneFacts | null>(null);
  const [trace, setTrace] = useState<ProbeTrace | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [matrixPhase, setMatrixPhase] = useState<MatrixPhase>("idle");
  const [matrixProgress, setMatrixProgress] =
    useState<LoftCoarseProgress | null>(null);
  const [matrixExport, setMatrixExport] =
    useState<MatrixExportInfo | null>(null);
  const [matrixError, setMatrixError] = useState<string | null>(null);
  const runMatrixActionRef = useRef<((kind: MatrixKind) => void) | null>(null);
  const cancelMatrixActionRef = useRef<(() => void) | null>(null);
  const downloadMatrixActionRef = useRef<(() => void) | null>(null);
  const discardMatrixActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let currentPhase: Phase = "starting";
    let engine: Engine | undefined;
    let scene: ReturnType<typeof createCounterballScene> | undefined;
    let presentation: CounterballPieceRegistry | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let baselinePixels: PixelSnapshot | undefined;
    let pendingPointer: PointerStart | undefined;
    let probeStarted = false;
    let activeResizeObservers = 0;
    let disposed = false;
    let renderingDisposed = false;
    let activeListeners = 0;
    let matrixController: AbortController | undefined;
    let matrixRunPromise: Promise<void> | undefined;
    let activeMatrixSession: OpfsExportSession | undefined;
    let pendingMatrixDownload: OpfsExportSession | undefined;
    const listenerDisposers: Array<() => void> = [];
    const abortController = new AbortController();
    const browserWindow = window as WindowWithDirectProbe;
    const baselineEngines = EngineStore.Instances.length;
    const lifecycle = (): LifecycleSnapshot => ({
      baselineEngines,
      engines: EngineStore.Instances.length,
      activeListeners,
      activeResizeObservers,
      phase: currentPhase,
    });
    browserWindow.__counterballDirectProbeLifecycle = lifecycle;

    const setCurrentPhase = (next: Phase): void => {
      currentPhase = next;
      setPhase(next);
    };

    const listen = (
      target: EventTarget,
      type: string,
      listener: EventListener,
    ): void => {
      target.addEventListener(type, listener);
      activeListeners += 1;
      listenerDisposers.push(() => {
        target.removeEventListener(type, listener);
        activeListeners -= 1;
      });
    };

    const disposeRenderingResources = (): void => {
      if (renderingDisposed) return;
      renderingDisposed = true;
      scene?.dispose();
      engine?.dispose();
      scene = undefined;
      engine = undefined;
      presentation = undefined;
    };

    const discardPendingMatrix = async (
      session: OpfsExportSession,
      reason: unknown,
    ): Promise<void> => {
      await cleanupOpfsExport(session, reason);
      if (pendingMatrixDownload === session) pendingMatrixDownload = undefined;
      if (activeMatrixSession === session) activeMatrixSession = undefined;
      if (!disposed) {
        setMatrixExport(null);
        setMatrixPhase("idle");
        setMatrixProgress(null);
      }
    };

    const hostAcknowledge = async (
      value: unknown,
    ): Promise<boolean> => {
      if (!import.meta.env.DEV || !isLoftMatrixHostAttestation(value)) return false;
      const attestation = value;
      const session = pendingMatrixDownload;
      if (
        !session ||
        attestation.runId !== session.runId ||
        attestation.fileName !== session.fileName ||
        attestation.byteLength !== session.expectedBytes ||
        !Number.isSafeInteger(attestation.byteLength) ||
        !/^[0-9a-f]{64}$/.test(attestation.sha256) ||
        session.writtenBytes !== session.expectedBytes ||
        !session.downloadStarted ||
        !session.writerClosed
      ) {
        return false;
      }
      try {
        await discardPendingMatrix(
          session,
          new Error("The host saved and verified the exported file."),
        );
        if (!disposed) setMatrixPhase("acknowledged");
        return true;
      } catch (error) {
        if (!disposed) {
          setMatrixError(
            `The verified export could not be cleaned up: ${describeError(error)}`,
          );
          setMatrixPhase("failed");
        }
        return false;
      }
    };

    if (import.meta.env.DEV) {
      browserWindow.__counterballLoftMatrixHostAck = hostAcknowledge;
    }

    const dispose = (): void => {
      if (disposed) return;
      disposed = true;
      abortController.abort();
      matrixController?.abort(
        new DOMException("The diagnostic page was unmounted.", "AbortError"),
      );
      pendingPointer = undefined;
      resizeObserver?.disconnect();
      activeResizeObservers = 0;
      while (listenerDisposers.length > 0) {
        listenerDisposers.pop()?.();
      }
      const sessions = new Set<OpfsExportSession>();
      if (activeMatrixSession) sessions.add(activeMatrixSession);
      if (pendingMatrixDownload) sessions.add(pendingMatrixDownload);
      for (const session of sessions) {
        void cleanupOpfsExport(
          session,
          new DOMException("The diagnostic page was unmounted.", "AbortError"),
        ).catch(() => undefined);
      }
      if (browserWindow.__counterballLoftMatrixHostAck === hostAcknowledge) {
        delete browserWindow.__counterballLoftMatrixHostAck;
      }
      runMatrixActionRef.current = null;
      cancelMatrixActionRef.current = null;
      downloadMatrixActionRef.current = null;
      discardMatrixActionRef.current = null;
      if (matrixRunPromise) {
        void matrixRunPromise.then(
          disposeRenderingResources,
          disposeRenderingResources,
        );
      } else {
        disposeRenderingResources();
      }
    };

    const downloadPendingMatrix = (): void => {
      const session = pendingMatrixDownload;
      if (!session?.objectUrl || disposed) return;
      session.downloadStarted = true;
      const anchor = document.createElement("a");
      anchor.href = session.objectUrl;
      anchor.download = session.fileName;
      anchor.hidden = true;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    };

    const runMatrix = async (kind: MatrixKind): Promise<void> => {
      if (
        disposed ||
        !engine ||
        matrixController ||
        pendingMatrixDownload ||
        (currentPhase !== "ready" && currentPhase !== "complete")
      ) {
        return;
      }
      const controller = new AbortController();
      matrixController = controller;
      const activeEngine = engine;
      const expectedBytes =
        kind === "matrix" ? MATRIX_MAXIMUM_BYTES : SYNTHETIC_TRANSPORT_BYTES;
      let session: OpfsExportSession | undefined;
      setMatrixError(null);
      setMatrixExport(null);
      setMatrixProgress(null);
      setMatrixPhase("running");

      try {
        if (kind === "synthetic" && MATRIX_MAXIMUM_BYTES !== SYNTHETIC_TRANSPORT_BYTES) {
          throw new Error(
            "The synthetic transport size no longer matches the canonical matrix cap.",
          );
        }
        const exportSession = await openOpfsExport(
          kind,
          expectedBytes,
          controller.signal,
        );
        session = exportSession;
        activeMatrixSession = exportSession;
        let summary: LoftCoarseRunSummary | SyntheticTransportSummary;
        if (kind === "matrix") {
          const sink: LoftCoarseByteSink = {
            write: (chunk) => writeOpfsChunk(exportSession, chunk),
            abort: (reason) => cleanupOpfsExport(exportSession, reason),
          };
          summary = await runLoftCoarseMatrix({
            engine: activeEngine,
            signal: controller.signal,
            sink,
            onProgress: (progress) => {
              if (!disposed && !controller.signal.aborted) {
                setMatrixProgress({ ...progress });
              }
            },
          });
          if (summary.matrixBytes !== exportSession.writtenBytes) {
            throw new Error(
              "The L01 summary byte count differs from the completed OPFS writes.",
            );
          }
        } else {
          summary = await writeSyntheticTransport(exportSession);
        }
        throwIfAborted(controller.signal);
        const file = await finalizeOpfsExport(exportSession);
        exportSession.objectUrl = URL.createObjectURL(file);
        pendingMatrixDownload = exportSession;
        activeMatrixSession = undefined;
        exportSession.cleanupTimer = window.setTimeout(() => {
          void discardPendingMatrix(
            exportSession,
            new Error("The browser export acknowledgement expired."),
          ).catch((error: unknown) => {
            if (!disposed) {
              setMatrixError(
                `Temporary export cleanup failed: ${describeError(error)}`,
              );
              setMatrixPhase("failed");
            }
          });
        }, EXPORT_ACKNOWLEDGEMENT_TIMEOUT_MS);
        setMatrixExport({
          runId: exportSession.runId,
          fileName: exportSession.fileName,
          byteLength: exportSession.writtenBytes,
          kind,
          summary,
        });
        setMatrixPhase("ready");
      } catch (error) {
        let reportedError: unknown = error;
        if (session) {
          try {
            await cleanupOpfsExport(session, error);
          } catch (cleanupError) {
            reportedError = new AggregateError(
              [error, cleanupError],
              "The export failed and temporary-file cleanup was incomplete.",
            );
          }
        }
        if (pendingMatrixDownload === session) pendingMatrixDownload = undefined;
        if (activeMatrixSession === session) activeMatrixSession = undefined;
        if (!disposed) {
          setMatrixError(describeError(reportedError));
          setMatrixPhase("failed");
        }
      } finally {
        if (matrixController === controller) matrixController = undefined;
      }
    };

    const startMatrix = (kind: MatrixKind): void => {
      const operation = runMatrix(kind);
      matrixRunPromise = operation;
      const settle = (): void => {
        if (matrixRunPromise === operation) matrixRunPromise = undefined;
        if (disposed) disposeRenderingResources();
      };
      void operation.then(settle, settle);
    };

    runMatrixActionRef.current = startMatrix;
    cancelMatrixActionRef.current = () => {
      matrixController?.abort(
        new DOMException("The export was cancelled by the operator.", "AbortError"),
      );
    };
    downloadMatrixActionRef.current = downloadPendingMatrix;
    discardMatrixActionRef.current = () => {
      const session = pendingMatrixDownload;
      if (!session) return;
      void discardPendingMatrix(
        session,
        new Error("The browser export was discarded by the operator."),
      ).catch((error: unknown) => {
        if (!disposed) {
          setMatrixError(`Temporary export cleanup failed: ${describeError(error)}`);
          setMatrixPhase("failed");
        }
      });
    };

    const fail = (message: string): void => {
      if (disposed) return;
      setErrorMessage(`Real browser Havok/WASM diagnostic failed: ${message}`);
      setStatus("The diagnostic stopped. Retry to rebuild WebGL and Havok.");
      setCurrentPhase("failed");
      dispose();
    };

    const render = (): void => {
      if (disposed || !scene || !engine) return;
      engine.resize();
      scene.render();
      if (!probeStarted) {
        const gl = canvas.getContext("webgl2");
        if (!gl) throw new Error("WebGL 2 is unavailable for pixel evidence.");
        baselinePixels = captureWebGlPixels(gl);
      }
    };

    const onResize: EventListener = () => {
      try {
        render();
      } catch (error) {
        fail(error instanceof Error ? error.message : "WebGL resize failed.");
      }
    };

    const onContextLost: EventListener = (event) => {
      event.preventDefault();
      fail("The WebGL context was lost. Retry after the browser restores it.");
    };

    const triggerProbe = async (): Promise<void> => {
      if (
        disposed ||
        probeStarted ||
        matrixController !== undefined ||
        currentPhase !== "ready" ||
        !engine ||
        !scene ||
        !presentation
      ) {
        return;
      }
      probeStarted = true;
      pendingPointer = undefined;
      setErrorMessage(null);
      setStatus(
        "Running the fixed D01 diagnostic impulse in pinned browser Havok/WASM…",
      );
      setCurrentPhase("running");

      try {
        const activeEngine = engine;
        const activeScene = scene;
        const activePresentation = presentation;
        const pixelsBefore = baselinePixels;
        if (!pixelsBefore) {
          throw new Error("No initial WebGL pixel frame was captured.");
        }
        const result = await runBrowserDirectProbe(activeEngine, {
          signal: abortController.signal,
        });
        if (disposed || abortController.signal.aborted) return;

        const startCap = initialBodies.find((body) => body.id === result.capId);
        const endCap = result.settledBodies.find(
          (body) => body.id === result.capId,
        );
        const startButton = initialBodies.find((body) => body.id === "button");
        const endButton = result.settledBodies.find(
          (body) => body.id === "button",
        );
        if (!startCap || !endCap || !startButton || !endButton) {
          throw new Error("The diagnostic omitted a canonical shot body.");
        }
        if (result.settledBodies.length !== initialBodies.length) {
          throw new Error(
            "The diagnostic did not return all 15 settled bodies.",
          );
        }

        const capMovement = distanceBetween(startCap, endCap);
        const buttonMovement = distanceBetween(startButton, endButton);
        const contactedButton = result.contacts.some(
          ({ pair }) => pair.includes(result.capId) && pair.includes("button"),
        );
        if (capMovement <= 0.0001 || buttonMovement <= 0.0001) {
          throw new Error(
            "The measured shot did not move both the selected cap and button.",
          );
        }
        if (!contactedButton) {
          throw new Error(
            "Havok did not record contact between the selected cap and button.",
          );
        }

        updateCounterballPresentation(
          activePresentation,
          result.settledBodies.map(({ id, position, rotation }) => ({
            id,
            position,
            rotation,
          })),
        );
        activeScene.render();
        const gl = canvas.getContext("webgl2");
        if (!gl)
          throw new Error("WebGL 2 was lost before final pixel capture.");
        const pixelsAfter = captureWebGlPixels(gl);
        const changedWebGlPixels = countChangedPixels(
          pixelsBefore,
          pixelsAfter,
        );
        if (changedWebGlPixels === 0) {
          throw new Error(
            "The rendered WebGL pixels did not change after the settled transforms were applied.",
          );
        }

        setTrace({
          scope: result.scope,
          fixtureId: result.fixtureId,
          termination: result.termination,
          capId: result.capId,
          impulse: result.impulse,
          applicationPoint: result.applicationPoint,
          settledBodyCount: result.settledBodies.length,
          contactPairs: result.contacts.map(({ pair }) => pair),
          capMovement,
          buttonMovement,
          changedWebGlPixels,
          pixelWidth: pixelsAfter.width,
          pixelHeight: pixelsAfter.height,
        });
        setStatus(
          "The real browser shot settled. The button and cap moved, and WebGL pixels changed.",
        );
        setCurrentPhase("complete");
      } catch (error) {
        if (disposed || abortController.signal.aborted) return;
        fail(error instanceof Error ? error.message : "Unknown Havok failure.");
      }
    };

    const onPointerDown: EventListener = (event) => {
      if (!(event instanceof PointerEvent)) return;
      if (
        disposed ||
        currentPhase !== "ready" ||
        matrixController !== undefined ||
        (event.pointerType === "mouse" && event.button !== 0) ||
        pendingPointer
      ) {
        return;
      }
      event.preventDefault();
      pendingPointer = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        pendingPointer = undefined;
        setStatus("Pointer capture failed. Try the flick again.");
      }
    };

    const onPointerUp: EventListener = (event) => {
      if (!(event instanceof PointerEvent)) return;
      const start = pendingPointer;
      if (!start || event.pointerId !== start.pointerId) return;
      pendingPointer = undefined;
      const flickLength = Math.hypot(
        event.clientX - start.x,
        event.clientY - start.y,
      );
      if (flickLength < MIN_FLICK_PIXELS || flickLength > MAX_FLICK_PIXELS) {
        setStatus(
          `Use one deliberate drag between ${MIN_FLICK_PIXELS} and ${MAX_FLICK_PIXELS} pixels. This only triggers the fixed measured shot.`,
        );
        return;
      }
      void triggerProbe();
    };

    const onPointerCancel: EventListener = (event) => {
      if (!(event instanceof PointerEvent)) return;
      if (pendingPointer?.pointerId === event.pointerId) {
        pendingPointer = undefined;
        setStatus("The flick was cancelled. No shot was run.");
      }
    };

    const onLostPointerCapture: EventListener = (event) => {
      if (!(event instanceof PointerEvent)) return;
      if (pendingPointer?.pointerId === event.pointerId) {
        pendingPointer = undefined;
        setStatus("Pointer capture ended. No shot was run.");
      }
    };

    try {
      setErrorMessage(null);
      setTrace(null);
      setSceneFacts(null);
      setMatrixPhase("idle");
      setMatrixProgress(null);
      setMatrixExport(null);
      setMatrixError(null);
      setStatus("Preparing the real browser scene.");
      setCurrentPhase("starting");

      const webGlContext = canvas.getContext("webgl2", {
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
        stencil: true,
      });
      if (!webGlContext) throw new Error("WebGL 2 is not supported.");

      engine = new Engine(
        canvas,
        true,
        {
          preserveDrawingBuffer: true,
          stencil: true,
          doNotHandleContextLost: true,
          limitDeviceRatio: MAX_DEVICE_PIXEL_RATIO,
        },
        true,
      );
      scene = createCounterballScene(engine);
      presentation = createCounterballPresentation(scene, initialBodies);
      const facts = createSceneFacts(scene, presentation);
      setSceneFacts(facts);

      listen(window, "resize", onResize);
      listen(canvas, "pointerdown", onPointerDown);
      listen(canvas, "pointerup", onPointerUp);
      listen(canvas, "pointercancel", onPointerCancel);
      listen(canvas, "lostpointercapture", onLostPointerCapture);
      listen(canvas, "webglcontextlost", onContextLost);
      resizeObserver = new ResizeObserver(() => onResize(new Event("resize")));
      resizeObserver.observe(canvas);
      activeResizeObservers = 1;

      engine.resize();
      scene.render();
      baselinePixels = captureWebGlPixels(webGlContext);
      setStatus(
        `Drag ${MIN_FLICK_PIXELS}–${MAX_FLICK_PIXELS} pixels across the pitch to trigger one fixed diagnostic shot.`,
      );
      setCurrentPhase("ready");
    } catch (error) {
      fail(
        error instanceof Error ? error.message : "The scene could not start.",
      );
    }

    return () => {
      dispose();
    };
  }, [attempt]);

  const retry = (): void => {
    setTrace(null);
    setSceneFacts(null);
    setAttempt((current) => current + 1);
  };

  return (
    <main
      id="main"
      data-testid="counterball-direct-probe"
      data-phase={phase}
      style={{
        boxSizing: "border-box",
        margin: "0 auto",
        maxWidth: 1200,
        padding: "24px clamp(16px, 4vw, 48px) 48px",
        color: "#f7f1df",
        background: "#123c31",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, letterSpacing: ".12em" }}>
            COUNTERBALL · DEVELOPMENT DIAGNOSTIC
          </p>
          <h1 style={{ margin: "8px 0 0", fontSize: "clamp(28px, 5vw, 48px)" }}>
            One real browser flick
          </h1>
        </div>
        <button type="button" onClick={onNavigateHome}>
          Back to Counterball
        </button>
      </header>

      <section
        aria-label="Diagnostic instructions"
        style={{
          border: "1px solid #87b38a",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          background: "#194b3d",
        }}
      >
        <strong>Diagnostic only · not playable</strong>
        <p style={{ marginBottom: 0 }}>
          Drag across the pitch by {MIN_FLICK_PIXELS}–{MAX_FLICK_PIXELS} pixels.
          The gesture only starts the fixed, measured D01 impulse. Direction and
          distance do not set gameplay aim or power. There is no score, match,
          public play, or identity bypass here.
        </p>
      </section>

      <p role="status" aria-live="polite" data-testid="probe-status">
        {status}
      </p>
      {import.meta.env.DEV ? (
        <section
          aria-labelledby="loft-matrix-title"
          data-testid="loft-matrix-panel"
          style={{
            border: "1px solid #87b38a",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            background: "#194b3d",
          }}
        >
          <h2 id="loft-matrix-title" style={{ marginTop: 0 }}>
            Restart-loft diagnostic export
          </h2>
          <p>
            This separate development diagnostic runs the fixed 24-case
            real-Havok matrix. It is not a match or a gameplay control. The
            transport action writes a deterministic full-size test file.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              data-testid="loft-matrix-run"
              disabled={
                (phase !== "ready" && phase !== "complete") ||
                matrixPhase === "running" ||
                matrixPhase === "ready"
              }
              onClick={() => runMatrixActionRef.current?.("matrix")}
            >
              Run 24-case Havok matrix
            </button>
            <button
              type="button"
              data-testid="loft-matrix-synthetic"
              disabled={
                (phase !== "ready" && phase !== "complete") ||
                matrixPhase === "running" ||
                matrixPhase === "ready"
              }
              onClick={() => runMatrixActionRef.current?.("synthetic")}
            >
              Write transport test file
            </button>
            {matrixPhase === "running" ? (
              <button
                type="button"
                data-testid="loft-matrix-cancel"
                onClick={() => cancelMatrixActionRef.current?.()}
              >
                Cancel export
              </button>
            ) : null}
            {matrixPhase === "ready" && matrixExport !== null ? (
              <>
                <button
                  type="button"
                  data-testid="loft-matrix-download"
                  onClick={() => downloadMatrixActionRef.current?.()}
                >
                  Download {matrixExport.kind === "matrix" ? "matrix" : "transport file"}
                </button>
                <button
                  type="button"
                  data-testid="loft-matrix-discard"
                  onClick={() => discardMatrixActionRef.current?.()}
                >
                  Discard temporary export
                </button>
              </>
            ) : null}
          </div>
          <p role="status" aria-live="polite" data-testid="loft-matrix-status">
            {matrixPhase === "running"
              ? `Export running${matrixProgress ? ` · ${matrixProgress.completedCases}/${matrixProgress.totalCases} cases · ${matrixProgress.executeStepCalls.toLocaleString()} calls` : ""}.`
              : matrixPhase === "ready"
                ? "The bounded OPFS file is complete and ready to download."
                : matrixPhase === "acknowledged"
                  ? "The host saved and verified the download; temporary storage was removed."
                  : matrixPhase === "failed"
                    ? "The export failed and no successful download is available."
                    : "Ready for a separate diagnostic export."}
          </p>
          {matrixError === null ? null : (
            <p role="alert" data-testid="loft-matrix-error">
              {matrixError}
            </p>
          )}
          {matrixExport === null ? null : (
            <output
              data-testid="loft-matrix-export"
              style={{ display: "block", overflowWrap: "anywhere" }}
            >
              {JSON.stringify({
                phase: matrixPhase,
                progress: matrixProgress,
                export: matrixExport,
              })}
            </output>
          )}
          {matrixExport === null && matrixProgress !== null ? (
            <output
              data-testid="loft-matrix-progress"
              style={{ display: "block" }}
            >
              {JSON.stringify(matrixProgress)}
            </output>
          ) : null}
        </section>
      ) : null}
      {errorMessage === null ? null : (
        <div role="alert" data-testid="probe-error">
          <p>{errorMessage}</p>
          <button type="button" onClick={retry}>
            Retry WebGL and Havok
          </button>
        </div>
      )}

      <div
        style={{
          overflow: "hidden",
          border: "1px solid #87b38a",
          borderRadius: 12,
          background: "#456f49",
        }}
      >
        <canvas
          ref={canvasRef}
          aria-label="Open green concrete pitch with seven caps per side and a four-hole clothing button"
          data-testid="counterball-canvas"
          style={{
            width: "100%",
            height: "min(68vh, 640px)",
            minHeight: 320,
            display: "block",
            touchAction: "none",
            outline: "none",
          }}
        />
      </div>

      {sceneFacts === null ? null : (
        <output
          data-testid="scene-facts"
          style={{ display: "block", marginTop: 12, fontSize: 14 }}
        >
          {JSON.stringify(sceneFacts)}
        </output>
      )}
      {trace === null ? null : (
        <section aria-labelledby="probe-trace-title" style={{ marginTop: 16 }}>
          <h2 id="probe-trace-title">Measured browser result</h2>
          <p>
            {trace.settledBodyCount} settled bodies ·{" "}
            {trace.contactPairs.length} recorded contacts ·{" "}
            {trace.changedWebGlPixels.toLocaleString()} real WebGL pixels
            changed.
          </p>
          <pre
            data-testid="probe-result"
            style={{
              overflowX: "auto",
              padding: 12,
              borderRadius: 8,
              background: "#09251e",
              color: "#f7f1df",
              fontSize: 12,
            }}
          >
            {JSON.stringify(trace, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}
