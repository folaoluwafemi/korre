import { expect, test } from "@playwright/test";

type PreviewLifecycle = {
  pendingAnimationFrames: () => number;
  resizeListeners: () => number;
};

type WindowWithPreviewLifecycle = Window & {
  __counterballPreviewLifecycle?: PreviewLifecycle;
};

test("renders the real scene and cleans up before a preview remount", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    const pendingFrames = new Set<number>();
    const resizeListeners = new Set<EventListenerOrEventListenerObject>();
    const requestFrame = window.requestAnimationFrame.bind(window);
    const cancelFrame = window.cancelAnimationFrame.bind(window);

    window.requestAnimationFrame = (callback) => {
      let frameId = 0;
      frameId = requestFrame((timestamp) => {
        pendingFrames.delete(frameId);
        callback(timestamp);
      });
      pendingFrames.add(frameId);
      return frameId;
    };
    window.cancelAnimationFrame = (frameId) => {
      pendingFrames.delete(frameId);
      cancelFrame(frameId);
    };

    // The originals are invoked with the intercepted target as their receiver below.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const addEventListener = EventTarget.prototype.addEventListener;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const removeEventListener = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (
      type,
      listener,
      options,
    ) {
      if (this === window && type === "resize" && listener) {
        resizeListeners.add(listener);
      }
      return addEventListener.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function (
      type,
      listener,
      options,
    ) {
      if (this === window && type === "resize" && listener) {
        resizeListeners.delete(listener);
      }
      return removeEventListener.call(this, type, listener, options);
    };

    Object.defineProperty(window, "__counterballPreviewLifecycle", {
      configurable: true,
      value: {
        pendingAnimationFrames: () => pendingFrames.size,
        resizeListeners: () => resizeListeners.size,
      } satisfies PreviewLifecycle,
    });
  });

  await page.goto("/");
  const readLifecycle = async (): Promise<{
    pendingAnimationFrames: number;
    resizeListeners: number;
  }> =>
    page.evaluate(() => {
      const lifecycle = (window as WindowWithPreviewLifecycle)
        .__counterballPreviewLifecycle;
      return {
        pendingAnimationFrames: lifecycle?.pendingAnimationFrames() ?? -1,
        resizeListeners: lifecycle?.resizeListeners() ?? -1,
      };
    });
  const baseline = await readLifecycle();

  await page
    .getByRole("link", { name: "Open the Counterball scene preview" })
    .click();
  await expect(
    page.getByRole("heading", { name: "The open pitch" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByText("15 pieces: 7 home caps, 7 away caps, 1 four-hole button."),
  ).toBeVisible();

  const canvas = page.getByRole("img", {
    name: "Counterball scene preview. 15 pieces: 7 home caps, 7 away caps, 1 four-hole button.",
  });
  await expect(canvas).toBeVisible();
  const contextVersion = await canvas.evaluate<string | null>((element) => {
    const renderingCanvas = element as HTMLCanvasElement;
    const context =
      renderingCanvas.getContext("webgl2") ??
      renderingCanvas.getContext("webgl");
    const version: unknown = context?.getParameter(context.VERSION);
    return typeof version === "string" ? version : null;
  });
  expect(
    contextVersion,
    "Chromium must render the preview with WebGL 2",
  ).toContain("WebGL 2");
  await expect
    .poll(async () => (await readLifecycle()).pendingAnimationFrames)
    .toBeGreaterThan(baseline.pendingAnimationFrames);
  await expect
    .poll(async () => (await readLifecycle()).resizeListeners)
    .toBeGreaterThan(baseline.resizeListeners);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        window.requestAnimationFrame(() =>
          window.requestAnimationFrame(() => resolve()),
        );
      }),
  );
  await page.screenshot({
    path: "execution_state/reports/T03-preview.png",
    fullPage: true,
  });

  await page.getByRole("link", { name: "Back to Counterball home" }).click();
  await expect(page.getByText("The game is not playable yet.")).toBeVisible();
  await expect(canvas).toHaveCount(0);
  await expect
    .poll(async () => (await readLifecycle()).pendingAnimationFrames)
    .toBe(baseline.pendingAnimationFrames);
  await expect
    .poll(async () => (await readLifecycle()).resizeListeners)
    .toBe(baseline.resizeListeners);

  await page
    .getByRole("link", { name: "Open the Counterball scene preview" })
    .click();
  await expect(canvas).toBeVisible();
  await expect
    .poll(async () => (await readLifecycle()).pendingAnimationFrames)
    .toBeGreaterThan(baseline.pendingAnimationFrames);
  await expect
    .poll(async () => (await readLifecycle()).resizeListeners)
    .toBeGreaterThan(baseline.resizeListeners);
});

test("inspects the fixture button and remains usable at 390 by 844", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/preview");

  await expect(
    page.getByRole("heading", { name: "The open pitch" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByText("15 pieces: 7 home caps, 7 away caps, 1 four-hole button."),
  ).toBeVisible();

  const canvas = page.getByRole("img", {
    name: "Counterball scene preview. 15 pieces: 7 home caps, 7 away caps, 1 four-hole button.",
  });
  await expect(canvas).toBeVisible();
  const webGlVersion = await canvas.evaluate<string | null>((element) => {
    const renderingCanvas = element as HTMLCanvasElement;
    const context = renderingCanvas.getContext("webgl2");
    const version: unknown = context?.getParameter(context.VERSION);
    return typeof version === "string" ? version : null;
  });
  expect(webGlVersion).toContain("WebGL 2");

  const inspectButton = page.getByRole("button", {
    name: "Inspect four-hole button",
  });
  const returnButton = page.getByRole("button", {
    name: "Return to full pitch",
  });
  const canvasFrame = page.getByTestId("counterball-canvas-frame");

  await expect(inspectButton).toBeEnabled();
  await expect(returnButton).toBeDisabled();
  await inspectButton.click();
  await expect(inspectButton).toHaveAttribute("aria-pressed", "true");
  await expect(returnButton).toBeEnabled();
  await expect(canvasFrame).toHaveAttribute(
    "data-scene-view",
    "button-inspection",
  );
  await expect(
    page.getByText(
      "Close view of the real button; all pieces keep their fixture scale.",
    ),
  ).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        window.requestAnimationFrame(() =>
          window.requestAnimationFrame(() => resolve()),
        );
      }),
  );
  await page.screenshot({
    path: "execution_state/reports/T03-inspection.png",
    fullPage: true,
  });

  await returnButton.click();
  await expect(inspectButton).toHaveAttribute("aria-pressed", "false");
  await expect(returnButton).toBeDisabled();
  await expect(canvasFrame).toHaveAttribute("data-scene-view", "full-pitch");
  await expect(canvas).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        window.requestAnimationFrame(() =>
          window.requestAnimationFrame(() => resolve()),
        );
      }),
  );
  await expect(
    page.getByText("15 pieces: 7 home caps, 7 away caps, 1 four-hole button."),
  ).toBeVisible();
  await expect(inspectButton).toBeInViewport();
  await expect(returnButton).toBeInViewport();
  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(viewport.width).toBe(390);
  expect(viewport.height).toBe(844);
  expect(viewport.documentWidth).toBeLessThanOrEqual(viewport.width);
  expect(viewport.bodyWidth).toBeLessThanOrEqual(viewport.width);
  await page.screenshot({
    path: "execution_state/reports/T03-narrow-viewport.png",
    fullPage: true,
  });
});
