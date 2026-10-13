import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { rm } from "node:fs/promises";
import {
  expect,
  test,
  type Download,
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

type DownloadDigest = Readonly<{ byteLength: number; sha256: string }>;

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
  for await (const chunk of createReadStream(path, {
    highWaterMark: 64 * 1024,
  })) {
    byteLength += chunk.byteLength;
    if (byteLength > TRANSPORT_BYTES) {
      throw new Error("The downloaded transport file exceeds its exact cap.");
    }
    hash.update(chunk);
  }
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

test("the maximum synthetic transport streams through the browser download", async ({
  page,
}, testInfo) => {
  test.setTimeout(480_000);
  await openDiagnostic(page);

  const expectedSha256 = expectedTransportDigest();
  const status = page.getByTestId("loft-matrix-status");
  let hostPath: string | undefined;
  let browserDownload: Download | undefined;
  let hasPrimaryError = false;
  let primaryError: unknown;

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
    expect(output.export.fileName).toMatch(
      /^counterball-l01-[0-9a-f-]+\.bin$/,
    );
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
    await page
      .getByRole("button", { name: "Download transport file" })
      .click();
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
    throw error;
  } finally {
    const cleanupErrors: unknown[] = [];
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
    if (cleanupErrors.length > 0) {
      const errors = hasPrimaryError
        ? [primaryError, ...cleanupErrors]
        : cleanupErrors;
      throw new AggregateError(
        errors,
        "The transport test failed to remove every temporary file.",
        hasPrimaryError ? { cause: primaryError } : undefined,
      );
    }
  }
});
