import type { SceneContext, SceneInstance } from "../../src/core/runtime";

/** One unbroken lens move. Every event reads the editable track intervals. */
export default function createScene({THREE, world, camera, createLayeredSource, registerCameraFrame, document}: SceneContext): SceneInstance {
  const ui = createLayeredSource('ui', {width: 7.2});
  world.add(ui.group);
  const focus = new THREE.Object3D();
  world.add(focus);
  registerCameraFrame('ui', focus);
  const background = new THREE.Color(document.background);
  world.background = background;
  const unit = 7.2 / 1440;
  const target = new THREE.Vector3();
  const knots = Array.from({length:5},()=>new THREE.Vector3());
  const direction = new THREE.Vector3();
  const panels = ['payment','payment-surface','fulfillment-0','note','order-title','customer','risk','timeline'];
  const details = ['payment-rule','payment-row-1','payment-row-2','payment-row-3','total','shop-cash','mastercard','fulfillment-rule','product-row','product-image','fulfillment-badge','second-product-row','second-product-image'];
  const clamp=(x:number)=>Math.max(0,Math.min(1,x));
  const smooth=(x:number)=>x*x*x*(10+x*(-15+6*x));
  const out=(x:number)=>1-Math.pow(1-x,3);
  // Nonuniform Hermite interpolation keeps position and velocity continuous at joins.
  function curve(values:number[],times:number[],time:number) {
    let i=0;while(i<times.length-2&&time>times[i+1])i++;
    const dt=Math.max(.001,times[i+1]-times[i]),u=clamp((time-times[i])/dt);
    const m0=i===0?(values[1]-values[0])/(times[1]-times[0]):(values[i+1]-values[i-1])/(times[i+1]-times[i-1]);
    const m1=i===values.length-2?0:(values[i+2]-values[i])/(times[i+2]-times[i]);
    return (2*u*u*u-3*u*u+1)*values[i]+(u*u*u-2*u*u+u)*dt*m0+(-2*u*u*u+3*u*u)*values[i+1]+(u*u*u-u*u)*dt*m1;
  }
  const point=(id:string,x:number,y:number,destination:InstanceType<typeof THREE.Vector3>)=>{
    const node=ui.get(id),b=node.layout!.bounds;
    // Aim at the browser's layout, independent of the element's entrance scale.
    node.object.getWorldPosition(destination);
    destination.x=(b.x+b.width*x-720)*unit;
    destination.y=(500-b.y-b.height*y)*unit;
  };
  camera.fov=32;camera.near=.02;camera.far=100;
  return {sample({time,controls,document}) {
    const track=(id:string)=>document.tracks.find(t=>t.id===id)!;
    const p=(id:string)=>{const t=track(id);return clamp((time-t.start)/(t.end-t.start));};
    const lift=controls.number('lift');
    ui.group.position.set(0,0,0);ui.group.rotation.set(0,0,0);ui.group.scale.setScalar(1);
    const base=smooth(p('frame-arrives'));
    ui.base.material.opacity=base;ui.base.visible=base>0;
    for(const id of panels){
      const node=ui.get(id),progress=p(`settle-${id}`),remain=1-smooth(progress);
      const depth=id==='payment-surface'?.18:id==='payment'?.8:id==='fulfillment-0'?.62:1;
      node.object.position.set(0,0,depth*lift*remain);
      node.object.rotation.set(0,0,0);node.object.scale.setScalar(1);
      node.mesh.material.opacity=id==='payment'||id==='payment-surface'?1:out(clamp(progress*4));
      node.object.visible=true;
    }
    for(const id of details){
      const node=ui.get(id),v=p(`build-${id}`),e=out(v);
      node.object.position.set(0,0,.08*lift*(1-e));
      node.object.rotation.set(0,0,0);node.object.scale.setScalar(1);
      node.mesh.material.opacity=clamp(v*5);
      if(id.endsWith('rule')){
        node.object.scale.x=Math.max(.001,e);
        node.object.position.x=-(node.layout!.bounds.width*unit)*(1-e)/2;
        node.object.position.z=.001;
      }else if(['product-image','second-product-image','shop-cash','mastercard','fulfillment-badge'].includes(id)){
        const tension=controls.number('delight')*2.4;
        const pop=1+(tension+1)*Math.pow(v-1,3)+tension*Math.pow(v-1,2);
        node.object.scale.setScalar(Math.max(.001,.65+.35*pop));
        node.object.position.z=.12*lift*(1-e);
        node.object.rotation.z=Math.sin(v*Math.PI)*(1-v)*.07*controls.number('delight');
      }else node.object.position.y=-.07*(1-e);
    }
    ui.group.updateMatrixWorld(true);
    point('payment-rule',.25,.5,knots[0]);
    point('shop-cash',.75,.5,knots[1]);
    point('product-row',.21,.5,knots[2]);
    point('order-title',.62,.6,knots[3]);
    knots[4].set(0,0,0);
    const stages=['camera-details','camera-product','camera-title','camera-reveal'];
    const times=[track(stages[0]).start,...stages.map(id=>track(id).end)];
    const stageIndex=Math.max(0,stages.findIndex(id=>time<=track(id).end));
    // Honor both edges of each child interval; gaps hold the next stage's first pose.
    const cameraTime=time>=times[4]?times[4]:times[stageIndex]+(times[stageIndex+1]-times[stageIndex])*p(stages[stageIndex]);
    time=cameraTime;
    target.set(curve(knots.map(v=>v.x),times,time),curve(knots.map(v=>v.y),times,time),curve(knots.map(v=>v.z),times,time));
    const macro=controls.number('macro');
    const distance=curve([2.05*macro,2.35*macro,2.7*macro,3.15*macro,11.2*controls.number('framing')],times,time);
    const azimuth=THREE.MathUtils.degToRad(curve([-30,-13,18,13,-5],times,time));
    const elevation=THREE.MathUtils.degToRad(curve([43,52,60,67,88],times,time));
    const roll=THREE.MathUtils.degToRad(curve([-10,-4,5,3,0],times,time));
    direction.set(Math.sin(azimuth)*Math.cos(elevation),-Math.cos(azimuth)*Math.cos(elevation),Math.sin(elevation));
    focus.position.copy(target);
    camera.position.copy(target).addScaledVector(direction,distance);
    camera.up.set(Math.sin(roll),Math.cos(roll),0);camera.lookAt(target);
    camera.clearViewOffset();camera.updateProjectionMatrix();background.set(document.background);
  }};
}
