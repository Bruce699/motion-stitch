import React, { useState, useSyncExternalStore } from "react";
import type { ProjectState, SceneDocument } from "../core/schema";
import { compositionCameras, type CompositionClip } from "../core/compositions";
import { NumberValue, ParameterControl } from "./parameters";
import { SelectControl } from "./vendor/dialkit/components/SelectControl";
import { Icon } from "./icons";
import { call } from "./bridge";
import { queueControlEdit } from "./control-edits";
import type { PlayheadStore } from "./playhead-store";

export function ProjectBrowser({
  state,
  onOpen,
  onAdd,
  reportError,
}: {
  state: ProjectState;
  onOpen: (id: string) => void;
  onAdd: (id: string) => void;
  reportError: (e: unknown) => void;
}) {
  const [creating, setCreating] = useState(false),
    [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <nav className="project-browser" aria-label="Project compositions">
      <div className="project-heading">
        <span>Compositions</span>
        <button
          className="ui-button icon-button"
          aria-label="New composition"
          title="New composition"
          onClick={() => setCreating(true)}
        >
          <Icon name="plus" />
        </button>
      </div>
      {creating && (
        <form
          className="new-composition"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim() || pending) return;
            setPending(true);
            void call({ type: "create", name: name.trim() })
              .then(() => {
                setCreating(false);
                setName("");
              })
              .catch(reportError)
              .finally(() => setPending(false));
          }}
        >
          <input
            autoFocus
            className="ui-input"
            aria-label="New composition name"
            placeholder="Composition name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setCreating(false);
            }}
          />
          <button className="ui-button" disabled={pending || !name.trim()}>
            Create
          </button>
        </form>
      )}
      <div className="composition-list">
        {state.scenes.map((composition) => (
          <div
            className="composition-list-row"
            key={composition.id}
            data-active={composition.id === state.scene.id || undefined}
          >
            <button
              className="composition-link"
              draggable
              onDragStart={(event) =>
                event.dataTransfer.setData(
                  "application/x-tilt-composition",
                  composition.id,
                )
              }
              aria-current={
                composition.id === state.scene.id ? "page" : undefined
              }
              onClick={() => onOpen(composition.id)}
            >
              {composition.name}
            </button>
            {composition.id !== state.scene.id && (
              <button
                className="ui-button icon-button insert-composition"
                aria-label={`Insert ${composition.name}`}
                title={`Insert ${composition.name}`}
                onClick={() => onAdd(composition.id)}
              >
                <Icon name="plus" />
              </button>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}

export function CameraPicker({
  document,
  selectedId,
  onSelect,
  reportError,
}: {
  document: SceneDocument;
  selectedId: string;
  onSelect: (id: string) => void;
  reportError: (e: unknown) => void;
}) {
  const [editing, setEditing] = useState(false),
    [name, setName] = useState("");
  const cameras = compositionCameras(document);
  const selected =
    cameras.find((camera) => camera.id === selectedId) ?? cameras[0];
  const command = (type: string, args: Record<string, unknown>) =>
    queueControlEdit(() => call({ type, sceneId: document.id, ...args }));
  return (
    <div className="camera-picker">
      <SelectControl
        label="Preview camera"
        value={selected.id}
        options={cameras.map((camera) => ({
          value: camera.id,
          label: camera.name,
        }))}
        onChange={onSelect}
      />
      <div className="camera-actions">
        <button
          className="ui-button"
          onClick={() =>
            void command("add_camera", {
              from: selected.id,
              name: `Camera ${cameras.length + 1}`,
            })
              .then((doc) => onSelect(doc.cameras.at(-1).id))
              .catch(reportError)
          }
        >
          Add camera
        </button>
        <button
          className="ui-button"
          onClick={() => {
            setName(selected.name);
            setEditing(true);
          }}
        >
          Rename
        </button>
        <button
          className="ui-button"
          disabled={selected.id === (document.defaultCameraId ?? "main")}
          onClick={() =>
            void command("camera_metadata", {
              cameraId: selected.id,
              makeDefault: true,
            }).catch(reportError)
          }
        >
          {selected.id === (document.defaultCameraId ?? "main")
            ? "Output camera"
            : "Use for output"}
        </button>
      </div>
      {editing && (
        <form
          className="camera-rename"
          onSubmit={(event) => {
            event.preventDefault();
            void command("camera_metadata", { cameraId: selected.id, name })
              .then(() => setEditing(false))
              .catch(reportError);
          }}
        >
          <input
            className="ui-input"
            autoFocus
            aria-label="Camera name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setEditing(false);
            }}
          />
          <button className="ui-button" disabled={!name.trim()}>
            Save
          </button>
        </form>
      )}
    </div>
  );
}

export function ClipInspector({
  clip,
  parent,
  source,
  playhead,
  onOpen,
  onDeselect,
  reportError,
}: {
  clip: CompositionClip;
  parent: SceneDocument;
  source: SceneDocument;
  playhead: PlayheadStore;
  onOpen: () => void;
  onDeselect: () => void;
  reportError: (e: unknown) => void;
}) {
  const time = useSyncExternalStore(playhead.subscribe, playhead.getSnapshot);
  const command = (type: string, args: Record<string, unknown> = {}) =>
    call({ type, sceneId: parent.id, id: clip.id, ...args });
  const patch = (patch: Record<string, unknown>) => {
    void queueControlEdit(() => command("set_clip", { patch })).catch(
      reportError,
    );
  };
  const length = clip.end - clip.start;
  return (
    <fieldset className="parameter-group clip-inspector">
      <legend>
        {clip.label}
        <button
          className="context-dismiss"
          aria-label="Deselect clip"
          onClick={onDeselect}
        >
          <Icon name="close" />
        </button>
      </legend>
      <div className="clip-actions">
        <button className="ui-button" onClick={onOpen}>
          Open composition
        </button>
        <button
          className="ui-button"
          disabled={time <= clip.start || time >= clip.end}
          onClick={() =>
            void queueControlEdit(() => command("split_clip", { time })).catch(
              reportError,
            )
          }
        >
          Split
        </button>
        <button
          className="ui-button"
          onClick={() =>
            void queueControlEdit(() => command("remove_clip")).catch(
              reportError,
            )
          }
        >
          Remove
        </button>
      </div>
      <SelectControl
        label="Camera"
        value={clip.cameraId ?? "default"}
        options={[
          { value: "default", label: "Follow composition" },
          ...compositionCameras(source).map((camera) => ({
            value: camera.id,
            label: camera.name,
          })),
        ]}
        onChange={(cameraId) =>
          patch({ cameraId: cameraId === "default" ? null : cameraId })
        }
      />
      <div className="field-pair">
        <label className="field">
          <span>Start</span>
          <NumberValue
            label="Clip start"
            value={clip.start}
            min={0}
            max={parent.duration - length}
            step={1 / parent.fps}
            onCommit={(start) => {
              void queueControlEdit(() =>
                command("trim_clip", {
                  timing: { start, end: start + length },
                }),
              ).catch(reportError);
            }}
          />
        </label>
        <label className="field">
          <span>Duration</span>
          <NumberValue
            label="Clip duration"
            value={length}
            min={1 / parent.fps}
            max={Math.min(
              parent.duration - clip.start,
              (source.duration - clip.sourceIn) / clip.speed,
            )}
            step={1 / parent.fps}
            onCommit={(duration) => {
              void queueControlEdit(() =>
                command("trim_clip", {
                  timing: { start: clip.start, end: clip.start + duration },
                }),
              ).catch(reportError);
            }}
          />
        </label>
      </div>
      <div className="source-window">
        <span>
          Source range · {clip.sourceIn.toFixed(2)}–
          {(clip.sourceIn + length * clip.speed).toFixed(2)} s
        </span>
        <div className="source-range-track">
          <div
            className="source-range-window"
            style={{
              left: `${(clip.sourceIn / source.duration) * 100}%`,
              width: `${((length * clip.speed) / source.duration) * 100}%`,
            }}
          />
        </div>
        {source.duration - length * clip.speed > 1e-8 && (
          <ParameterControl
            name="sourceIn"
            sceneId={parent.id}
            parameter={{
              type: "number",
              label: "Source start",
              value: clip.sourceIn,
              min: 0,
              max: source.duration - length * clip.speed,
              step: 0.01,
              unit: "s",
              control: "slider",
            }}
            reportError={reportError}
            onValue={(sourceIn) => command("set_clip", { patch: { sourceIn } })}
          />
        )}
      </div>
      <label className="field">
        <span>Speed</span>
        <NumberValue
          label="Clip speed"
          value={clip.speed}
          min={0.01}
          max={Math.min(100, (source.duration - clip.sourceIn) / length)}
          step={0.1}
          onCommit={(speed) => patch({ speed })}
        />
      </label>
      <details className="clip-transform">
        <summary>Transform</summary>
        <ParameterControl
          name="position"
          sceneId={parent.id}
          parameter={{
            type: "vector3",
            label: "Position",
            value: clip.position,
            min: -100,
            max: 100,
            step: 0.01,
          }}
          reportError={reportError}
          onValue={(position) => command("set_clip", { patch: { position } })}
        />
        <ParameterControl
          name="scale"
          sceneId={parent.id}
          parameter={{
            type: "number",
            label: "Scale",
            value: clip.scale,
            min: 0.01,
            max: Math.max(10, clip.scale),
            step: 0.01,
            control: "slider",
          }}
          reportError={reportError}
          onValue={(scale) => command("set_clip", { patch: { scale } })}
        />
        <ParameterControl
          name="opacity"
          sceneId={parent.id}
          parameter={{
            type: "number",
            label: "Opacity",
            value: clip.opacity,
            min: 0,
            max: 1,
            step: 0.01,
            control: "slider",
          }}
          reportError={reportError}
          onValue={(opacity) => command("set_clip", { patch: { opacity } })}
        />
      </details>
      {(source.exposedParameters ?? []).map((key) => {
        const binding = clip.bindings[key];
        const value = binding
          ? parent.parameters[binding].value
          : (clip.overrides[key] ?? source.parameters[key].value);
        return (
          <div className="clip-parameter" key={key}>
            <ParameterControl
              name={key}
              sceneId={parent.id}
              parameter={{ ...source.parameters[key], value } as any}
              reportError={reportError}
              onValue={(value) => command("clip_parameter", { key, value })}
            />
            <div className="clip-parameter-actions">
              <button
                className="ui-button"
                disabled={!binding && !Object.hasOwn(clip.overrides, key)}
                onClick={() =>
                  void queueControlEdit(() =>
                    command("clip_parameter", { key, reset: true }),
                  ).catch(reportError)
                }
              >
                Reset
              </button>
              <button
                className="ui-button"
                disabled={!!binding}
                onClick={() =>
                  void queueControlEdit(() =>
                    command("clip_parameter", { key, expose: true }),
                  ).catch(reportError)
                }
              >
                {binding ? "Exposed" : "Expose"}
              </button>
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}
