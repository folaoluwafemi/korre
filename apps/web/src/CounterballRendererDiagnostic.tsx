import type { ReactNode } from "react";
import "./CounterballRendererDiagnostic.css";

type CounterballRendererDiagnosticProps = {
  children?: ReactNode;
};

export default function CounterballRendererDiagnostic({
  children,
}: CounterballRendererDiagnosticProps) {
  return (
    <aside
      className="renderer-diagnostic"
      aria-label="Development-only renderer diagnostic"
    >
      <p className="renderer-diagnostic__label">
        Development-only renderer diagnostic
      </p>
      <h2 className="renderer-diagnostic__title">Static scene only</h2>
      <p className="renderer-diagnostic__message">
        No physics or Havok is running. You cannot flick pieces or play a match.
      </p>
      {children == null ? null : (
        <div className="renderer-diagnostic__content">{children}</div>
      )}
    </aside>
  );
}
