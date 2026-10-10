import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CounterballRendererDiagnostic from "./CounterballRendererDiagnostic.js";

describe("Counterball renderer diagnostic", () => {
  it("clearly labels the static, non-playable scene and renders child content", () => {
    const markup = renderToStaticMarkup(
      <CounterballRendererDiagnostic>
        <p>Additional scene notes.</p>
      </CounterballRendererDiagnostic>,
    );

    expect(markup).toContain(
      'aria-label="Development-only renderer diagnostic"',
    );
    expect(markup).toContain("Development-only renderer diagnostic");
    expect(markup).toContain("Static scene only");
    expect(markup).toContain("No physics or Havok is running.");
    expect(markup).toContain("You cannot flick pieces or play a match.");
    expect(markup).toContain("Additional scene notes.");
    expect(markup).not.toContain("<button");
  });
});
