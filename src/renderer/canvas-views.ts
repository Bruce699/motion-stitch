import { compositionCameras } from "../core/compositions";
import type { SceneDocument } from "../core/schema";

export type CanvasViewChoice = {
  value: string;
  label: string;
  mode: "source" | "camera";
  cameraId?: string;
  shortcut?: "1" | "2";
};

/** Native compositions expose authored views; browser sources keep their direct 2D view. */
export function canvasViewChoices(
  document?: SceneDocument,
): CanvasViewChoice[] {
  if (document?.sources.length === 0) {
    const cameras = compositionCameras(document);
    if (cameras.length > 1)
      return cameras.map((camera, index) => ({
        value: `camera:${camera.id}`,
        label: camera.name,
        mode: "camera",
        cameraId: camera.id,
        shortcut: index === 0 ? "1" : index === 1 ? "2" : undefined,
      }));
    return [
      { value: "camera", label: "Camera", mode: "camera", shortcut: "2" },
    ];
  }
  return [
    { value: "source", label: "2D", mode: "source", shortcut: "1" },
    { value: "camera", label: "Camera", mode: "camera", shortcut: "2" },
  ];
}

export function selectedCanvasView(
  choices: CanvasViewChoice[],
  mode: "source" | "camera",
  cameraId: string,
) {
  return (
    choices.find((choice) =>
      choice.cameraId ? choice.cameraId === cameraId : choice.mode === mode,
    ) ?? choices[0]
  ).value;
}
