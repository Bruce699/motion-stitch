'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { animate } from 'motion';
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionStyle } from 'motion/react';
import { Check, Search, X, Image as ImageIcon } from 'lucide-react';
import { History } from './history.js';
import { useOpticalPanelPadding } from './optical-padding.js';
import { BAR, RISE, PANEL, PANEL_RISE, PANEL_RETURN, PANEL_FALL, PANEL_SHRINK, CLOSE, WHEEL_INTRO_DURATION, retargetValue } from './motion.js';
import { createRequestGate } from './requests.js';
import type { SearchEntry, SearchLabels, SaveeSearchInputProps } from './types.js';

type CaptureGeometry = {width:number;height:number;rise:number;panelWidth:number;panelHeight:number;lift:number;wheel:number;wheelX:number;wheelEntrance:number};
let geometryWriter: ((g:CaptureGeometry)=>void) | undefined;
export function applyCaptureGeometry(g:CaptureGeometry){geometryWriter?.(g);}
const EMPTY: readonly SearchEntry[] = [];
const DEFAULT_LABELS: SearchLabels = {
  search: 'Search saved images', placeholder: 'Search your saves', compactPlaceholder: 'Search',
  recent: 'Recent', suggestions: 'Suggestions', clearHistory: 'Clear', close: 'Close search options',
  clearSearch: 'Clear search', color: 'Search by color', image: 'Search by image',
  chooseImage: 'Choose an image', imageHelp: '', quickColors: 'Quick colors', loading: 'Searching…', error: 'Search could not be completed.',
  retry: 'Retry', suggestionsError: 'Suggestions are unavailable. You can still search.',
  removeRecent: entry => `Remove ${entry.query || entry.color} from history`,
  editQuery: query => `Edit search: ${query}`, removeQuery: query => `Remove search: ${query}`,
  selectColor: color => `Search color ${color}`, removeColor: 'Remove selected color',
};

export function SaveeSearchInput({
  value, onSearch, onSelectResult, onQueryChange, recentSearches = EMPTY, onRecentSearchesChange, getSuggestions,
  colors, quickColors, onImageSearch, labels: overrides, widths, debounceMs = 160, keyboardShortcut = false,
  capture, scrollContainer, hidden = false, className = '', style,
}: SaveeSearchInputProps) {
  const labels = { ...DEFAULT_LABELS, ...overrides };
  const idleWidth = widths?.idle ?? 360, expandedWidth = widths?.expanded ?? 500;
  const filteredWidth = widths?.filtered ?? 430, loadingWidth = widths?.loading ?? 390;
  const id = useId();
  const dock = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const panelElement = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  const valueKey = JSON.stringify([value.query, value.color]);
  const [draft, setDraft] = useState({ key: valueKey, text: '' });
  const query = capture ? capture.query : draft.key === valueKey ? draft.text : '';
  const setQuery = (text: string) => setDraft({ key: valueKey, text });
  useEffect(() => { onQueryChange?.(query); }, [onQueryChange, query]);
  const [liveExpanded, setExpanded] = useState(false);
  const expanded = capture ? capture.expanded ?? ['recent','suggestions','color','image','empty'].includes(capture.state) : liveExpanded;
  const [paletteCursor, setPaletteCursor] = useState(0);
  const resetScroll = useRef<(() => void) | null>(null);
  const lastPanelHeight = useRef(0);
  const lastPanelOpen = useRef(false);
  const [livePanel, setPanel] = useState<'recent' | 'color' | 'image'>('recent');
  const panel = capture ? capture.panel ?? (capture.state === 'color' ? 'color' : capture.state === 'image' ? 'image' : 'recent') : livePanel;
  const [suggestionResult, setSuggestionResult] = useState<{ query: string; entries: readonly SearchEntry[]; error: boolean; provider?: typeof getSuggestions }>({ query: '', entries: EMPTY, error: false });
  const suggestions = capture ? capture.suggestions : suggestionResult.query === query.trim() && suggestionResult.provider === getSuggestions ? suggestionResult.entries : EMPTY;
  const suggestionError = suggestionResult.query === query.trim() && suggestionResult.provider === getSuggestions && suggestionResult.error;
  const [liveLoading, setLoading] = useState(false);
  const loading = capture ? capture.state === 'loading' : liveLoading;
  const [liveFailed, setFailed] = useState(false);
  const failed = capture ? capture.state === 'error' : liveFailed;
  const [scrollSuppressed, setScrollHidden] = useState(false);
  const scrollHidden = hidden || scrollSuppressed;
  useEffect(() => { if (hidden) { setExpanded(false); input.current?.blur(); } }, [hidden]);
  const retry = useRef<(() => void) | null>(null);
  const searchGate = useRef(createRequestGate());
  const suggestionGate = useRef(createRequestGate());
  const prefersReduced = useReducedMotion();
  const reduced = !!capture || prefersReduced;
  const width = useMotionValue(66);
  const height = useMotionValue(14);
  const rise = useMotionValue(112);
  const panelWidth = useMotionValue(0);
  const panelHeight = useMotionValue(0);
  const lift = useMotionValue(112);
  const wheel = useMotionValue(0);
  const wheelX = useMotionValue(0);
  const wheelEntrance = useMotionValue(0);
  useEffect(() => {
    const write=(g:CaptureGeometry)=>{width.jump(g.width);height.jump(g.height);rise.jump(g.rise);panelWidth.jump(g.panelWidth);panelHeight.jump(g.panelHeight);lift.jump(g.lift);wheel.jump(g.wheel);wheelX.jump(g.wheelX);wheelEntrance.jump(g.wheelEntrance);};
    geometryWriter=write;
    return()=>{if(geometryWriter===write)geometryWriter=undefined;};
  },[width,height,rise,panelWidth,panelHeight,lift,wheel,wheelX,wheelEntrance]);
  const wheelTarget = useRef(0);
  const wheelStage = useRef<{ key: string; rank: number } | null>(null);
  const wheelInteraction = useRef({ expanded: false, typing: false });
  const entered = useRef(false);
  const wasHidden = useRef(false);
  const panelVisible = useTransform(panelHeight, n => n > 1 ? 'visible' : 'hidden');
  const safePanelHeight = useTransform(panelHeight, n => Math.max(0, n));
  const safePanelWidth = useTransform(panelWidth, n => Math.max(0, n));
  const panelRadius = useTransform(panelHeight, n => Math.max(0, Math.min(19, n / 2)));
  const panelClip = useTransform(() => `inset(0px 0px ${Math.max(0, lift.get() - height.get() - 12)}px 0px)`);
  const barShadowOpacity = useTransform(height, [14, 52], [0, 1]);
  const panelShadowOpacity = useTransform(() => Math.min(1, safePanelHeight.get() / 100) * Math.max(0, Math.min(1, 1 - lift.get() / (height.get() + 12))));
  const padding = useTransform(height, n => Math.max(0, (n - 40) / 2));
  const radius = useTransform(height, n => Math.max(0, n / 2));
  const suggesting = !!query.trim();
  const entries = suggesting ? suggestions : recentSearches.slice(0, 3);
  const panelOpen = expanded && (panel !== 'recent' || entries.length > 0 || suggestionError);
  const [size, setSize] = useState({ width: 500, height: 0 });
  const contentKey = JSON.stringify([panel, entries, labels.recent, labels.suggestions, labels.color, labels.image]);
  useOpticalPanelPadding(content, contentKey);

  useEffect(() => {
    const element = content.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => {
      const box = entries[0]?.borderBoxSize[0];
      setSize({ width: box?.inlineSize ?? element.offsetWidth, height: box?.blockSize ?? element.offsetHeight });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const returning = wasHidden.current && !scrollHidden;
    wasHidden.current = scrollHidden;
    const w = scrollHidden ? 66 : expanded ? expandedWidth : loading ? loadingWidth : query || value.color ? filteredWidth : idleWidth;
    const h = scrollHidden ? 14 : expanded ? 56 : loading ? 48 : 52;
    const shape = scrollHidden ? CLOSE : returning || !entered.current || expanded ? BAR : CLOSE;
    if (expanded) entered.current = true;
    if (reduced) { width.jump(w); height.jump(h); }
    else { retargetValue(width, w, shape, { onComplete: () => { if (!scrollHidden) entered.current = true; } }); retargetValue(height, h, shape); }
  }, [expanded, loading, query, value.color, reduced, scrollHidden, width, height, idleWidth, expandedWidth, filteredWidth, loadingWidth]);

  useEffect(() => {
    if (reduced) rise.jump(scrollHidden ? 112 : 0);
    else retargetValue(rise, scrollHidden ? 112 : 0, scrollHidden ? CLOSE : RISE);
  }, [scrollHidden, reduced, rise]);

  useEffect(() => {
    panelElement.current?.toggleAttribute('inert', !panelOpen);
    const changed = lastPanelOpen.current !== panelOpen;
    const shrinking = panelOpen && !changed && size.height < lastPanelHeight.current;
    lastPanelOpen.current = panelOpen; lastPanelHeight.current = size.height;
    if (reduced) { panelWidth.jump(panelOpen ? size.width : 0); panelHeight.jump(panelOpen ? size.height : 0); lift.jump(panelOpen ? 0 : 112); }
    else {
      retargetValue(panelWidth, panelOpen ? size.width : 0, panelOpen ? PANEL : PANEL_RETURN);
      retargetValue(panelHeight, panelOpen ? size.height : 0, panelOpen ? (shrinking ? PANEL_SHRINK : PANEL) : PANEL_RETURN);
      if (changed) retargetValue(lift, panelOpen ? 0 : 112, panelOpen ? PANEL_RISE : PANEL_FALL);
    }
  }, [panelOpen, size, reduced, panelWidth, panelHeight, lift]);

  const isTyping = !!query;
  const wheelStageKey = [expanded, panel, isTyping, value.color, loading, !!(value.query || value.color), recentSearches.length].join('|');
  const wheelStageRank = expanded ? ({ recent: 1, color: 2, image: 3 }[panel] + (isTyping ? .1 : 0)) : isTyping || value.query || value.color ? .5 : 0;
  useEffect(() => {
    const previous = wheelStage.current;
    wheelStage.current = { key: wheelStageKey, rank: wheelStageRank };
    if (reduced) { wheelTarget.current = 0; wheel.jump(0); return; }
    if (!previous || previous.key === wheelStageKey) return;
    wheelTarget.current += wheelStageRank < previous.rank ? -360 : 360;
    const timer = setTimeout(() => retargetValue(wheel, wheelTarget.current, { stiffness: 80, damping: 12, mass: 1 }), 180);
    return () => clearTimeout(timer);
  }, [wheelStageKey, wheelStageRank, reduced, wheel]);
  useEffect(() => {
    const previous = wheelInteraction.current;
    const nudge = expanded && (!previous.expanded || (isTyping && !previous.typing));
    wheelInteraction.current = { expanded, typing: isTyping };
    if (reduced) { wheelX.jump(0); return; }
    if (nudge) retargetValue(wheelX, 0, { stiffness: 220, damping: 19, mass: .8 }, { velocity: Math.min(190, wheelX.getVelocity() + 150) });
    else if (!expanded) retargetValue(wheelX, 0, { stiffness: 220, damping: 19, mass: .8 });
  }, [expanded, isTyping, reduced, wheelX]);
  useEffect(() => {
    if (reduced) { wheelEntrance.jump(0); return; }
    if (scrollHidden) return;
    const spin = animate(wheelEntrance, wheelEntrance.get() + 360, { duration: WHEEL_INTRO_DURATION, delay: .325, ease: [.12, 1, .24, 1] });
    return () => spin.stop();
  }, [reduced, scrollHidden, wheelEntrance]);

  useEffect(() => {
    const gate = suggestionGate.current;
    gate.cancel();
    if (capture || !getSuggestions || !query.trim() || !expanded || panel !== 'recent') return;
    const request = gate.start();
    const timer = setTimeout(() => {
      Promise.resolve().then(() => getSuggestions(query.trim(), { signal: request.signal })).then(result => {
        if (request.isCurrent()) setSuggestionResult({ query: query.trim(), entries: result.slice(0, 6), error: false, provider: getSuggestions });
      }, () => { if (request.isCurrent()) setSuggestionResult({ query: query.trim(), entries: EMPTY, error: true, provider: getSuggestions }); });
    }, Math.max(0, debounceMs));
    return () => { clearTimeout(timer); gate.cancel(); };
  }, [capture, query, expanded, panel, getSuggestions, debounceMs]);

  useEffect(() => {
    const search = searchGate.current, suggest = suggestionGate.current;
    return () => { search.cancel(); suggest.cancel(); width.stop(); height.stop(); rise.stop(); panelWidth.stop(); panelHeight.stop(); lift.stop(); wheel.stop(); wheelX.stop(); wheelEntrance.stop(); };
  }, [width, height, rise, panelWidth, panelHeight, lift, wheel, wheelX, wheelEntrance]);

  useEffect(() => {
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !dock.current?.contains(event.target)) setExpanded(false); };
    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (keyboardShortcut && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        const editing = event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable="true"],[role="textbox"]');
        if (editing && !dock.current?.contains(event.target as Node)) return;
        event.preventDefault(); resetScroll.current?.(); setScrollHidden(false); setPanel('recent'); setExpanded(true); input.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', key); };
  }, [keyboardShortcut]);

  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      dock.current?.style.setProperty('--svsi-keyboard-inset', `${Math.max(0, window.innerHeight - (viewport?.height ?? window.innerHeight) - (viewport?.offsetTop ?? 0))}px`);
      dock.current?.style.setProperty('--svsi-visible-height', `${viewport?.height ?? window.innerHeight}px`);
    };
    update(); viewport?.addEventListener('resize', update); viewport?.addEventListener('scroll', update);
    return () => { viewport?.removeEventListener('resize', update); viewport?.removeEventListener('scroll', update); };
  }, []);

  useEffect(() => {
    const element = scrollContainer?.current;
    if (!element) return;
    let last = element.scrollTop, travel = 0;
    let hide: ReturnType<typeof setTimeout> | undefined, idle: ReturnType<typeof setTimeout> | undefined;
    const reset = () => { clearTimeout(hide); clearTimeout(idle); hide = idle = undefined; travel = 0; last = element.scrollTop; setScrollHidden(false); };
    resetScroll.current = reset;
    const scroll = () => {
      const distance = Math.abs(element.scrollTop - last); last = element.scrollTop;
      if (distance < .5) return;
      travel += distance;
      if (!hide) hide = setTimeout(() => {
        if (travel < 64) { hide = undefined; return; }
        setScrollHidden(true); setExpanded(false);
        if (dock.current?.contains(document.activeElement)) (document.activeElement as HTMLElement)?.blur();
      }, 180);
      clearTimeout(idle); idle = setTimeout(reset, 160);
    };
    const target = element === document.scrollingElement ? document : element;
    target.addEventListener('scroll', scroll, { passive: true });
    return () => { target.removeEventListener('scroll', scroll); clearTimeout(hide); clearTimeout(idle); resetScroll.current = null; };
  }, [scrollContainer]);
  useEffect(() => { dock.current?.toggleAttribute('inert', scrollHidden); }, [scrollHidden]);

  function close() { focusInput(); setExpanded(false); }
  function open(next: 'recent' | 'color' | 'image' = 'recent') { resetScroll.current?.(); setScrollHidden(false); setPanel(next); setExpanded(true); }
  function focusInput() { input.current?.focus(); }
  async function execute(action: (signal: AbortSignal) => void | Promise<void>, retryAction: () => void) {
    const request = searchGate.current.start();
    retry.current = retryAction; setFailed(false); setLoading(true); setExpanded(false);
    try {
      await action(request.signal);
      if (request.isCurrent()) { setQuery(''); setExpanded(false); input.current?.blur(); retry.current = null; }
    } catch { if (request.isCurrent()) setFailed(true); }
    finally { if (request.isCurrent()) setLoading(false); }
  }
  function submit(entry: SearchEntry = { query: query.trim() || value.query, color: value.color }) {
    void execute(signal => onSearch(entry, { signal }), () => submit(entry));
  }
  function selectResult(entry: SearchEntry) {
    void execute(signal => (onSelectResult ?? onSearch)(entry, { signal }), () => selectResult(entry));
  }
  function imageSearch(file?: File) {
    if (!file || !onImageSearch) return;
    void execute(signal => onImageSearch(file, { signal }), () => imageSearch(file));
  }
  function remove(entry: SearchEntry) {
    const next = recentSearches.filter(item => item.query !== entry.query || item.color !== entry.color);
    focusInput();
    onRecentSearchesChange?.(next);
    if (!next.length) close();
  }

  const reveal = {
    variants: { hidden: { opacity: 0, transition: { duration: reduced ? 0 : .06 } }, visible: (order: number) => ({ opacity: 1, transition: { duration: reduced ? 0 : .12, delay: reduced ? 0 : .22 + order * .035 } }) },
    initial: reduced ? false as const : 'hidden', animate: scrollHidden ? 'hidden' : 'visible',
  };

  return <motion.div data-capture={!!capture} ref={dock} className={`svsi-root ${className}`} style={{ ...style, y: rise }} aria-hidden={scrollHidden || undefined}
    onKeyDown={event => {
      if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
        event.preventDefault(); event.stopPropagation();
        setExpanded(false); input.current?.blur();
      }
    }}>
    <div className="svsi-status" role="status" aria-live="polite">
      {failed ? <span>{labels.error} <button type="button" onClick={() => retry.current?.()}>{labels.retry}</button></span> : loading ? <span className="svsi-sr-only">{labels.loading}</span> : null}
    </div>
    <motion.div className="svsi-stack" style={{ width, '--svsi-panel-width': `min(${expandedWidth}px, calc((100vw - 32px) / var(--svsi-zoom)))` } as MotionStyle}>
      <motion.div className="svsi-elevation" aria-hidden="true" style={{ bottom: 0, width: '100%', height, borderRadius: radius, opacity: barShadowOpacity }} />
      <motion.div className="svsi-elevation" aria-hidden="true" style={{ bottom: 'calc(100% + 12px)', y: lift, width: safePanelWidth, height: safePanelHeight, borderRadius: panelRadius, opacity: panelShadowOpacity }} />
      <motion.section ref={panelElement} id={`${id}-panel`} className="svsi-panel svsi-glass" aria-label={panel === 'color' ? labels.color : panel === 'image' ? labels.image : suggesting ? labels.suggestions : labels.recent}
        aria-hidden={!panelOpen} style={{ width: safePanelWidth, height: safePanelHeight, y: lift, borderRadius: panelRadius, clipPath: panelClip, visibility: panelVisible, pointerEvents: panelOpen ? 'auto' : 'none' }}>
        <div ref={content} className="svsi-panel-inner">
          <div className="svsi-panel-heading"><span>{panel === 'color' ? labels.color : panel === 'image' ? labels.image : suggesting ? labels.suggestions : labels.recent}</span>
            {panel === 'recent' && !suggesting && recentSearches.length > 0 && onRecentSearchesChange ? <button type="button" className="svsi-clear-history" onClick={() => { focusInput(); onRecentSearchesChange([]); close(); }}>{labels.clearHistory}</button> : <button type="button" className="svsi-close" aria-label={labels.close} onClick={() => { focusInput(); close(); }}><X size={16} /></button>}
          </div>
          {panel === 'recent' ? <><History capture={!!capture} hoverRow={capture?.hoverRow} entries={entries} enabled={panelOpen} onSelect={selectResult} onRemove={!suggesting && onRecentSearchesChange ? remove : undefined} onReturnToInput={focusInput} removeLabel={labels.removeRecent} />{suggestionError && <p className="svsi-note" role="status">{labels.suggestionsError}</p>}</> : panel === 'color' ? <div className="svsi-colors"><div className="svsi-palette" role="group" aria-label={labels.color}>
            {colors?.map((color, index) => <button key={`${color}-${index}`} type="button" style={{ background: color }} aria-label={labels.selectColor(color)} aria-pressed={value.color === color}
              tabIndex={index === Math.min(paletteCursor, colors.length - 1) ? 0 : -1} onFocus={() => setPaletteCursor(index)}
              onKeyDown={event => { const direction = ({ ArrowRight: 1, ArrowLeft: -1, ArrowDown: 12, ArrowUp: -12 } as Record<string, number>)[event.key]; if (direction === undefined) return; event.preventDefault(); const next = Math.max(0, Math.min(colors.length - 1, index + direction)); setPaletteCursor(next); event.currentTarget.parentElement?.querySelectorAll('button')[next]?.focus(); }}
              onClick={() => submit({ query: query.trim() || value.query, color })}>{value.color === color ? <Check size={13} /> : null}</button>)}
          </div>{!!quickColors?.length && <><div className="svsi-trending-label">{labels.quickColors}</div><div className="svsi-trending">{quickColors.map(color => <button key={color} type="button" aria-label={labels.selectColor(color)} style={{ background: color }} onClick={() => submit({ query: query.trim() || value.query, color })} />)}</div></>}</div>
          : <div className="svsi-image-search"><label><ImageIcon size={22} /><span>{labels.chooseImage}</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { imageSearch(event.target.files?.[0]); event.target.value = ''; }} /></label>{labels.imageHelp && <p>{labels.imageHelp}</p>}</div>}
        </div>
      </motion.section>
      <motion.form className="svsi-search-form svsi-glass" role="search" aria-label={labels.search} aria-busy={loading}
        style={{ height, borderRadius: radius, paddingTop: padding, paddingBottom: padding }}
        onSubmit={event => { event.preventDefault(); if (!composing.current) submit(); }}>
        <motion.button {...reveal} custom={2} type="submit" className="svsi-search-icon" aria-label={labels.search}><Search size={18} /></motion.button>
        {value.color && <button type="button" className="svsi-selected-color" style={{ background: value.color }} aria-label={labels.removeColor} onClick={() => submit({ query: value.query, color: '' })}><X size={10} /></button>}
        {value.query && !query && <span className="svsi-query-tag"><button type="button" className="svsi-query-label" title={value.query} aria-label={labels.editQuery(value.query)} onClick={() => { setQuery(value.query); setPanel('recent'); setExpanded(true); focusInput(); }}>{value.query}</button><button type="button" className="svsi-query-remove" aria-label={labels.removeQuery(value.query)} onClick={() => submit({ query: '', color: value.color })}><X size={12} /></button></span>}
        <motion.input {...reveal} custom={1} ref={input} id={`${id}-input`} type="text" value={query} maxLength={160} autoComplete="off" aria-label={labels.search}
          aria-keyshortcuts={keyboardShortcut ? 'Meta+K Control+K' : undefined} aria-controls={panelOpen ? `${id}-panel` : undefined}
          placeholder={value.query ? labels.compactPlaceholder : labels.placeholder}
          onFocus={() => { if (!expanded) open(); }} onClick={() => { if (!expanded) open(); }}
          onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
          onChange={event => { setQuery(event.target.value); setPanel('recent'); setExpanded(true); }}
          onKeyDown={event => {
            if (event.nativeEvent.isComposing || panel !== 'recent' || !panelOpen || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
            const buttons = content.current?.querySelectorAll<HTMLButtonElement>('.svsi-history-search');
            if (!buttons?.length) return;
            event.preventDefault(); buttons[event.key === 'ArrowDown' ? 0 : buttons.length - 1].focus();
          }} />
        {(query || value.color) && <button type="button" className="svsi-clear-input" aria-label={labels.clearSearch} onClick={() => { setQuery(''); if (value.query || value.color) submit({ query: '', color: '' }); focusInput(); }}><X size={14} /></button>}
        {onImageSearch && <motion.button {...reveal} custom={2} type="button" className="svsi-image-trigger" aria-label={labels.image} aria-expanded={expanded && panel === 'image'} onClick={() => open('image')}><ImageIcon size={18} /></motion.button>}
        {!!colors?.length && <motion.button {...reveal} custom={3} type="button" className="svsi-color-trigger" aria-label={labels.color} aria-expanded={expanded && panel === 'color'} onClick={() => { if (expanded && panel === 'color') close(); else open('color'); }}><motion.span style={{ display: 'block', x: wheelX, rotate: wheel }}><motion.span className="svsi-color-orb" style={{ rotate: wheelEntrance }} /></motion.span></motion.button>}
      </motion.form>
    </motion.div>
  </motion.div>;
}
