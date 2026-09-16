import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
const root = createRoot(document.getElementById("root")!);
function UI({ time }: { time: number }) {
  return (
    <main
      style={{ width: 320, height: 240, display: "flex", background: "white" }}
    >
      <nav
        data-layer="navigation"
        style={{ width: 100, background: "#e3eadc", padding: 12 }}
      >
        <strong>Workspace</strong>
        <button
          data-layer="action"
          style={{
            marginTop: 24,
            border: 0,
            padding: 8,
            background: "#c7d9b6",
          }}
        >
          Frame {time}
        </button>
      </nav>
      <section style={{ padding: 20 }}>Rendered by React</section>
    </main>
  );
}
const render = (time: number) =>
  flushSync(() => root.render(<UI time={time} />));
(window as any).tiltSource = {
  ready: () => render(0),
  sample: ({ time }: { time: number }) => {
    render(time);
    return { revision: time };
  },
};
