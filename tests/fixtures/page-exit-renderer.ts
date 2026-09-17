import { call, registerPageExit, viewId } from "../../src/renderer/bridge";

(window as any).exitHarness = {
  start() {
    registerPageExit(() => [
      {
        sceneId: "fixture",
        patch: { depthOfField: { focusPlane: 2.75, blur: 0.83 } },
      },
    ]);
    void call({
      type: "edit_begin",
      sceneId: "fixture",
      label: "Blur",
      kind: "gesture",
      paths: ["scene.json"],
    }).catch(() => {});
    return viewId;
  },
};
