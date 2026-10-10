import {
  useEffect,
  useCallback,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  Engine,
  createCounterballScene,
  type ArcRotateCamera,
  type BodyState,
} from "@korre/counterball/browser";
import fixtureJson from "../../../tests/fixtures/counterball-v1.json";

type CounterballFixture = {
  states: { initial: { bodies: BodyState[] } };
};

type CounterballPreviewProps = {
  onNavigateHome: () => void;
};

type BabylonCamera = NonNullable<
  ReturnType<typeof createCounterballScene>["activeCamera"]
>;

type CameraView = Pick<
  ArcRotateCamera,
  "alpha" | "beta" | "radius" | "lowerRadiusLimit" | "upperRadiusLimit"
> & {
  target: { x: number; y: number; z: number };
};

type PointerPoint = { x: number; y: number };

const fixture = fixtureJson as CounterballFixture;
const initialBodies = fixture.states.initial.bodies;
const buttonBody = (() => {
  const body = initialBodies.find((candidate) => candidate.id === "button");
  if (!body) {
    throw new Error("The initial Counterball fixture needs its button.");
  }
  return body;
})();
const homeCapCount = initialBodies.filter((body) =>
  body.id.startsWith("home-"),
).length;
const awayCapCount = initialBodies.filter((body) =>
  body.id.startsWith("away-"),
).length;
const buttonCount = initialBodies.filter((body) => body.id === "button").length;
const pieceSummary = `${initialBodies.length} pieces: ${homeCapCount} home caps, ${awayCapCount} away caps, ${buttonCount} four-hole button.`;
const sceneDescription =
  "Open green concrete with white boundary, center, and penalty-box markings, a goal at each end, seven decorated caps for each team, and one small plastic clothing button with four visible holes. This is a static scene preview; no pieces move.";
const MIN_BETA = 0.2;
const MAX_BETA = 1.5;
const MAX_DEVICE_PIXEL_RATIO = 1.5;
const MAX_RENDER_RATE = 30;
const MIN_RENDER_INTERVAL_MS = 1000 / MAX_RENDER_RATE;

function isOrbitCamera(
  camera: BabylonCamera | null,
): camera is ArcRotateCamera {
  return camera?.getClassName() === "ArcRotateCamera";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function CounterballPreview({
  onNavigateHome,
}: CounterballPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const fullPitchViewRef = useRef<CameraView | null>(null);
  const scheduleRenderRef = useRef<(() => void) | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [retryAvailable, setRetryAvailable] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [viewStatus, setViewStatus] = useState("Full pitch view.");
  const [attempt, setAttempt] = useState(0);
  const [cameraMode, setCameraMode] = useState<"pitch" | "button" | "custom">(
    "pitch",
  );
  const isInspectingButton = cameraMode === "button";

  const markCustomView = useCallback((): void => {
    setCameraMode("custom");
    setViewStatus("Custom camera view; fixture pieces stay fixed.");
  }, []);

  const adjustOrbit = useCallback(
    (deltaAlpha: number, deltaBeta: number): void => {
      const camera = cameraRef.current;
      if (!camera) return;
      camera.alpha += deltaAlpha;
      camera.beta = clamp(camera.beta + deltaBeta, MIN_BETA, MAX_BETA);
      markCustomView();
      scheduleRenderRef.current?.();
    },
    [markCustomView],
  );

  const adjustZoom = useCallback(
    (scale: number): void => {
      const camera = cameraRef.current;
      if (!camera) return;
      const minimumRadius = camera.lowerRadiusLimit ?? 0.3;
      const maximumRadius = camera.upperRadiusLimit ?? 42;
      camera.radius = clamp(
        camera.radius * scale,
        minimumRadius,
        maximumRadius,
      );
      markCustomView();
      scheduleRenderRef.current?.();
    },
    [markCustomView],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setRenderError(null);
    setRetryAvailable(false);
    setSceneReady(false);
    setCameraMode("pitch");
    setViewStatus("Full pitch view.");
    cameraRef.current = null;
    fullPitchViewRef.current = null;
    scheduleRenderRef.current = null;

    let engine: Engine | undefined;
    let scene: ReturnType<typeof createCounterballScene> | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let frameId = 0;
    let frameTimer = 0;
    let active = true;
    let disposed = false;
    let lostContext = false;
    let lastRenderAt = 0;
    let pinchDistance: number | null = null;
    const pointers = new Map<number, PointerPoint>();

    const cancelScheduledRender = (): void => {
      if (frameTimer !== 0) {
        window.clearTimeout(frameTimer);
        frameTimer = 0;
      }
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    };

    const clearCameraState = (): void => {
      cameraRef.current = null;
      fullPitchViewRef.current = null;
      pointers.clear();
      pinchDistance = null;
    };

    const dispose = (): void => {
      if (disposed) return;
      disposed = true;
      active = false;
      cancelScheduledRender();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerEnd);
      canvas.removeEventListener("pointercancel", onPointerEnd);
      canvas.removeEventListener("lostpointercapture", onPointerEnd);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      scene?.dispose();
      engine?.dispose();
      clearCameraState();
      if (scheduleRenderRef.current === scheduleRender) {
        scheduleRenderRef.current = null;
      }
    };

    const fail = (message: string): void => {
      if (disposed) return;
      setSceneReady(false);
      setCameraMode("pitch");
      setViewStatus("The scene is stopped. Retry to rebuild the preview.");
      setRenderError(message);
      setRetryAvailable(true);
      dispose();
    };

    const scheduleRender = (): void => {
      if (
        !active ||
        disposed ||
        document.hidden ||
        !scene ||
        frameId !== 0 ||
        frameTimer !== 0
      ) {
        return;
      }

      const elapsed = performance.now() - lastRenderAt;
      const delay = Math.max(0, MIN_RENDER_INTERVAL_MS - elapsed);
      frameTimer = window.setTimeout(() => {
        frameTimer = 0;
        if (!active || disposed || document.hidden || !scene) return;
        frameId = window.requestAnimationFrame(() => {
          frameId = 0;
          if (!active || disposed || document.hidden || !scene) return;
          try {
            scene.render();
            lastRenderAt = performance.now();
          } catch (error) {
            fail(
              error instanceof Error
                ? `The WebGL scene stopped: ${error.message}`
                : "The WebGL scene stopped unexpectedly.",
            );
          }
        });
      }, delay);
    };
    scheduleRenderRef.current = scheduleRender;

    const resize = (): void => {
      engine?.resize();
      scheduleRender();
    };

    const onVisibilityChange = (): void => {
      if (document.hidden) cancelScheduledRender();
      else scheduleRender();
    };

    const onContextLost = (event: Event): void => {
      event.preventDefault();
      if (disposed) return;
      lostContext = true;
      active = false;
      cancelScheduledRender();
      pointers.clear();
      pinchDistance = null;
      cameraRef.current = null;
      fullPitchViewRef.current = null;
      setSceneReady(false);
      setCameraMode("pitch");
      setViewStatus("Waiting for the browser to restore the WebGL context.");
      setRetryAvailable(false);
      setRenderError(
        "The WebGL context was lost. The 3D preview will need to restart after recovery.",
      );
    };

    const onContextRestored = (): void => {
      if (disposed || !lostContext) return;
      setRetryAvailable(true);
      setRenderError("The WebGL context was restored. Retry the 3D preview.");
    };

    const currentPinchDistance = (): number | null => {
      if (pointers.size !== 2) return null;
      const points = [...pointers.values()];
      const first = points[0];
      const second = points[1];
      if (!first || !second) return null;
      return Math.hypot(first.x - second.x, first.y - second.y);
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (!active || (event.pointerType === "mouse" && event.button !== 0)) {
        return;
      }
      event.preventDefault();
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      pinchDistance = currentPinchDistance();
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic test events and a lost pointer may not support capture.
      }
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (!active) return;
      const previous = pointers.get(event.pointerId);
      if (!previous) return;
      event.preventDefault();
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size === 1) {
        const deltaX = event.clientX - previous.x;
        const deltaY = event.clientY - previous.y;
        adjustOrbit(-deltaX * 0.008, deltaY * 0.008);
      } else if (pointers.size === 2) {
        const nextDistance = currentPinchDistance();
        if (
          nextDistance !== null &&
          pinchDistance !== null &&
          pinchDistance > 0
        ) {
          adjustZoom(pinchDistance / nextDistance);
        }
        pinchDistance = nextDistance;
      }
    };

    const onPointerEnd = (event: PointerEvent): void => {
      pointers.delete(event.pointerId);
      pinchDistance = currentPinchDistance();
    };

    const onWheel = (event: WheelEvent): void => {
      if (!active) return;
      event.preventDefault();
      adjustZoom(Math.exp(event.deltaY * 0.001));
    };

    try {
      canvas.addEventListener("webglcontextlost", onContextLost);
      canvas.addEventListener("webglcontextrestored", onContextRestored);
      engine = new Engine(
        canvas,
        true,
        {
          preserveDrawingBuffer: true,
          stencil: true,
          limitDeviceRatio: MAX_DEVICE_PIXEL_RATIO,
        },
        true,
      );
      scene = createCounterballScene(engine, initialBodies);
      const activeCamera = scene.activeCamera;
      if (!isOrbitCamera(activeCamera)) {
        throw new Error("The scene needs its ArcRotateCamera.");
      }
      cameraRef.current = activeCamera;
      fullPitchViewRef.current = {
        alpha: activeCamera.alpha,
        beta: activeCamera.beta,
        radius: activeCamera.radius,
        lowerRadiusLimit: activeCamera.lowerRadiusLimit,
        upperRadiusLimit: activeCamera.upperRadiusLimit,
        target: {
          x: activeCamera.target.x,
          y: activeCamera.target.y,
          z: activeCamera.target.z,
        },
      };

      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerEnd);
      canvas.addEventListener("pointercancel", onPointerEnd);
      canvas.addEventListener("lostpointercapture", onPointerEnd);
      canvas.addEventListener("wheel", onWheel, { passive: false });
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      window.addEventListener("resize", resize);
      document.addEventListener("visibilitychange", onVisibilityChange);
      engine.resize();
      setSceneReady(true);
      scheduleRender();
      scene.executeWhenReady(() => {
        if (active && !disposed) scheduleRender();
      });
    } catch (error) {
      fail(
        error instanceof Error
          ? `The WebGL scene could not start: ${error.message}`
          : "The WebGL scene could not start.",
      );
    }

    return dispose;
  }, [adjustOrbit, adjustZoom, attempt]);

  const inspectButton = (): void => {
    const camera = cameraRef.current;
    const fullPitchView = fullPitchViewRef.current;
    if (!sceneReady || !camera || !fullPitchView) return;

    camera.lowerRadiusLimit = 0.3;
    camera.upperRadiusLimit = 42;
    camera.target.copyFromFloats(
      buttonBody.position.x,
      buttonBody.position.y,
      buttonBody.position.z,
    );
    camera.alpha = fullPitchView.alpha;
    camera.beta = 0.42;
    // Camera distance changes only the view; fixture transforms and piece scale stay fixed.
    camera.radius = 0.72;
    setCameraMode("button");
    setViewStatus(
      "Close view of the real button; all pieces keep their fixture scale.",
    );
    scheduleRenderRef.current?.();
  };

  const returnToFullPitch = (): void => {
    const camera = cameraRef.current;
    const fullPitchView = fullPitchViewRef.current;
    if (!sceneReady || !camera || !fullPitchView) return;

    camera.lowerRadiusLimit = fullPitchView.lowerRadiusLimit;
    camera.upperRadiusLimit = fullPitchView.upperRadiusLimit;
    camera.target.copyFromFloats(
      fullPitchView.target.x,
      fullPitchView.target.y,
      fullPitchView.target.z,
    );
    camera.alpha = fullPitchView.alpha;
    camera.beta = fullPitchView.beta;
    camera.radius = fullPitchView.radius;
    setCameraMode("pitch");
    setViewStatus("Full pitch view.");
    scheduleRenderRef.current?.();
  };

  const handleHomeLink = (event: ReactMouseEvent<HTMLAnchorElement>): void => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    onNavigateHome();
  };

  return (
    <div className="page-frame preview-page">
      <a className="skip-link" href="#scene-preview">
        Skip to scene preview
      </a>
      <header className="site-header">
        <a className="wordmark" href="/" onClick={handleHomeLink}>
          korre<span aria-hidden="true">.</span>
        </a>
        <span className="build-label">
          <span className="status-dot" aria-hidden="true" />
          Scene preview
        </span>
      </header>

      <main id="main" className="preview-main" tabIndex={-1}>
        <div className="preview-heading-row">
          <div>
            <p className="eyebrow">Counterball · local preview</p>
            <h1 className="preview-title">The open pitch</h1>
          </div>
          <a
            className="text-link preview-back-link"
            href="/"
            onClick={handleHomeLink}
          >
            <span aria-hidden="true">←</span> Back to Counterball home
          </a>
        </div>

        <p className="preview-piece-count" id="preview-piece-count">
          {pieceSummary}
        </p>
        <p className="preview-note" id="preview-note">
          Static scene preview only. The game is not playable yet.
        </p>
        <p className="preview-scene-description" id="preview-scene-description">
          {sceneDescription}
        </p>

        <div
          className="preview-view-controls"
          role="group"
          aria-label="Scene camera controls"
        >
          <button
            className="preview-view-button"
            type="button"
            aria-pressed={isInspectingButton}
            disabled={!sceneReady || isInspectingButton}
            onClick={inspectButton}
          >
            Inspect four-hole button
          </button>
          <button
            className="preview-view-button"
            type="button"
            disabled={!sceneReady || cameraMode === "pitch"}
            onClick={returnToFullPitch}
          >
            Return to full pitch
          </button>
          <button
            className="preview-view-button"
            type="button"
            disabled={!sceneReady}
            onClick={() => adjustOrbit(-0.2, 0)}
          >
            Rotate view left
          </button>
          <button
            className="preview-view-button"
            type="button"
            disabled={!sceneReady}
            onClick={() => adjustOrbit(0.2, 0)}
          >
            Rotate view right
          </button>
          <button
            className="preview-view-button"
            type="button"
            disabled={!sceneReady}
            onClick={() => adjustOrbit(0, -0.12)}
          >
            Raise view
          </button>
          <button
            className="preview-view-button"
            type="button"
            disabled={!sceneReady}
            onClick={() => adjustOrbit(0, 0.12)}
          >
            Lower view
          </button>
          <button
            className="preview-view-button"
            type="button"
            disabled={!sceneReady}
            onClick={() => adjustZoom(0.85)}
          >
            Zoom in
          </button>
          <button
            className="preview-view-button"
            type="button"
            disabled={!sceneReady}
            onClick={() => adjustZoom(1.18)}
          >
            Zoom out
          </button>
        </div>
        <p className="preview-camera-help">
          Drag to orbit. Use a two-finger pinch or mouse wheel to zoom. The
          buttons also work with a keyboard. These controls move only the
          camera.
        </p>
        <p className="preview-view-status" aria-live="polite">
          {viewStatus}
        </p>

        <div
          className="preview-canvas-frame"
          id="scene-preview"
          tabIndex={-1}
          data-testid="counterball-canvas-frame"
          data-scene-view={
            cameraMode === "button"
              ? "button-inspection"
              : cameraMode === "custom"
                ? "custom"
                : "full-pitch"
          }
        >
          <canvas
            ref={canvasRef}
            className="preview-canvas"
            data-testid="counterball-canvas"
            role="img"
            aria-label="Counterball static 3D scene preview"
            aria-describedby="preview-piece-count preview-note preview-scene-description"
          />
        </div>
        {renderError ? (
          <div className="preview-error" role="alert">
            <p>{renderError}</p>
            <button
              className="preview-view-button"
              type="button"
              disabled={!retryAvailable}
              onClick={() => setAttempt((value) => value + 1)}
            >
              Retry 3D preview
            </button>
          </div>
        ) : null}
      </main>

      <footer className="site-footer">
        <span>Counterball by Korre</span>
        <span>Built from remembered play.</span>
      </footer>
    </div>
  );
}
