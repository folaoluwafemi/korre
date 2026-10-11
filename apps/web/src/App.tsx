import { lazy, Suspense, useEffect, useState, type MouseEvent } from "react";

const CounterballPreview = lazy(() => import("./CounterballPreview.js"));
const CounterballDirectProbe =
  import.meta.env.VITE_COUNTERBALL_DEV_HARNESS === "1"
    ? lazy(() => import("./CounterballDirectProbe.js"))
    : null;
const CounterballRendererDiagnostic =
  import.meta.env.VITE_COUNTERBALL_DEV_HARNESS === "1"
    ? lazy(() => import("./CounterballRendererDiagnostic.js"))
    : null;

export default function App() {
  const [pathname, setPathname] = useState(() =>
    typeof window === "undefined" ? "/" : window.location.pathname,
  );

  useEffect(() => {
    const handlePopState = (): void => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path: string): void => {
    window.history.pushState({}, "", path);
    setPathname(path);
  };

  const handlePreviewLink = (event: MouseEvent<HTMLAnchorElement>): void => {
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
    navigate("/preview");
  };

  const handleDirectProbeLink = (
    event: MouseEvent<HTMLAnchorElement>,
  ): void => {
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
    navigate("/diagnostic/direct-shot");
  };

  if (
    CounterballDirectProbe !== null &&
    pathname === "/diagnostic/direct-shot"
  ) {
    return (
      <Suspense
        fallback={
          <main id="main" tabIndex={-1}>
            Loading the browser physics diagnostic…
          </main>
        }
      >
        <CounterballDirectProbe onNavigateHome={() => navigate("/")} />
      </Suspense>
    );
  }

  if (pathname === "/preview") {
    return (
      <>
        <Suspense
          fallback={
            <main id="main" tabIndex={-1}>
              Loading scene preview…
            </main>
          }
        >
          <CounterballPreview onNavigateHome={() => navigate("/")} />
        </Suspense>
        {CounterballRendererDiagnostic === null ? null : (
          <Suspense fallback={null}>
            <CounterballRendererDiagnostic />
          </Suspense>
        )}
      </>
    );
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="page-frame">
        <header className="site-header">
          <a
            className="wordmark"
            href="#main"
            aria-label="Korre, Counterball home"
          >
            korre<span aria-hidden="true">.</span>
          </a>
          <span className="build-label">
            <span className="status-dot" aria-hidden="true" />
            In development
          </span>
        </header>

        <main id="main" tabIndex={-1}>
          <section className="hero" aria-labelledby="game-title">
            <div className="hero-copy">
              <p className="eyebrow">A childhood game. A new place to play.</p>
              <h1 id="game-title" aria-label="Counterball">
                Counter
                <span>
                  ball<span className="title-period">.</span>
                </span>
              </h1>
              <p className="hero-description">
                Bottle caps. A clothing button. An open concrete pitch.
              </p>
              <p className="hero-detail">
                We’re bringing the Nigerian game to Korre, one flick at a time.
              </p>
              <a className="text-link" href="#build-status">
                See what comes next <span aria-hidden="true">↘</span>
              </a>
              <a
                className="text-link preview-home-link"
                href="/preview"
                onClick={handlePreviewLink}
              >
                Open the Counterball scene preview
                <span aria-hidden="true">↗</span>
              </a>
              {CounterballDirectProbe === null ? null : (
                <a
                  className="text-link"
                  href="/diagnostic/direct-shot"
                  onClick={handleDirectProbeLink}
                >
                  Try the browser flick diagnostic
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
            <div className="concrete-study" aria-hidden="true">
              <div className="study-line study-line-one" />
              <div className="study-line study-line-two" />
              <div className="cap-study">
                <span>K</span>
              </div>
              <div className="button-study">
                <i />
                <i />
                <i />
                <i />
              </div>
              <span className="study-caption">CAP + BUTTON + CONCRETE</span>
              <span className="study-number">01 / COUNTERBALL</span>
            </div>
          </section>

          <section
            className="build-status"
            id="build-status"
            aria-labelledby="status-title"
          >
            <div className="status-intro">
              <p className="eyebrow">Build status</p>
              <h2 id="status-title">
                The pitch
                <br />
                is taking shape.
              </h2>
            </div>
            <div className="status-content">
              <p className="workspace-label">Pitch preview ready</p>
              <p className="status-message">The game is not playable yet.</p>
              <p className="status-detail">
                Explore the open green pitch, seven caps per side, and the
                four-hole button. Physics and account checks are in progress;
                flicks and matches are the next milestone.
              </p>
              <ol className="next-steps" aria-label="Upcoming work">
                <li>
                  <span className="step-number" aria-hidden="true">
                    01
                  </span>
                  <span>A convincing cap-and-button flick</span>
                </li>
                <li>
                  <span className="step-number" aria-hidden="true">
                    02
                  </span>
                  <span>Seven caps per side and placed restarts</span>
                </li>
                <li>
                  <span className="step-number" aria-hidden="true">
                    03
                  </span>
                  <span>AI matches, then play with friends</span>
                </li>
              </ol>
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <span>Counterball by Korre</span>
          <span>Built from remembered play.</span>
        </footer>
      </div>
    </>
  );
}
