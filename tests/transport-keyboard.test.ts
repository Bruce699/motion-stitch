import { test } from "node:test";
import assert from "node:assert/strict";
import { bindTransportKeyboard } from "../src/renderer/transport-keyboard";

test("Space owns keydown and keyup, toggles once per press, and leaves other keys alone", () => {
  const target = new EventTarget();
  let toggles = 0,
    controlEvents = 0;
  const unbind = bindTransportKeyboard(target, () => toggles++);
  const control = () => controlEvents++;
  target.addEventListener("keydown", control);
  target.addEventListener("keyup", control);
  const send = (type: string, code: string, repeat = false) => {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { code, repeat });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  };
  assert.equal(send("keydown", "Space"), true);
  assert.equal(send("keydown", "Space", true), true);
  assert.equal(send("keyup", "Space"), true);
  assert.equal(toggles, 1);
  assert.equal(controlEvents, 0);
  send("keydown", "Space");
  assert.equal(toggles, 2);
  assert.equal(send("keydown", "ArrowRight"), false);
  assert.equal(controlEvents, 1);
  unbind();
  assert.equal(send("keydown", "Space"), false);
  assert.equal(toggles, 2);
});

test("Space reaches title fields, other text inputs, selects, and editable content without playback", () => {
  for (const properties of [
    { tagName: "INPUT", type: "text" },
    { tagName: "INPUT", type: "search" },
    { tagName: "INPUT", type: "number" },
    { tagName: "TEXTAREA" },
    { tagName: "SELECT" },
    { tagName: "SPAN", isContentEditable: true },
    {
      tagName: "DIV",
      getAttribute: (name: string) =>
        name === "data-transport-keys" ? "ignore" : null,
    },
    {
      tagName: "DIV",
      getAttribute: (name: string) => (name === "role" ? "textbox" : null),
    },
  ]) {
    const target = Object.assign(new EventTarget(), properties);
    let toggles = 0,
      delivered = 0;
    const unbind = bindTransportKeyboard(target, () => toggles++);
    for (const type of ["keydown", "keyup"]) {
      target.addEventListener(type, () => delivered++);
      const event = new Event(type, { cancelable: true });
      Object.assign(event, { code: "Space", key: " ", repeat: false });
      target.dispatchEvent(event);
      assert.equal(event.defaultPrevented, false, JSON.stringify(properties));
    }
    assert.equal(toggles, 0);
    assert.equal(delivered, 2);
    unbind();
  }
});

test("Space used by input composition or a modified shortcut does not toggle playback", () => {
  const target = new EventTarget();
  let toggles = 0;
  const unbind = bindTransportKeyboard(target, () => toggles++);
  for (const flag of ["isComposing", "metaKey", "ctrlKey", "altKey"]) {
    const event = new Event("keydown", { cancelable: true });
    Object.assign(event, { code: "Space", [flag]: true });
    target.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
  }
  assert.equal(toggles, 0);
  unbind();
});
