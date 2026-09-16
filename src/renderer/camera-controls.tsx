import {
  CAMERA_STOPS,
  defaultCamera,
  type CameraSettings,
} from "../core/camera";
import type { SceneDocument } from "../core/schema";
import { call } from "./bridge";
import { queueControlEdit } from "./control-edits";
import { SegmentedControl } from "./vendor/dialkit/components/SegmentedControl";
import { SelectControl } from "./vendor/dialkit/components/SelectControl";

export function CameraControls({
  camera,
  sources,
  sceneId,
  reportError,
}: {
  camera?: CameraSettings;
  sources: SceneDocument["sources"];
  sceneId: string;
  reportError: (error: unknown) => void;
}) {
  const settings = camera ?? defaultCamera();
  const change = (patch: Partial<CameraSettings>) => {
    void queueControlEdit(() =>
      call({ type: "set_camera", sceneId, patch }),
    ).catch(reportError);
  };
  return (
    <div className="camera-controls">
      <SegmentedControl
        label="Camera projection"
        value={settings.projection}
        options={[
          { value: "perspective", label: "Perspective" },
          { value: "orthographic", label: "Isometric" },
        ]}
        onChange={(projection) => change({ projection })}
      />
      {settings.projection === "orthographic" && (
        <>
          <SegmentedControl
            label="Isometric angle"
            value={settings.preset}
            options={Object.entries(CAMERA_STOPS).map(([value, stop]) => ({
              value: value as CameraSettings["preset"],
              label: stop.label,
            }))}
            onChange={(preset) => change({ preset })}
          />
          {settings.preset !== "front" && (
            <SegmentedControl
              label="Isometric side"
              value={settings.side}
              options={[
                { value: "left", label: "Left" },
                { value: "right", label: "Right" },
              ]}
              onChange={(side) => change({ side })}
            />
          )}
          {sources.length > 1 && (
            <SelectControl
              label="Align to"
              value={settings.sourceId ?? sources[0].id}
              options={sources.map((source) => ({
                value: source.id,
                label: source.id,
              }))}
              onChange={(sourceId) => change({ sourceId })}
            />
          )}
        </>
      )}
    </div>
  );
}
