import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  Engine,
  createCounterballScene,
  type BodyState,
} from "@korre/counterball/browser";
import fixtureJson from "../../../tests/fixtures/counterball-v1.json";

type CounterballFixture = {
  states: { initial: { bodies: BodyState[] } };
};

type CounterballPreviewProps = {
  onNavigateHome: () => void;
};

type OrbitCameraControls = {
  alpha: number;
  beta: number;
  radius: number;
  lowerRadiusLimit: number;
  upperRadiusLimit: number;
  target: {
    x: number;
    y: number;
    z: number;
    copyFromFloats: (x: number, y: number, z: number) => unknown;
  };
};

type CameraView = Omit<OrbitCameraControls, "target"> & {
  target: { x: number; y: number; z: number };
};

const fixture = fixtureJson as CounterballFixture;
const initialBodies = fixture.states.initial.bodies;
const buttonBody = (() => {
  const body = initialBodies.find((candidate) => candidate.id === "button");
  if (!body)
    throw new Error("The initial Counterball fixture needs its button.");
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

export default function CounterballPreview({
  onNavigateHome,
}: CounterballPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [isInspectingButton, setIsInspectingButton] = useState(false);
  const cameraRef = useRef<OrbitCameraControls | null>(null);
  const fullPitchViewRef = useRef<CameraView | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine: Engine | undefined;
    let scene: ReturnType<typeof createCounterballScene> | undefined;
    let renderLoop: (() => void) | undefined;
    let resizeObserver: ResizeObserver | undefined;

    const resize = (): void => engine?.resize();
    const dispose = (): void => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      if (engine && renderLoop) engine.stopRenderLoop(renderLoop);
      scene?.dispose();
      engine?.dispose();
    };

    try {
      engine = new Engine(
        canvas,
        true,
        { preserveDrawingBuffer: true, stencil: true },
        true,
      );
      scene = createCounterballScene(engine, initialBodies);
      const camera =
        scene.activeCamera as unknown as OrbitCameraControls | null;
      if (camera) {
        cameraRef.current = camera;
        fullPitchViewRef.current = {
          alpha: camera.alpha,
          beta: camera.beta,
          radius: camera.radius,
          lowerRadiusLimit: camera.lowerRadiusLimit,
          upperRadiusLimit: camera.upperRadiusLimit,
          target: {
            x: camera.target.x,
            y: camera.target.y,
            z: camera.target.z,
          },
        };
      }
      renderLoop = (): void => scene?.render();
      engine.runRenderLoop(renderLoop);
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      window.addEventListener("resize", resize);
      resize();
      setSceneReady(true);
    } catch (error) {
      dispose();
      setRenderError(
        error instanceof Error
          ? `The WebGL scene could not start: ${error.message}`
          : "The WebGL scene could not start.",
      );
    }

    return dispose;
  }, []);

  const inspectButton = (): void => {
    const camera = cameraRef.current;
    const fullPitchView = fullPitchViewRef.current;
    if (!camera || !fullPitchView) return;

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
    setIsInspectingButton(true);
  };

  const returnToFullPitch = (): void => {
    const camera = cameraRef.current;
    const fullPitchView = fullPitchViewRef.current;
    if (!camera || !fullPitchView) return;

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
    setIsInspectingButton(false);
  };

  const handleHomeLink = (event: MouseEvent<HTMLAnchorElement>): void => {
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

        <div
          className="preview-view-controls"
          role="group"
          aria-label="Scene view"
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
            disabled={!sceneReady || !isInspectingButton}
            onClick={returnToFullPitch}
          >
            Return to full pitch
          </button>
        </div>
        <p className="preview-view-status" aria-live="polite">
          {isInspectingButton
            ? "Close view of the real button; all pieces keep their fixture scale."
            : "Full pitch view."}
        </p>

        <div
          className="preview-canvas-frame"
          data-testid="counterball-canvas-frame"
          data-scene-view={
            isInspectingButton ? "button-inspection" : "full-pitch"
          }
        >
          <canvas
            ref={canvasRef}
            className="preview-canvas"
            data-testid="counterball-canvas"
            role="img"
            aria-label={`Counterball scene preview. ${pieceSummary}`}
            aria-describedby="preview-piece-count preview-note"
          />
        </div>
        {renderError ? (
          <p className="preview-error" role="alert">
            {renderError}
          </p>
        ) : null}
      </main>

      <footer className="site-footer">
        <span>Counterball by Korre</span>
        <span>Built from remembered play.</span>
      </footer>
    </div>
  );
}
