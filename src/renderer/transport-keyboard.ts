/** Text entry keeps Space; elsewhere it controls transport once per press. */
export function bindTransportKeyboard(target: EventTarget, toggle: () => void) {
  const handle = (event: Event) => {
    const key = event as KeyboardEvent;
    if (key.code !== "Space" && key.key !== " ") return;
    if (key.isComposing || key.metaKey || key.ctrlKey || key.altKey) return;
    const editing = key.composedPath().some((node) => {
      const element = node as HTMLElement;
      const tag = element.tagName?.toLowerCase();
      return (
        element.getAttribute?.("data-transport-keys") === "ignore" ||
        element.isContentEditable ||
        tag === "textarea" ||
        tag === "select" ||
        (tag === "input" &&
          ![
            "button",
            "submit",
            "reset",
            "checkbox",
            "radio",
            "range",
            "color",
          ].includes((element as HTMLInputElement).type)) ||
        ["textbox", "searchbox", "combobox"].includes(
          element.getAttribute?.("role") ?? "",
        )
      );
    });
    if (editing) return;
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
