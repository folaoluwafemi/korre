import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App.js";

describe("Counterball home", () => {
  it("labels the build accurately and exposes a skip link", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("Pitch preview ready");
    expect(markup).toContain("The game is not playable yet.");
    expect(markup).toContain('href="#main"');
  });
});
