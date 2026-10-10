import { describe, expect, it } from "vitest";
import { scaffoldPackage } from "./index.js";

describe("UI workspace entry", () => {
  it("resolves the package's public entrypoint", () => {
    expect(scaffoldPackage).toBe("@korre/ui");
  });
});
