import { describe, expect, it } from "vitest";
import { scaffoldPackage as counterballBrowser } from "@korre/counterball/browser";
import { COUNTERBALL_CONFIG_V1, oppositeTeam } from "@korre/game-protocol";
import { COUNTERBALL_GAME_MANIFEST } from "@korre/game-sdk";
import { scaffoldPackage as identityClient } from "@korre/identity-client";
import { scaffoldPackage as ui } from "@korre/ui";

describe("workspace package linking", () => {
  it("resolves scaffold packages and the Counterball public contracts", () => {
    expect([counterballBrowser, identityClient, ui]).toEqual([
      "@korre/counterball/browser",
      "@korre/identity-client",
      "@korre/ui",
    ]);
    expect(COUNTERBALL_CONFIG_V1.bodies.capsPerTeam).toBe(7);
    expect(oppositeTeam("home")).toBe("away");
    expect(COUNTERBALL_GAME_MANIFEST).toMatchObject({
      id: "counterball",
      minPlayers: 2,
      maxPlayers: 2,
      supportsSpectators: true,
      modes: ["ai", "online"],
    });
  });
});
