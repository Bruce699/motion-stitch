'use client';
import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, useVelocity } from 'motion/react';
import { X } from 'lucide-react';
import { retargetValue } from './motion.js';
import type { SearchEntry } from './types.js';
const HOVER_TRAVEL = { stiffness: 520, damping: 34, mass: .85 };
const HOVER_PULL = { stiffness: 390, damping: 24, mass: .65 };
const HOVER_PRESENCE = { stiffness: 650, damping: 42, mass: .7 };
const HOVER_EXIT = { stiffness: 2500, damping: 72.5, mass: .65 };

export function History({ capture, hoverRow, entries, enabled, onSelect, onRemove, onReturnToInput, removeLabel }: {
  capture?: boolean; hoverRow?: number;
  entries: readonly SearchEntry[]; enabled: boolean;
  onSelect: (entry: SearchEntry) => void; onRemove?: (entry: SearchEntry) => void; onReturnToInput: () => void; removeLabel: (entry: SearchEntry) => string;
}) {
  const prefersReduced = useReducedMotion();
  const reducedMotion = !!capture || prefersReduced;
  const list = useRef<HTMLDivElement>(null);
  const activeRow = useRef<HTMLDivElement | null>(null);
  const present = useMotionValue(0);
  const y = useMotionValue(0);
  const x = useMotionValue(0);
  const rowHeight = useMotionValue(40);
  const velocity = useVelocity(y);
  const softVelocity = useSpring(velocity, { stiffness: 380, damping: 32 });
  // Motion between rows stretches the surface, then relaxes as velocity falls.
  const strain = useTransform(softVelocity, value => reducedMotion ? 0 : 5 * Math.tanh(Math.abs(value) / 750));
  const reveal = useTransform(present, value => Math.max(0, Math.min(1, value)));
  const height = useTransform(() => (rowHeight.get() + strain.get()) * reveal.get());
  const top = useTransform(() => y.get() + (rowHeight.get() - height.get()) / 2);
  const left = useTransform(() => x.get() - 2 - strain.get() * .22 + (1 - reveal.get()) * 10);
  const width = useTransform(() => `calc(100% + ${4 + strain.get() * .44 - (1 - reveal.get()) * 20}px)`);
  const radius = useTransform(() => 8 + strain.get() * .6 + Math.abs(x.get()) * .25);
  const visible = useTransform(height, value => value > 1 ? 'visible' : 'hidden');

  useEffect(() => {
    if (!capture) return;
    const row = list.current?.querySelectorAll<HTMLElement>('.svsi-history-row')[(hoverRow ?? 0) - 1];
    present.jump(row && enabled ? 1 : 0); x.jump(0);
    if (row) { y.jump(row.offsetTop); rowHeight.jump(row.offsetHeight); }
  }, [capture, hoverRow, enabled, entries, present, x, y, rowHeight]);
  function target(row: HTMLDivElement, clientX?: number, clientY?: number) {
    const first = activeRow.current === null && present.get() < .01;
    activeRow.current = row;
    const bounds = row.getBoundingClientRect();
    const nx = clientX === undefined ? 0 : (clientX - bounds.left) / bounds.width * 2 - 1;
    const ny = clientY === undefined ? 0 : (clientY - bounds.top) / bounds.height * 2 - 1;
    const pullX = reducedMotion ? 0 : Math.tanh(nx * 1.4) * 2;
    const pullY = reducedMotion ? 0 : Math.tanh(ny * 1.3);
    rowHeight.set(row.offsetHeight);
    if (reducedMotion || first) { y.jump(row.offsetTop + pullY); x.jump(pullX); }
    else {
      retargetValue(y, row.offsetTop + pullY, HOVER_TRAVEL);
      retargetValue(x, pullX, HOVER_PULL);
    }
    if (reducedMotion) present.jump(1);
    else retargetValue(present, 1, HOVER_PRESENCE);
  }
  function leave() {
    const focused = document.activeElement?.closest<HTMLDivElement>('.svsi-history-row');
    if (focused && list.current?.contains(focused)) { target(focused); return; }
    activeRow.current = null;
    if (reducedMotion) { present.jump(0); x.jump(0); }
    else { retargetValue(present, 0, HOVER_EXIT); retargetValue(x, 0, HOVER_PULL); }
  }
  useEffect(() => {
    if (!enabled || !activeRow.current?.isConnected) {
      activeRow.current = null;
      if (reducedMotion) present.jump(0);
      else retargetValue(present, 0, HOVER_EXIT);
    } else {
      // Deleting an earlier item moves the active row without remounting the mask.
      if (reducedMotion) y.jump(activeRow.current.offsetTop);
      else retargetValue(y, activeRow.current.offsetTop, HOVER_TRAVEL);
    }
  }, [entries, enabled, present, reducedMotion, y]);
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (activeRow.current?.isConnected) {
        rowHeight.set(activeRow.current.offsetHeight);
        if (reducedMotion) y.jump(activeRow.current.offsetTop);
        else retargetValue(y, activeRow.current.offsetTop, HOVER_TRAVEL);
      }
    });
    if (list.current) observer.observe(list.current);
    return () => observer.disconnect();
  }, [rowHeight, y, reducedMotion]);
  useEffect(() => () => { present.stop(); x.stop(); y.stop(); }, [present, x, y]);

  return <div className="svsi-recents" ref={list} onPointerLeave={leave}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) leave(); }}>
    {entries.length ? <>
      {entries.map((entry) => <div className="svsi-history-row" key={`${entry.query}-${entry.color}`}
        onPointerEnter={event => { if (event.pointerType !== 'touch') target(event.currentTarget, event.clientX, event.clientY); }}
        onPointerMove={event => { if (event.pointerType !== 'touch') target(event.currentTarget, event.clientX, event.clientY); }}
        onFocusCapture={event => target(event.currentTarget)}>
        <button className="svsi-history-search" onKeyDown={event => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      const buttons = Array.from(list.current!.querySelectorAll<HTMLButtonElement>('.svsi-history-search'));
      const current = buttons.findIndex(button => button.closest('.svsi-history-row')?.contains(event.target as Node));
      const next = current + (event.key === 'ArrowDown' ? 1 : -1);
      if (buttons[next]) buttons[next].focus(); else onReturnToInput();
    }} onClick={() => onSelect(entry)}><span>{entry.query || entry.color}</span>{entry.color ? <i style={{ background: entry.color }} /> : null}</button>
        {onRemove ? <button type="button" className="svsi-history-remove" aria-label={removeLabel(entry)} onClick={event => { event.stopPropagation(); onRemove(entry); }}><X size={12} /></button> : null}
      </div>)}
      <motion.div className="svsi-history-highlight" aria-hidden="true" style={{ top, left, width, height, borderRadius: radius, visibility: visible }} />
    </> : null}
  </div>;
}

