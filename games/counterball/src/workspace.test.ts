import { describe, expect, it } from "vitest";
import * as browserEntry from "./browser.js";
import * as headlessEntry from "./headless.js";

describe("Counterball package entrypoints", () => {
  it("keeps browser and headless imports resolvable and distinct", () => {
    expect(browserEntry.scaffoldPackage).toBe("@korre/counterball/browser");
    expect(headlessEntry.scaffoldPackage).toBe("@korre/counterball/headless");
  });
});
