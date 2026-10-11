import {
  expect,
  test,
  type Page,
  type Route,
  type TestInfo,
} from "@playwright/test";

type LifecycleSnapshot = {
  baselineEngines: number;
  engines: number;
  activeListeners: number;
  activeResizeObservers: number;
  phase: string;
};

type WindowWithDirectProbe = Window & {
  __counterballDirectProbeLifecycle?: () => LifecycleSnapshot;
};

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
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error("The diagnostic WebGL canvas has no bounds.");

  const initialLifecycle = await lifecycle(page);
  expect(initialLifecycle.activeListeners).toBeGreaterThan(0);
  expect(initialLifecycle.activeResizeObservers).toBe(1);
  await canvas.screenshot({
    path: testInfo.outputPath("direct-probe-before.png"),
  });

  const startX = box.x + box.width * 0.2;
  const startY = box.y + box.height * 0.78;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 64, startY - 32, { steps: 8 });
  await page.mouse.up();

  const result = page.getByTestId("probe-result");
  await expect(result).toBeVisible({ timeout: 120_000 });
  const traceText = await result.textContent();
  if (!traceText) throw new Error("The direct-shot trace is empty.");
  const trace = JSON.parse(traceText) as ProbeTrace;

  expect(trace.scope).toBe("browser-direct-impulse-v1");
  expect(trace.termination).toBe("settled");
  expect(trace.capId).toBe("home-6");
  expect(trace.impulse).toEqual({ x: 0, y: 0, z: 8 });
  expect(trace.applicationPoint).toEqual({ x: 0, y: 0.06, z: -4 });
  expect(trace.settledBodyCount).toBe(15);
  expect(trace.contactPairs).toContainEqual(expect.arrayContaining(["home-6", "button"]));
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

  const box = await page.getByTestId("counterball-canvas").boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error("The diagnostic WebGL canvas has no bounds.");
  const startX = box.x + box.width * 0.2;
  const startY = box.y + box.height * 0.78;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 64, startY - 32, { steps: 8 });
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
