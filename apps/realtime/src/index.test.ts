import { describe, expect, it } from "vitest";
import worker from "./index.js";

describe("local realtime worker scaffold", () => {
  it("returns a health response without claiming game simulation", async () => {
    const response = worker.fetch(new Request("http://localhost/health"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      service: "realtime",
    });
  });

  it("does not expose undeclared routes", () => {
    const response = worker.fetch(new Request("http://localhost/private"));

    expect(response.status).toBe(404);
  });
});
