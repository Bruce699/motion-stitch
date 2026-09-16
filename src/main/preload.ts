import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("tilt", {
  invoke: (command: Record<string, unknown>) =>
    ipcRenderer.invoke("tilt:command", command),
  onChange: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("tilt:change", listener);
    return () => ipcRenderer.removeListener("tilt:change", listener);
  },
  onTransport: (
    callback: (command: { time?: number; playing?: boolean }) => void,
  ) => {
    const listener = (_event: unknown, command: any) => callback(command);
    ipcRenderer.on("tilt:transport", listener);
    return () => ipcRenderer.removeListener("tilt:transport", listener);
  },
});
