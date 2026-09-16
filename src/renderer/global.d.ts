import type { Command } from "../core/schema";
declare global {
  interface Window {
    tilt: {
      invoke: <T = any>(command: Command) => Promise<T>;
      onChange: (callback: () => void) => () => void;
      onTransport: (
        callback: (command: { time?: number; playing?: boolean }) => void,
      ) => () => void;
    };
    __tiltRender?: (time: number) => Promise<string>;
    __tiltCapture?: (time: number) => Promise<string>;
  }
}
export {};
