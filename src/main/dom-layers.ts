import type { LayerSpec } from "../core/schema";
import type { Bounds, LayerLayout } from "../core/layers";

/** Executed inside the source browser. Keep this function self-contained. */
export function planDOMLayers(
  specs: LayerSpec[],
  marker: string,
  width: number,
  height: number,
) {
  const roots = specs.map((spec) => {
    let elements: NodeListOf<Element>;
    try {
      elements = document.querySelectorAll(spec.selector);
    } catch {
      throw new Error(`Layer ${spec.id}: invalid selector ${spec.selector}`);
    }
    if (elements.length === 0 && spec.optional) return null;
    if (elements.length !== 1)
      throw new Error(
        `Layer ${spec.id}: selector must match exactly one element (matched ${elements.length}). Use a stable wrapper or mark a conditional layer optional.`,
      );
    const el = elements[0];
    if (el === document.documentElement || el === document.body)
      throw new Error(
        `Layer ${spec.id}: select a region inside body; use the base surface for the page background.`,
      );
    return el;
  });
  if (new Set(roots.filter(Boolean)).size !== roots.filter(Boolean).length)
    throw new Error("Two layers select the same element");
  const all = [...document.querySelectorAll("*")];
  const owner = (el: Element) => {
    let best = -1;
    for (let i = 0; i < roots.length; i++) {
      const root = roots[i];
      if (
        root &&
        (root === el || root.contains(el)) &&
        (best < 0 || roots[best]!.contains(root))
      )
        best = i;
    }
    return best;
  };
  const warnings = new Set<string>();
  // Read styles and geometry before touching the DOM, to avoid layout thrash.
  const records = all.map((el) => {
    const style = getComputedStyle(el),
      index = owner(el);
    if (index >= 0 && style.backdropFilter !== "none")
      warnings.add(
        `${specs[index].id}: backdrop-filter needs the backdrop; group it with its background or supply an explicit source.`,
      );
    if (index >= 0 && style.mixBlendMode !== "normal")
      warnings.add(
        `${specs[index].id}: mix-blend-mode depends on other layers; group the blend dependency.`,
      );
    if (el.shadowRoot)
      throw new Error(
        `Shadow DOM needs an explicit source adapter or a precomposed surface before separating this page into layers.`,
      );
    const r = el.getBoundingClientRect();
    return {
      el,
      index,
      visible: style.visibility === "visible" && style.display !== "none",
      before: getComputedStyle(el, "::before").visibility === "visible",
      after: getComputedStyle(el, "::after").visibility === "visible",
      rect: { x: r.x, y: r.y, width: r.width, height: r.height },
    };
  });
  const regions = specs.map((spec, i) => {
    const el = roots[i];
    const zero = { x: 0, y: 0, width: 0, height: 0 };
    if (!el)
      return {
        id: spec.id,
        parentId: null,
        bounds: zero,
        crop: zero,
        visible: false,
      };
    let parent = -1;
    for (let n = 0; n < roots.length; n++)
      if (
        n !== i &&
        roots[n]?.contains(el) &&
        (parent < 0 || roots[parent]!.contains(roots[n]))
      )
        parent = n;
    const record = records.find((r) => r.el === el)!;
    if (parent > i)
      throw new Error(
        `Declare parent layer ${specs[parent].id} before child ${spec.id} to preserve paint order`,
      );
    let bounds = { ...record.rect };
    let left = bounds.width ? bounds.x : Infinity,
      top = bounds.height ? bounds.y : Infinity,
      right = bounds.width ? bounds.x + bounds.width : -Infinity,
      bottom = bounds.height ? bounds.y + bounds.height : -Infinity;
    let hasVisibleContent = false;
    for (const r of records)
      if (r.index === i && r.visible && r.rect.width && r.rect.height) {
        hasVisibleContent = true;
        left = Math.min(left, r.rect.x);
        top = Math.min(top, r.rect.y);
        right = Math.max(right, r.rect.x + r.rect.width);
        bottom = Math.max(bottom, r.rect.y + r.rect.height);
      }
    if (!Number.isFinite(left)) {
      left = 0;
      top = 0;
      right = 0;
      bottom = 0;
    }
    if (!bounds.width || !bounds.height)
      bounds = { x: left, y: top, width: right - left, height: bottom - top };
    left = Math.max(0, Math.floor(left - spec.padding));
    top = Math.max(0, Math.floor(top - spec.padding));
    right = Math.min(width, Math.ceil(right + spec.padding));
    bottom = Math.min(height, Math.ceil(bottom + spec.padding));
    const crop = {
      x: left,
      y: top,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top),
    };
    // Group opacity/filter across extracted descendants cannot be reconstructed by independent textures.
    for (
      let ancestor = el.parentElement;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      const style = getComputedStyle(ancestor);
      if (style.filter !== "none" || Number(style.opacity) < 1) {
        warnings.add(
          `${spec.id}: an ancestor applies opacity/filter across the group; lift that ancestor as one layer for exact compositing.`,
        );
        break;
      }
    }
    return {
      id: spec.id,
      parentId: parent < 0 ? null : specs[parent].id,
      bounds,
      crop,
      visible:
        hasVisibleContent &&
        bounds.width > 0 &&
        bounds.height > 0 &&
        crop.width > 0 &&
        crop.height > 0,
    };
  });
  // A private attribute lets user-origin CSS hide paint without removing layout.
  // Restore exactly in finally, including any pre-existing attribute values.
  const restore = records.map(({ el }) => ({
    el,
    value: el.getAttribute(marker),
    before: el.getAttribute(marker + "-before"),
    after: el.getAttribute(marker + "-after"),
  }));
  for (const r of records) {
    const id = r.index < 0 ? "base" : specs[r.index].id;
    r.el.setAttribute(marker, r.visible ? id : "@hidden");
    r.el.setAttribute(
      marker + "-before",
      r.before && r.visible ? id : "@hidden",
    );
    r.el.setAttribute(marker + "-after", r.after && r.visible ? id : "@hidden");
  }
  (window as any).__tiltRestoreLayers = () => {
    for (const r of restore) {
      for (const [attr, value] of [
        [marker, r.value],
        [marker + "-before", r.before],
        [marker + "-after", r.after],
      ] as const) {
        if (value === null) r.el.removeAttribute(attr);
        else r.el.setAttribute(attr, value);
      }
    }
    delete (window as any).__tiltRestoreLayers;
  };
  return { regions, warnings: [...warnings] };
}

export function isolationCSS(marker: string, id: string) {
  const scope = `html[${marker}-pass="${id}"]`;
  const show = `[${marker}="${id}"]`;
  return `${scope} [${marker}]{visibility:hidden!important}${scope} [${marker}]::before,${scope} [${marker}]::after{visibility:hidden!important}${scope} ${show}{visibility:visible!important}${scope} [${marker}-before="${id}"]::before,${scope} [${marker}-after="${id}"]::after{visibility:visible!important}${id === "base" ? "" : `${scope},${scope} body{background:transparent!important;background-image:none!important}`}`;
}
