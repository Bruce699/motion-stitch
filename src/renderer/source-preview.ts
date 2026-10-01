import type { SourceSpec } from "../core/schema";
import type { ParameterValues } from "../core/parameters";

/** The 2D source is already a browser renderer. Keep it in its own origin and
 * sample it on the editor's clock instead of reading pixels back through PNG. */
export class SourcePreview {
  readonly element = document.createElement("div");
  private frame = document.createElement("iframe");
  private port?: MessagePort;
  private serial = 0;
  private pending = new Map<
    number,
    {
      resolve: (route: string) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  private loaded: Promise<void>;
  private disposed = false;
  private loadTimer?: ReturnType<typeof setTimeout>;
  private rejectLoad?: (error: Error) => void;
  constructor(
    readonly spec: SourceSpec,
    url: string,
  ) {
    this.element.style.cssText =
      "position:absolute;inset:0;overflow:hidden;pointer-events:none;display:none";
    this.frame.title = "2D source preview";
    this.frame.tabIndex = -1;
    this.frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
    this.frame.style.cssText = `position:absolute;border:0;transform-origin:0 0;width:${spec.width}px;height:${spec.height}px;pointer-events:none`;
    this.loaded = new Promise((resolve, reject) => {
      this.rejectLoad = reject;
      this.loadTimer = setTimeout(
        () => reject(new Error("2D source preview timed out")),
        spec.readyTimeoutMs ?? 30000,
      );
      this.frame.onload = () => {
        clearTimeout(this.loadTimer);
        if (this.disposed)
          return reject(new Error("2D source preview disposed"));
        const channel = new MessageChannel();
        this.port = channel.port1;
        this.port.onmessage = ({ data }) => {
          const request = this.pending.get(data.id);
          if (!request) return;
          clearTimeout(request.timer);
          this.pending.delete(data.id);
          if (data.error) request.reject(new Error(data.error));
          else request.resolve(data.route);
        };
        this.frame.contentWindow!.postMessage(
          { type: "tilt-preview-connect" },
          new URL(url).origin,
          [channel.port2],
        );
        resolve();
      };
    });
    void this.loaded.catch(() => {});
    this.frame.src = url;
    this.element.append(this.frame);
  }
  async sample(time: number, parameters: ParameterValues) {
    if (this.element.style.display === "none") {
      this.element.style.opacity = "0";
      this.element.style.display = "block";
    }
    await this.loaded;
    if (this.disposed) throw new Error("2D source preview disposed");
    return new Promise<string>((resolve, reject) => {
      const id = ++this.serial;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("2D source sample timed out"));
      }, this.spec.sampleTimeoutMs ?? 15000);
      this.pending.set(id, { resolve, reject, timer });
      this.port!.postMessage({
        id,
        time,
        parameters,
        controlled: this.spec.sampling === "controlled",
      });
    });
  }
  layout(
    width: number,
    height: number,
    view: { zoom: number; panX: number; panY: number },
  ) {
    const scale =
      Math.min(width / this.spec.width, height / this.spec.height) * view.zoom;
    this.frame.style.transform = `translate(${(width - this.spec.width * scale) / 2 + view.panX * width}px,${(height - this.spec.height * scale) / 2 + view.panY * height}px) scale(${scale})`;
  }
  dispose() {
    this.disposed = true;
    clearTimeout(this.loadTimer);
    this.rejectLoad?.(new Error("2D source preview disposed"));
    this.frame.onload = null;
    this.port?.close();
    for (const request of this.pending.values()) {
      clearTimeout(request.timer);
      request.reject(new Error("2D source preview disposed"));
    }
    this.pending.clear();
    this.element.remove();
    this.frame.src = "about:blank";
  }
}
