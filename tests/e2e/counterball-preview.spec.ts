import { expect, test, type Page } from "@playwright/test";

type PreviewLifecycle = {
  pendingAnimationFrames: () => number;
  animationFrameRequests: () => number;
  resizeListeners: () => number;
  engineInstances: () => number;
};

type WindowWithPreviewLifecycle = Window & {
  __counterballPreviewLifecycle?: PreviewLifecycle;
  __counterballPreviewWebGLMode?: "unsupported" | "constructor-failure" | "allow";
};

async function installLifecycleProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const pendingFrames = new Set<number>();
    const resizeListeners = new Set<EventListenerOrEventListenerObject>();
    let animationFrameRequests = 0;
    const requestFrame = window.requestAnimationFrame.bind(window);
    const cancelFrame = window.cancelAnimationFrame.bind(window);

    window.requestAnimationFrame = (callback) => {
      animationFrameRequests += 1;
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
        animationFrameRequests: () => animationFrameRequests,
        resizeListeners: () => resizeListeners.size,
        engineInstances: () => -1,
      } satisfies PreviewLifecycle,
    });
  });
}

async function readLifecycle(page: Page): Promise<{
  pendingAnimationFrames: number;
  animationFrameRequests: number;
  resizeListeners: number;
  engineInstances: number;
}> {
  return page.evaluate(() => {
    const lifecycle = (window as WindowWithPreviewLifecycle)
      .__counterballPreviewLifecycle;
    return {
      pendingAnimationFrames: lifecycle?.pendingAnimationFrames() ?? -1,
      animationFrameRequests: lifecycle?.animationFrameRequests() ?? -1,
      resizeListeners: lifecycle?.resizeListeners() ?? -1,
      engineInstances: lifecycle?.engineInstances() ?? -1,
    };
  });
}

async function waitForRenderAfter(
  page: Page,
  previousCount: number,
): Promise<void> {
  await expect
    .poll(async () => (await readLifecycle(page)).animationFrameRequests)
    .toBeGreaterThan(previousCount);
  await expect
    .poll(async () => (await readLifecycle(page)).pendingAnimationFrames)
    .toBe(0);
}

async function waitForQuietScene(page: Page): Promise<void> {
  await page.waitForTimeout(350);
  const settled = await readLifecycle(page);
  expect(settled.pendingAnimationFrames).toBe(0);
  await page.waitForTimeout(250);
  const idle = await readLifecycle(page);
  expect(idle.pendingAnimationFrames).toBe(0);
  expect(idle.animationFrameRequests).toBe(settled.animationFrameRequests);
}

async function webGlVersion(page: Page): Promise<string | null> {
  return page.getByTestId("counterball-canvas").evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const context = canvas.getContext("webgl2");
    const version: unknown = context?.getParameter(context.VERSION);
    return typeof version === "string" ? version : null;
  });
}

test("renders a real scene, stays idle, and cleans up before a remount", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await installLifecycleProbe(page);
  await page.goto("/");
  const baseline = await readLifecycle(page);

  await page
    .getByRole("link", { name: "Open the Counterball scene preview" })
    .click();
  await expect(
    page.getByRole("heading", { name: "The open pitch" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByText("15 pieces: 7 home caps, 7 away caps, 1 four-hole button."),
  ).toBeVisible();

  const canvas = page.getByTestId("counterball-canvas");
  await expect(canvas).toBeVisible();
  expect(await webGlVersion(page)).toContain("WebGL 2");
  await expect
    .poll(async () => (await readLifecycle(page)).animationFrameRequests)
    .toBeGreaterThan(baseline.animationFrameRequests);
  await expect
    .poll(async () => (await readLifecycle(page)).resizeListeners)
    .toBeGreaterThan(baseline.resizeListeners);
  await waitForQuietScene(page);
  await page.screenshot({
    path: "execution_state/reports/T03-preview.png",
    fullPage: true,
  });

  await page.getByRole("link", { name: "Back to Counterball home" }).click();
  await expect(page.getByText("The game is not playable yet.")).toBeVisible();
  await expect(canvas).toHaveCount(0);
  await expect
    .poll(async () => (await readLifecycle(page)).pendingAnimationFrames)
    .toBe(baseline.pendingAnimationFrames);
  await expect
    .poll(async () => (await readLifecycle(page)).resizeListeners)
    .toBe(baseline.resizeListeners);

  const beforeRemount = await readLifecycle(page);
  await page
    .getByRole("link", { name: "Open the Counterball scene preview" })
    .click();
  await expect(canvas).toBeVisible();
  expect(await webGlVersion(page)).toContain("WebGL 2");
  await expect
    .poll(async () => (await readLifecycle(page)).animationFrameRequests)
    .toBeGreaterThan(beforeRemount.animationFrameRequests);
  await expect
    .poll(async () => (await readLifecycle(page)).resizeListeners)
    .toBeGreaterThan(baseline.resizeListeners);
});

test.describe("mobile preview camera", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  test("supports real orbit, keyboard and touch zoom at mobile size", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await installLifecycleProbe(page);
    await page.goto("/preview");

    await expect(
      page.getByRole("heading", { name: "The open pitch" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText(
        "15 pieces: 7 home caps, 7 away caps, 1 four-hole button.",
      ),
    ).toBeVisible();
    const canvas = page.getByTestId("counterball-canvas");
    const canvasFrame = page.getByTestId("counterball-canvas-frame");
    await expect(canvas).toBeVisible();
    expect(await webGlVersion(page)).toContain("WebGL 2");
    await expect(
      page.getByRole("link", { name: "Skip to scene preview" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to Counterball home" }),
    ).toBeVisible();

    const initialImage = await canvas.screenshot();
    const inspectButton = page.getByRole("button", {
      name: "Inspect four-hole button",
    });
    const returnButton = page.getByRole("button", {
      name: "Return to full pitch",
    });
    await expect(inspectButton).toBeEnabled();
    await expect(returnButton).toBeDisabled();
    const beforeInspect = (await readLifecycle(page)).animationFrameRequests;
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
    await waitForRenderAfter(page, beforeInspect);
    const buttonImage = await canvas.screenshot();
    expect(buttonImage).not.toEqual(initialImage);
    await page.screenshot({
      path: "execution_state/reports/T03-inspection.png",
      fullPage: true,
    });

    const beforeReturn = (await readLifecycle(page)).animationFrameRequests;
    await returnButton.click();
    await expect(inspectButton).toHaveAttribute("aria-pressed", "false");
    await expect(returnButton).toBeDisabled();
    await expect(canvasFrame).toHaveAttribute("data-scene-view", "full-pitch");
    await waitForRenderAfter(page, beforeReturn);

    const beforeDrag = (await readLifecycle(page)).animationFrameRequests;
    const bounds = await canvas.boundingBox();
    expect(bounds).not.toBeNull();
    if (!bounds) return;
    await page.mouse.move(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      bounds.x + bounds.width / 2 + 48,
      bounds.y + bounds.height / 2 + 12,
      { steps: 4 },
    );
    await page.mouse.up();
    await expect(canvasFrame).toHaveAttribute("data-scene-view", "custom");
    await waitForRenderAfter(page, beforeDrag);
    const dragImage = await canvas.screenshot();
    expect(dragImage).not.toEqual(initialImage);

    const beforeKeyboard = (await readLifecycle(page)).animationFrameRequests;
    const rotateLeft = page.getByRole("button", { name: "Rotate view left" });
    await rotateLeft.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByText("Custom camera view; fixture pieces stay fixed."),
    ).toBeVisible();
    await waitForRenderAfter(page, beforeKeyboard);
    const keyboardImage = await canvas.screenshot();
    expect(keyboardImage).not.toEqual(dragImage);

    const beforeTouch = (await readLifecycle(page)).animationFrameRequests;
    await canvas.evaluate((element) => {
      const target = element as HTMLCanvasElement;
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dispatch = (
        type: string,
        pointerId: number,
        clientX: number,
      ): void => {
        target.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            pointerId,
            pointerType: "touch",
            isPrimary: pointerId === 41,
            clientX,
            clientY: centerY,
            button: 0,
          }),
        );
      };
      dispatch("pointerdown", 41, centerX - 34);
      dispatch("pointerdown", 42, centerX + 34);
      dispatch("pointermove", 42, centerX + 58);
      dispatch("pointerup", 41, centerX - 34);
      dispatch("pointerup", 42, centerX + 58);
    });
    await waitForRenderAfter(page, beforeTouch);
    const touchImage = await canvas.screenshot();
    expect(touchImage).not.toEqual(keyboardImage);

    const readViewport = async () =>
      page.evaluate(() => {
        const canvasElement = document.querySelector<HTMLCanvasElement>(
          '[data-testid="counterball-canvas"]',
        );
        const bounds = canvasElement?.getBoundingClientRect();
        return {
          width: window.innerWidth,
          height: window.innerHeight,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          devicePixelRatio: window.devicePixelRatio,
          canvasWidth: canvasElement?.width ?? 0,
          canvasHeight: canvasElement?.height ?? 0,
          cssCanvasWidth: bounds?.width ?? 0,
          cssCanvasHeight: bounds?.height ?? 0,
        };
      });
    const checkNoHorizontalOverflowAndPixelCap = async (
      expectedWidth: number,
      expectedHeight: number,
    ): Promise<void> => {
      const viewport = await readViewport();
      expect(viewport.width).toBe(expectedWidth);
      expect(viewport.height).toBe(expectedHeight);
      expect(viewport.documentWidth).toBeLessThanOrEqual(viewport.width);
      expect(viewport.bodyWidth).toBeLessThanOrEqual(viewport.width);
      const cappedPixelRatio = Math.min(viewport.devicePixelRatio, 1.5);
      expect(viewport.canvasWidth).toBeLessThanOrEqual(
        Math.ceil(viewport.cssCanvasWidth * cappedPixelRatio) + 2,
      );
      expect(viewport.canvasHeight).toBeLessThanOrEqual(
        Math.ceil(viewport.cssCanvasHeight * cappedPixelRatio) + 2,
      );
    };

    await checkNoHorizontalOverflowAndPixelCap(390, 844);
    await page.setViewportSize({ width: 1280, height: 900 });
    await checkNoHorizontalOverflowAndPixelCap(1280, 900);
    await page.setViewportSize({ width: 390, height: 844 });
    await checkNoHorizontalOverflowAndPixelCap(390, 844);
    // The interaction sequence above can leave the document scrolled. Return to
    // the page start before checking which controls mobile users can reach there.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(
      page.getByRole("link", { name: "Back to Counterball home" }),
    ).toBeInViewport();
    await expect(inspectButton).toBeInViewport();
    await page.screenshot({
      path: "execution_state/reports/T03-narrow-viewport.png",
      fullPage: true,
    });
  });
});

test("WebGL failure and context loss are recoverable", async ({ page }) => {
  test.setTimeout(60_000);
  await installLifecycleProbe(page);
  await page.addInitScript(`
    (() => {
      window.__counterballPreviewWebGLMode = "unsupported";
      const original = HTMLCanvasElement.prototype.getContext;
      const canvasesWithPreflightContext = new WeakSet();
      const webGLContextNames = new Set([
        "webgl2",
        "experimental-webgl2",
        "webgl",
        "experimental-webgl",
      ]);
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        const isPreviewCanvas =
          this.getAttribute("data-testid") === "counterball-canvas";
        const contextName = String(type).toLowerCase();
        if (isPreviewCanvas && webGLContextNames.has(contextName)) {
          const mode = window.__counterballPreviewWebGLMode;
          if (mode === "unsupported") return null;
          if (
            mode === "constructor-failure" &&
            canvasesWithPreflightContext.has(this)
          ) {
            return null;
          }
          const context = original.call(this, type, ...args);
          if (mode === "constructor-failure" && context) {
            canvasesWithPreflightContext.add(this);
          }
          return context;
        }
        return original.call(this, type, ...args);
      };
    })();
  `);
  await page.goto("/");
  const baseline = await readLifecycle(page);
  await page
    .getByRole("link", { name: "Open the Counterball scene preview" })
    .click();

  const canvas = page.getByTestId("counterball-canvas");
  const alert = page.getByRole("alert");
  const retry = page.getByRole("button", { name: "Retry 3D preview" });
  await expect(alert).toContainText("could not start", { timeout: 30_000 });
  await expect(retry).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Rotate view left" }),
  ).toBeDisabled();
  const failedLifecycle = await readLifecycle(page);
  expect(failedLifecycle.pendingAnimationFrames).toBe(
    baseline.pendingAnimationFrames,
  );
  expect(failedLifecycle.resizeListeners).toBe(baseline.resizeListeners);
  expect(failedLifecycle.engineInstances).toBe(0);

  await page.evaluate(() => {
    (window as WindowWithPreviewLifecycle).__counterballPreviewWebGLMode =
      "allow";
  });
  await retry.click();
  await expect(alert).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Inspect four-hole button" }),
  ).toBeEnabled({ timeout: 30_000 });
  expect(await webGlVersion(page)).toContain("WebGL 2");
  await expect
    .poll(async () => (await readLifecycle(page)).engineInstances)
    .toBe(1);

  const contextLossSupported = await canvas.evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext("webgl2");
    return Boolean(context?.getExtension("WEBGL_lose_context"));
  });
  test.info().annotations.push({
    type: "webgl-context-loss",
    description: contextLossSupported
      ? "WEBGL_lose_context supported; exercising loss and recovery."
      : "WEBGL_lose_context unavailable; startup failure and retry were tested.",
  });
  if (contextLossSupported) {
    await canvas.evaluate((element) => {
      const context = (element as HTMLCanvasElement).getContext("webgl2");
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    });
    await expect(alert).toContainText("context was lost");
    await expect(retry).toBeDisabled();
    await canvas.evaluate((element) => {
      const context = (element as HTMLCanvasElement).getContext("webgl2");
      context?.getExtension("WEBGL_lose_context")?.restoreContext();
    });
    await expect(alert).toContainText("context was restored", {
      timeout: 15_000,
    });
    await expect(retry).toBeEnabled();
    await retry.click();
    await expect(alert).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Inspect four-hole button" }),
    ).toBeEnabled({ timeout: 30_000 });
    expect(await webGlVersion(page)).toContain("WebGL 2");
  }

  await page.getByRole("link", { name: "Back to Counterball home" }).click();
  await expect(canvas).toHaveCount(0);
  await expect
    .poll(async () => (await readLifecycle(page)).resizeListeners)
    .toBe(baseline.resizeListeners);
  await expect
    .poll(async () => (await readLifecycle(page)).engineInstances)
    .toBe(0);

  await page.evaluate(() => {
    (window as WindowWithPreviewLifecycle).__counterballPreviewWebGLMode =
      "constructor-failure";
  });
  await page
    .getByRole("link", { name: "Open the Counterball scene preview" })
    .click();
  await expect(alert).toContainText("could not start", { timeout: 30_000 });
  await expect(retry).toBeEnabled();
  const constructorFailure = await readLifecycle(page);
  expect(constructorFailure.pendingAnimationFrames).toBe(
    baseline.pendingAnimationFrames,
  );
  expect(constructorFailure.resizeListeners).toBe(baseline.resizeListeners);
  expect(constructorFailure.engineInstances).toBe(0);

  await page.evaluate(() => {
    (window as WindowWithPreviewLifecycle).__counterballPreviewWebGLMode =
      "allow";
  });
  await retry.click();
  await expect(alert).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Inspect four-hole button" }),
  ).toBeEnabled({ timeout: 30_000 });
  expect(await webGlVersion(page)).toContain("WebGL 2");
  await expect
    .poll(async () => (await readLifecycle(page)).engineInstances)
    .toBe(1);
});
