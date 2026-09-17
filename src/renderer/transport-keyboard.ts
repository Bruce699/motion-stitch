/** Space belongs to transport, even when a control or text field has focus. */
export function bindTransportKeyboard(target: EventTarget, toggle: () => void) {
  const handle = (event: Event) => {
    const key = event as KeyboardEvent;
    if (key.code !== "Space" && key.key !== " ") return;
    key.preventDefault();
    key.stopImmediatePropagation();
    // Consume release too: native buttons otherwise activate on keyup.
    if (key.type === "keydown" && !key.repeat) toggle();
  };
  const options = { capture: true };
  target.addEventListener("keydown", handle, options);
  target.addEventListener("keyup", handle, options);
  return () => {
    target.removeEventListener("keydown", handle, options);
    target.removeEventListener("keyup", handle, options);
  };
}
