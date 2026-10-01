'use client';

import { useEffect, useLayoutEffect, type RefObject } from 'react';

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// Trim the invisible font space, while retaining the rows' 40px interaction tracks.
export function useOpticalPanelPadding(ref: RefObject<HTMLDivElement | null>, contentKey: string) {
  useBrowserLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    const context = document.createElement('canvas').getContext('2d');
    if (!context) return;
    const measure = () => {
      const scale = panel.getBoundingClientRect().width / panel.offsetWidth;
      if (!scale) return;
      const ink = (element: HTMLElement) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const rect = range.getBoundingClientRect();
        const css = getComputedStyle(element);
        context.font = `${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
        const metrics = context.measureText(element.textContent ?? '');
        if (!Number.isFinite(metrics.fontBoundingBoxAscent)) return { top: rect.top / scale, bottom: rect.bottom / scale };
        const baseline = rect.top / scale + (rect.height / scale - metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2 + metrics.fontBoundingBoxAscent;
        return { top: baseline - metrics.actualBoundingBoxAscent, bottom: baseline + metrics.actualBoundingBoxDescent };
      };
      const heading = panel.querySelector<HTMLElement>('.svsi-panel-heading');
      const title = heading?.querySelector<HTMLElement>('span');
      if (heading && title) {
        const trim = ink(title).top - heading.getBoundingClientRect().top / scale;
        panel.style.setProperty('--svsi-heading-trim', `${Math.max(0, trim)}px`);
      }
      const rows = panel.querySelectorAll<HTMLElement>('.svsi-history-row');
      const last = rows.item(rows.length - 1);
      const label = last?.querySelector<HTMLElement>('.svsi-history-search > span:not(.svsi-sr-only)');
      const trim = last && label ? last.getBoundingClientRect().bottom / scale - ink(label).bottom : 0;
      panel.style.setProperty('--svsi-content-trim', `${Math.max(0, trim)}px`);
    };
    measure();
    let disposed = false;
    void document.fonts.ready.then(() => { if (!disposed) measure(); });
    return () => { disposed = true; };
  }, [ref, contentKey]);
}
