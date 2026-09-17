import {
  cameraAngles,
  defaultCamera,
  defaultDepthOfField,
  type CameraSettings,
} from "../core/camera";
import { useEffect, useRef, useState } from "react";
import type { SceneDocument } from "../core/schema";
import { call } from "./bridge";
import { queueControlEdit } from "./control-edits";
import { SegmentedControl } from "./vendor/dialkit/components/SegmentedControl";
import { SelectControl } from "./vendor/dialkit/components/SelectControl";
import { Slider } from "./vendor/dialkit/components/Slider";
import { Toggle } from "./vendor/dialkit/components/Toggle";
import type { LensPreview } from "./camera-gesture";

function CameraAngle({
  field,
  settings,
  sceneId,
  reportError,
  lensPreview,
}: {
  field:
    | "rotation"
    | "elevation"
    | "roll"
    | "zoom"
    | "panX"
    | "panY"
    | "focusPlane"
    | "blur";
  settings: CameraSettings;
  sceneId: string;
  reportError: (error: unknown) => void;
  lensPreview?: LensPreview;
}) {
  const isDepth = field === "focusPlane" || field === "blur";
  const value = isDepth
    ? (settings.depthOfField ?? defaultDepthOfField())[field]
    : field === "rotation" || field === "elevation"
      ? cameraAngles(settings)[field]
      : (settings[field] ?? (field === "zoom" ? 1 : 0));
  const angular = ["rotation", "elevation", "roll"].includes(field);
  const [draft, setDraft] = useState(value);
  const active = useRef(false),
    pending = useRef(0);
  const gesture = useRef<{
    group: string | null;
    failed: boolean;
    value?: number;
    ticket?: number;
  } | null>(null);
  const latest = useRef(value);
  latest.current = value;
  const live = useRef(lensPreview);
  live.current = lensPreview;
  useEffect(() => {
    if (!active.current && !pending.current) setDraft(value);
  }, [value]);
  const enqueue = (operation: () => Promise<unknown>) => {
    pending.current++;
    void queueControlEdit(operation)
      .catch((error) => {
        reportError(error);
      })
      .finally(() => {
        pending.current--;
        if (!active.current && !pending.current) setDraft(latest.current);
      });
  };
  const finish = () => {
    if (!active.current) return;
    active.current = false;
    const edit = gesture.current;
    gesture.current = null;
    if (!edit) return;
    enqueue(async () => {
      try {
        if (edit.group) {
          try {
            if (
              isDepth &&
              live.current &&
              edit.value !== undefined &&
              !edit.failed
            )
              await call({
                type: "set_camera",
                sceneId,
                patch: { depthOfField: { [field]: edit.value } },
              });
          } finally {
            await call({ type: "edit_apply", sceneId, id: edit.group });
            edit.group = null;
          }
        }
      } finally {
        if (edit.ticket !== undefined) await live.current?.settled(edit.ticket);
      }
    });
  };
  useEffect(() => () => finish(), []);
  const label = {
    rotation: "Rotation",
    elevation: "Elevation",
    roll: "Roll",
    zoom: "Zoom",
    panX: "Pan X",
    panY: "Pan Y",
    focusPlane: "Focus plane",
    blur: "Blur",
  }[field];
  return (
    <Slider
      label={label}
      value={draft}
      min={
        field === "focusPlane"
          ? Math.min(-10, value)
          : field === "blur"
            ? 0
            : field === "zoom"
              ? 0.1
              : field === "elevation"
                ? 0
                : angular
                  ? -180
                  : -2
      }
      max={
        field === "focusPlane"
          ? Math.max(10, value)
          : field === "blur"
            ? 1
            : field === "zoom"
              ? 12
              : field === "elevation"
                ? 90
                : angular
                  ? 180
                  : 2
      }
      step={angular ? (settings.projection === "orthographic" ? 5 : 1) : 0.01}
      discrete={angular}
      unit={angular ? "°" : undefined}
      onInteractionStart={() => {
        if (active.current) return;
        active.current = true;
        const edit = { group: null, failed: false } as NonNullable<
          typeof gesture.current
        >;
        gesture.current = edit;
        enqueue(async () => {
          try {
            const result = await call({
              type: "edit_begin",
              sceneId,
              label,
              kind: "gesture",
              paths: ["scene.json"],
            });
            edit.group = result.id;
          } catch (error) {
            edit.failed = true;
            if (gesture.current === edit) setDraft(latest.current);
            if (edit.ticket !== undefined) {
              await live.current?.settled(edit.ticket);
              edit.ticket = undefined;
            }
            throw error;
          }
        });
      }}
      onInteractionEnd={finish}
      onChange={(next) => {
        if (gesture.current?.failed) {
          setDraft(latest.current);
          return;
        }
        setDraft(next);
        if (isDepth && live.current) {
          const ticket = live.current.change(field, next);
          if (active.current && gesture.current) {
            gesture.current.value = next;
            gesture.current.ticket = ticket;
          } else {
            // Keyboard steps and typed values have no held pointer gesture.
            enqueue(async () => {
              try {
                await call({
                  type: "set_camera",
                  sceneId,
                  patch: { depthOfField: { [field]: next } },
                });
              } finally {
                await live.current?.settled(ticket);
              }
            });
          }
          return;
        }
        enqueue(() =>
          call({
            type: "set_camera",
            sceneId,
            patch: isDepth
              ? { depthOfField: { [field]: next } }
              : { [field]: next },
          }),
        );
      }}
    />
  );
}

export function CameraControls({
  camera,
  sources,
  sceneId,
  reportError,
  lensPreview,
}: {
  camera?: CameraSettings;
  sources: SceneDocument["sources"];
  sceneId: string;
  reportError: (error: unknown) => void;
  lensPreview?: LensPreview;
}) {
  const settings = camera ?? defaultCamera();
  const depthOfField = settings.depthOfField ?? defaultDepthOfField();
  const change = (
    patch: Omit<Partial<CameraSettings>, "depthOfField"> & {
      depthOfField?: Partial<ReturnType<typeof defaultDepthOfField>>;
    },
  ) => {
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
          { value: "orthographic", label: "Orthographic" },
        ]}
        onChange={(projection) => change({ projection })}
      />
      {
        <>
          {(
            ["rotation", "elevation", "roll", "zoom", "panX", "panY"] as const
          ).map((field) => (
            <CameraAngle
              key={field}
              field={field}
              settings={settings}
              sceneId={sceneId}
              reportError={reportError}
            />
          ))}
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
      }
      <div role="group" aria-label="Depth of field">
        <Toggle
          label="Depth of field"
          checked={depthOfField.enabled}
          onChange={(enabled) => change({ depthOfField: { enabled } })}
        />
      </div>
      {depthOfField.enabled &&
        (["focusPlane", "blur"] as const).map((field) => (
          <CameraAngle
            key={sceneId + field}
            field={field}
            settings={settings}
            sceneId={sceneId}
            reportError={reportError}
            lensPreview={lensPreview}
          />
        ))}
    </div>
  );
}
