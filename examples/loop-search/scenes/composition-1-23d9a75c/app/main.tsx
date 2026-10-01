import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { SaveeSearchInput, applyCaptureGeometry } from './search-input/search-input';
import type { SearchEntry } from './search-input/types';
import feed from './suggestions.json';
import './search-input/styles.css';
import './style.css';
import { sequence, type Measurements, type Track, type Pose } from './sequence';

type Parameters = { state: string; query: string; selectedColor: string; history: string; hoverRow: number; playback?: string; cursorSize?: number; pose?: Pose };
const initial: Parameters = { state: 'idle', query: 'interface', selectedColor: '#720a08', history: 'interface\nlogos\nlight toggle', hoverRow: 0 };
const historyFrom = (text: string): SearchEntry[] => text.split('\n').map(query => query.trim()).filter(Boolean).map(query => ({query, color:''}));
function suggest(query: string, history: readonly SearchEntry[]) {
  const term = query.trim();
  const titles = [...history.map(e=>e.query), ...feed.images.map(i=>i.title)].filter(t=>t.length <= 64 && t.toLowerCase().includes(term.toLowerCase()) && !/https?:|original|untitled|[a-f0-9]{16}/i.test(t));
  return [...new Set([term, ...titles])].slice(0,3).map(query=>({query,color:''}));
}
function hslHex(h: number,s: number,l: number) {const a=s*Math.min(l,1-l);return '#'+[0,8,4].map(n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0');}).join('');}
const colors = [...Array.from({length:12},(_,i)=>hslHex(0,0,1-i/11)),...[.1,.18,.27,.37,.48,.59,.7,.81,.91].flatMap(l=>[190,220,260,285,330,0,20,40,52,60,78,100].map(h=>hslHex(h,.88,l)))];
const quickColors=['#151515','#ffffff','#720a08','#ce1710','#a31810','#8c2518','#e43518','#f57616','#e6f10d','#315418','#76b342','#317386'];
let setCapture: (p: Parameters) => void;
function App() {
  const [capture, updateCapture] = useState<Parameters | null>(null);
  setCapture = updateCapture;
  const [value,setValue]=useState<SearchEntry>({query:'',color:''});
  const [history,setHistory]=useState(historyFrom(initial.history));
  const apply = (entry:SearchEntry) => {setValue(entry);if(entry.query||entry.color)setHistory(old=>[entry,...old.filter(e=>e.query!==entry.query||e.color!==entry.color)].slice(0,6));};
  const applied=capture?.pose ? {query:capture.pose.appliedQuery,color:capture.pose.appliedColor} : capture ? {query:capture.state==='submitted' ? capture.query : '',color:['selected-color','color'].includes(capture.state) ? capture.selectedColor : ''} : value;
  const recent=capture ? capture.state==='empty' ? [] : historyFrom(capture.history) : history;
  return <><SaveeSearchInput value={applied} onSearch={apply} recentSearches={recent} onRecentSearchesChange={setHistory}
    getSuggestions={async query=>suggest(query,history)} colors={colors} quickColors={quickColors} keyboardShortcut
    labels={{color:'Search by Color',image:'Search by Image',quickColors:'Trending colors',imageHelp:'Find saves with similar colors. Your image stays on this device.'}}
    capture={capture ? {state:capture.state,query:capture.state==='suggestions'?capture.query:'',suggestions:suggest(capture.query,recent),hoverRow:capture.hoverRow,...(capture.pose ? {query:capture.pose.query,panel:capture.pose.panel,expanded:capture.pose.expanded}: {})} : undefined}
    onImageSearch={async(file,{signal})=>{
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)throw Error('Choose a PNG, JPG, or WebP under 10 MB.');
      const url=URL.createObjectURL(file);
      try { const img=new Image();img.src=url;await img.decode();if(signal.aborted)return;
        const canvas=document.createElement('canvas');canvas.width=40;canvas.height=40;const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0,40,40);
        const pixels=ctx.getImageData(0,0,40,40).data;const buckets=new Map<string,number>();
        for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<128)continue;const c='#'+[pixels[i],pixels[i+1],pixels[i+2]].map(v=>Math.min(255,Math.round(v/32)*32).toString(16).padStart(2,'0')).join('');buckets.set(c,(buckets.get(c)||0)+1);}
        const color=[...buckets].sort((a,b)=>b[1]-a[1])[0]?.[0];if(!color)throw Error('No image colors');apply({query:'',color});
      } finally {URL.revokeObjectURL(url);}
    }}/><img className="sequence-cursor" src="/source/macos-arrow.png" alt="" draggable={false}/></>
}
createRoot(document.getElementById('root')!).render(<App/>);
let directPresentation=false;
const paint=()=>directPresentation ? Promise.resolve() : new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
let measurements:Measurements|undefined;
let measurementKey='';
let tracks:Track[]=[];
async function show(p:Parameters){flushSync(()=>setCapture(p));await paint();await paint();}
const point=(selector:string,align='center')=>{const r=document.querySelector(selector)!.getBoundingClientRect();return {x:align==='input'?r.left+45:r.left+r.width/2,y:r.top+r.height/2};};
async function measure(p:Parameters){
  const anchors:Measurements['anchors']={offscreen:{x:1100,y:760}};
  await show({...p,state:'idle',pose:undefined});anchors['input-idle']=point('.svsi-search-form input','input');
  await show({...p,state:'recent',pose:undefined});const recent=document.querySelector<HTMLElement>('.svsi-panel-inner')!.offsetHeight;anchors.wheel=point('.svsi-color-trigger');
  await show({...p,state:'color',pose:undefined});const color=document.querySelector<HTMLElement>('.svsi-panel-inner')!.offsetHeight;anchors.swatch=point('.svsi-trending button:nth-child(3)');
  await show({...p,state:'selected-color',pose:undefined});anchors['input-color']=point('.svsi-search-form input','input');
  const pose:Pose={state:'submitted',query:'',appliedQuery:p.query,appliedColor:p.selectedColor,panel:'recent',expanded:false,hoverRow:0};
  await show({...p,state:'submitted',pose});anchors.image=point('.svsi-image-trigger');anchors.clear=point('.svsi-clear-input');
  await show({...p,state:'image',pose:{...pose,state:'image',panel:'image',expanded:true}});const image=document.querySelector<HTMLElement>('.svsi-panel-inner')!.offsetHeight;anchors.close=point('.svsi-close');
  measurements={recent,color,image,anchors};
}
(window as any).tiltSource={
  async ready(){
    await document.fonts.ready;await paint();
    const response=await fetch('/scene.json');
    if(response.ok){const doc=await response.json();tracks=doc.tracks;}
  },
  async sample({time,parameters,presentation}:{time:number;parameters:Parameters;presentation?:string}){
    directPresentation=false;
    const p={...initial,...parameters};
    const cursor=document.querySelector<HTMLImageElement>('.sequence-cursor')!;
    if(p.playback==='sequence'){
      const key=JSON.stringify([p.query,p.selectedColor,p.history]);
      if(!measurements||key!==measurementKey){await measure(p);measurementKey=key;}
      directPresentation=presentation==='dom';
      const frame=sequence(time,tracks,p.query,p.selectedColor,measurements!);
      flushSync(()=>setCapture({...p,...frame.pose,pose:frame.pose}));
      await paint();
      applyCaptureGeometry(frame.geometry);
      const root=document.querySelector<HTMLElement>('.svsi-root')!;
      root.style.opacity=String(frame.barOpacity);
      root.style.setProperty('--capture-content-opacity',String(frame.contentOpacity));
      root.classList.toggle('sequence-caret',frame.caret);
      const input=root.querySelector<HTMLInputElement>('input')!;
      const form=root.querySelector<HTMLElement>('.svsi-search-form')!;
      const metrics=document.createElement('canvas').getContext('2d')!;
      metrics.font=getComputedStyle(input).font;
      const formBounds=form.getBoundingClientRect(),inputBounds=input.getBoundingClientRect();
      const zoom=formBounds.width/form.offsetWidth;
      root.style.setProperty('--sequence-caret-x',`${(inputBounds.left-formBounds.left)/zoom+metrics.measureText(frame.pose.query).width+2}px`);
      const size=p.cursorSize??1.35;
      cursor.style.cssText=`display:block;left:${frame.cursor.x-5*size}px;top:${frame.cursor.y-5*size}px;width:${28*size}px;height:${40*size}px;opacity:${frame.cursorOpacity};transform:scale(${1-frame.click*.12});transform-origin:${5*size}px ${5*size}px;`;
      await paint();
    }else{
      await show(p);cursor.style.display='none';
      const root=document.querySelector<HTMLElement>('.svsi-root')!;root.style.opacity='1';root.style.setProperty('--capture-content-opacity','1');root.classList.remove('sequence-caret');
    }
    return {revision:JSON.stringify([time,parameters])};
  },
};
