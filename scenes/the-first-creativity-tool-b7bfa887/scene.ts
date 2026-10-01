import type { SceneContext, SceneInstance } from '../../src/core/runtime';

/** One typographic thought, then a correction. Native macOS SF Pro, no network assets. */
export default async function createScene({ THREE, world, camera }: SceneContext): Promise<SceneInstance> {
  await globalThis.document.fonts.ready;
  const root = new THREE.Group();
  world.add(root);
  const bg = new THREE.Color();
  world.background = bg;
  const font = '600 240px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
  const measure = globalThis.document.createElement('canvas').getContext('2d')!;
  measure.font = font;
  const unit = 240;
  const makeWord = (text: string) => {
    const width = measure.measureText(text).width;
    const canvas = globalThis.document.createElement('canvas');
    canvas.width = Math.ceil(width + 40); canvas.height = 340;
    const c = canvas.getContext('2d')!;
    c.font = font; c.fillStyle = '#ffffff'; c.textBaseline = 'alphabetic';
    c.fillText(text, 20, 250);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    const material = new THREE.MeshBasicMaterial({map:texture, transparent:true, depthWrite:false});
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(canvas.width/unit, canvas.height/unit), material);
    root.add(mesh);
    return {mesh, material, texture, width:width/unit};
  };
  const words = ['The','last','creativity','tool'].map(makeWord);
  const first = makeWord('first');
  const gap = 0.24;
  const total = words.reduce((n,w)=>n+w.width,0)+gap*3;
  let x = -total/2;
  const centers = words.map(w=>{const center=x+w.width/2; x+=w.width+gap; return center;});
  const lineMaterial = new THREE.MeshBasicMaterial({color:'#151515', transparent:true, depthWrite:false});
  const line = new THREE.Mesh(new THREE.PlaneGeometry(1,1),lineMaterial);
  root.add(line);
  const clamp = (x:number)=>Math.max(0,Math.min(1,x));
  const smooth = (x:number)=>x*x*x*(10+x*(-15+6*x));
  const out = (x:number)=>1-Math.pow(1-x,4);
  camera.fov=35; camera.near=0.1; camera.far=100;
  return {
    sample({time,document,controls}) {
      const p=(id:string)=>{const t=document.tracks.find(t=>t.id===id)!;return clamp((time-t.start)/(t.end-t.start));};
      bg.set(document.background);
      const replace=out(p('replace'));
      const pop=p('pop');
      const pulse=Math.sin(pop*Math.PI)*Math.exp(-pop*3)*controls.number('pop');
      root.scale.setScalar(1+0.035*smooth(pop)+pulse);
      const widthChange=(first.width-words[1].width)*replace;
      words.forEach((w,i)=>{
        const enter=out(p(['the','last','creativity','tool'][i]));
        w.mesh.position.set(centers[i]+(i>1?widthChange:0)-widthChange/2, -0.42*(1-enter), 0);
        w.mesh.rotation.z=0.018*(1-enter);
        w.mesh.scale.setScalar(0.96+0.04*enter);
        w.material.color.set(controls.color('ink'));
        w.material.opacity=enter*(i===1?1-replace:1);
        if(i===1) w.mesh.position.y+=0.48*replace;
      });
      const spring=replace===1?1:1-Math.exp(-7*p('replace'))*Math.cos(9*p('replace'));
      first.mesh.position.set(centers[1]+(first.width-words[1].width)/2-widthChange/2,-0.52*(1-spring),0.01);
      first.mesh.scale.setScalar(0.9+0.1*spring);
      first.material.opacity=replace;
      first.material.color.set(controls.color('accent'));
      const strike=out(p('strike'));
      const lineWidth=(words[1].width+0.12)*strike;
      line.position.set(centers[1]-words[1].width/2-0.06+lineWidth/2-widthChange/2,0.035+0.48*replace,0.03);
      line.scale.set(lineWidth,controls.number('stroke'),1);
      lineMaterial.color.set(controls.color('ink')); lineMaterial.opacity=1-replace;
      const survey=smooth(p('camera'));
      const height=2.5+(7.6-2.5)*survey-0.1*smooth(pop);
      camera.position.set(0,0,height/(2*Math.tan(35*Math.PI/360)));
      camera.lookAt(0,0,0);
      const center=centers[0]*(1-survey)*controls.number('travel');
      camera.setViewOffset(document.size.width,document.size.height,center/((height*document.size.width)/document.size.height)*document.size.width,0,document.size.width,document.size.height);
      camera.updateProjectionMatrix();
    },
    dispose(){for(const w of [...words,first]) w.texture.dispose();},
  };
}
