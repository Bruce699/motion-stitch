import { spring } from 'motion';
import { BAR, RISE, PANEL, PANEL_RISE, PANEL_RETURN, PANEL_FALL, CLOSE, type Spring } from './search-input/motion';
export type Track={id:string;start:number;end:number};
export type Geometry={width:number;height:number;rise:number;panelWidth:number;panelHeight:number;lift:number;wheel:number;wheelX:number;wheelEntrance:number};
export type Pose={state:string;query:string;appliedQuery:string;appliedColor:string;panel:'recent'|'color'|'image';expanded:boolean;hoverRow:number};
export type Point={x:number;y:number};
export type Measurements={recent:number;color:number;image:number;anchors:Record<string,Point>};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(t:number)=>t*t*(3-2*t);
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
type Event={at:number;to:number;physics:Spring;duration:number};
// Reconstruct interrupted springs, including their incoming velocity, from time.
function channel(time:number,initial:number,events:Event[]){
 let value=initial,velocity=0,start=0,anim:ReturnType<typeof spring>|undefined;
 const sample=(t:number)=>anim ? anim.next(Math.max(0,t-start)*1000).value : value;
 for(const e of events.slice().sort((a,b)=>a.at-b.at)){
  if(e.at>time)break;
  value=sample(e.at);velocity=anim ? (sample(e.at+.0001)-sample(e.at-.0001))/.0002 : 0;
  const speed=.72/Math.max(.1,e.duration);
  anim=spring({keyframes:[value,e.to],velocity,stiffness:e.physics.stiffness*speed*speed,damping:e.physics.damping*speed,mass:e.physics.mass});start=e.at;
 }
 return sample(time);
}
export function sequence(time:number,tracks:Track[],query:string,color:string,m:Measurements){
 const tr=(id:string)=>{const t=tracks.find(t=>t.id===id);if(!t)throw Error('Missing animation track: '+id);return t;};
 const at=(id:string)=>tr(id).start;
 const progress=(id:string)=>clamp((time-at(id))/(tr(id).end-at(id)));
 const open=at('open-recent'),palette=at('open-palette'),select=at('apply-color'),focus=at('focus-query'),typing=at('type-query'),submit=at('apply-query'),image=at('open-image'),close=at('close-image'),clear=at('clear-filters');
 let pose:Pose={state:'idle',query:'',appliedQuery:'',appliedColor:'',panel:'recent',expanded:false,hoverRow:0};
 if(time>=open)pose={...pose,state:'recent',expanded:true};
 if(time>=palette)pose={...pose,state:'color',panel:'color'};
 if(time>=select)pose={...pose,state:'selected-color',expanded:false,appliedColor:color};
 if(time>=focus)pose={...pose,state:'recent',expanded:true,panel:'recent'};
 if(time>=typing){const n=Math.floor(progress('type-query')*query.length+.00001);pose={...pose,state:n?'suggestions':'recent',query:query.slice(0,n)};}
 if(time>=submit)pose={...pose,state:'submitted',expanded:false,query:'',appliedQuery:query};
 if(time>=image)pose={...pose,state:'image',expanded:true,panel:'image'};
 if(time>=close)pose={...pose,state:'submitted',expanded:false};
 if(time>=clear)pose={...pose,state:'idle',query:'',appliedQuery:'',appliedColor:'',panel:'image',expanded:false};
 const event=(id:string,to:number,physics:Spring=BAR):Event=>({at:at(id),to,physics,duration:tr(id).end-at(id)});
 const widths=[event('bar-enter',360),event('open-recent',500),event('apply-color',430,CLOSE),event('focus-query',500),event('apply-query',430,CLOSE),event('open-image',500),event('close-image',430,CLOSE),event('clear-filters',360,CLOSE)];
 const heights=[event('bar-enter',52),event('open-recent',56),event('apply-color',52,CLOSE),event('focus-query',56),event('apply-query',52,CLOSE),event('open-image',56),event('close-image',52,CLOSE)];
 const panelEvents=[event('open-recent',m.recent,PANEL),event('open-palette',m.color,PANEL),event('apply-color',0,PANEL_RETURN),event('focus-query',m.recent,PANEL),event('type-query',m.recent-80,PANEL),event('apply-query',0,PANEL_RETURN),event('open-image',m.image,PANEL),event('close-image',0,PANEL_RETURN)];
 const pw=[event('open-recent',500,PANEL),event('apply-color',0,PANEL_RETURN),event('focus-query',500,PANEL),event('apply-query',0,PANEL_RETURN),event('open-image',500,PANEL),event('close-image',0,PANEL_RETURN)];
 const lifts=[event('open-recent',0,PANEL_RISE),event('apply-color',112,PANEL_FALL),event('focus-query',0,PANEL_RISE),event('apply-query',112,PANEL_FALL),event('open-image',0,PANEL_RISE),event('close-image',112,PANEL_FALL)];
 const turns=['open-recent','open-palette','apply-color','focus-query','type-query','apply-query','open-image','close-image'];
 let angle=0;
 const wheelEvents=turns.map(id=>{angle+=['apply-color','apply-query','close-image'].includes(id)?-360:360;return {...event(id,angle,{stiffness:80,damping:12,mass:1}),at:at(id)+.18};});
 const geometry:Geometry={width:channel(time,66,widths),height:channel(time,14,heights),rise:channel(time,112,[event('bar-enter',0,RISE)]),panelWidth:Math.max(0,channel(time,0,pw)),panelHeight:Math.max(0,channel(time,0,panelEvents)),lift:channel(time,112,lifts),wheel:channel(time,0,wheelEvents),wheelX:0,wheelEntrance:360*smooth(clamp((time-at('bar-enter')-.325)/1.85))};
 const moves:[string,string,string][]=[['cursor-enter','offscreen','input-idle'],['cursor-color','input-idle','wheel'],['cursor-swatch','wheel','swatch'],['cursor-query','swatch','input-color'],['cursor-image','input-color','image'],['cursor-close','image','close'],['cursor-clear','close','clear'],['cursor-exit','clear','offscreen']];
 let cursor=m.anchors.offscreen;
 for(const[id,from,to]of moves){if(time<at(id))break;const p=smooth(progress(id)),a=m.anchors[from],b=m.anchors[to];cursor={x:mix(a.x,b.x,p),y:mix(a.y,b.y,p)-Math.sin(Math.PI*p)*12};}
 const clicks=['open-recent','open-palette','apply-color','focus-query','open-image','close-image','clear-filters'].map(at);
 const click=Math.max(0,...clicks.map(t=>time>=t&&time<t+.18?Math.sin(Math.PI*(time-t)/.18):0));
 const cursorOpacity=smooth(clamp(progress('cursor-enter')*3))*(1-smooth(clamp((progress('cursor-exit')-.4)/.6)));
 return {pose,geometry,cursor,click,cursorOpacity,contentOpacity:clamp((time-at('bar-enter')-.27)/.16),barOpacity:clamp((time-at('bar-enter'))/.1),caret:time>=focus&&time<submit&&Math.floor((time-focus)*2.4)%2===0};
}
