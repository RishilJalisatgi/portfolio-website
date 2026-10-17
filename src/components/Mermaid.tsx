import { useEffect, useId, useState } from "react";

/**
 * Renders a ```mermaid code block as a diagram.
 * Mermaid is large, so it is only downloaded when a page actually contains a diagram.
 */
export default function Mermaid({ chart }: { chart: string }) {
  const id = "mermaid-" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          fontFamily: "Inter, sans-serif",
          themeVariables: {
            fontFamily: "Inter, sans-serif",
            primaryColor: "#ffffff",
            primaryBorderColor: "#1f1f1f",
            primaryTextColor: "#1f1f1f",
            lineColor: "#4f7dff",
            secondaryColor: "#f0f0ea",
            tertiaryColor: "#fafaf8",
            edgeLabelBackground: "#ffffff",
          },
          flowchart: { curve: "basis", htmlLabels: true },
        });
        const { svg } = await mermaid.render(id, chart.trim());
        if (!cancelled) setSvg(svg);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not render diagram");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="text-sm">
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <figure
      className="mermaid-diagram"
      role="img"
      aria-label="Diagram"
      // The SVG comes from mermaid's own renderer in "strict" mode, from your own Markdown files.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
