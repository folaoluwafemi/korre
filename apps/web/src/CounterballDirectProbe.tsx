import { StandardMaterial } from "@babylonjs/core";
import { useEffect, useRef, useState } from "react";
import {
  Engine,
  EngineStore,
  createCounterballPresentation,
  createCounterballScene,
  runBrowserDirectProbe,
  updateCounterballPresentation,
  type BodyState,
  type BrowserDirectProbeResult,
  type CounterballPieceRegistry,
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
    concreteMaterial instanceof StandardMaterial
      ? (concreteMaterial.diffuseTexture?.name ?? null)
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
    let activeListeners = 0;
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

    const dispose = (): void => {
      if (disposed) return;
      disposed = true;
      abortController.abort();
      pendingPointer = undefined;
      resizeObserver?.disconnect();
      activeResizeObservers = 0;
      while (listenerDisposers.length > 0) {
        listenerDisposers.pop()?.();
      }
      scene?.dispose();
      engine?.dispose();
      scene = undefined;
      engine = undefined;
      presentation = undefined;
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
        const startButton = initialBodies.find(
          (body) => body.id === "button",
        );
        const endButton = result.settledBodies.find(
          (body) => body.id === "button",
        );
        if (!startCap || !endCap || !startButton || !endButton) {
          throw new Error("The diagnostic omitted a canonical shot body.");
        }
        if (result.settledBodies.length !== initialBodies.length) {
          throw new Error("The diagnostic did not return all 15 settled bodies.");
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
        if (!gl) throw new Error("WebGL 2 was lost before final pixel capture.");
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
      const flickLength = Math.hypot(event.clientX - start.x, event.clientY - start.y);
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
      fail(error instanceof Error ? error.message : "The scene could not start.");
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
            {trace.settledBodyCount} settled bodies · {trace.contactPairs.length}{" "}
            recorded contacts · {trace.changedWebGlPixels.toLocaleString()} real
            WebGL pixels changed.
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
