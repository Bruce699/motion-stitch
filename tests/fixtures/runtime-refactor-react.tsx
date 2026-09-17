import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";

let update: ((time: number) => void) | undefined;
function Fixture() {
  const [time, setTime] = useState(0);
  update = setTime;
  return (
    <main
      style={{
        width: 320,
        height: 240,
        background: "#eceef3",
        fontFamily: "sans-serif",
      }}
    >
      <div
        data-tilt-id="card"
        style={{
          position: "absolute",
          left: 20 + Math.round(time * 20),
          top: 24,
          width: 200,
          height: 140,
          padding: 12,
          boxSizing: "border-box",
          background: "#304fd0",
          color: "white",
          borderRadius: 12,
        }}
      >
        <strong>Real React source</strong>
        <p data-tilt-id="label" style={{ marginTop: 18, opacity: 0.7 }}>
          Frame {Math.round(time * 60)}
        </p>
      </div>
    </main>
  );
}
flushSync(() =>
  createRoot(document.getElementById("root")!).render(<Fixture />),
);
(window as any).tiltSource = {
  ready: async () => {
    await document.fonts.ready;
  },
  sample: async ({ time }: { time: number }) => {
    flushSync(() => update!(time));
    return { revision: time };
  },
};
