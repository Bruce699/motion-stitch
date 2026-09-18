"""Copy only model assets. No Lotus code, scene graph, camera paths or shaders."""
import pathlib,json,shutil,hashlib
HERE=pathlib.Path(__file__).resolve().parent
RESEARCH=HERE.parents[1]/'.tilt/apple-viewer-research'
manifest=[]
for product,filename,slug in [('iphone-18-pro','QqoRrDEZDJkZWqq.gltf','pro'),('iphone-duo','vroIlOhiWPzmavg.gltf','duo')]:
 for variant,branch in [('ktx','dOKLAkGZzJBEnNO'),('avif','MszYeqEKDgnBqxc')]:
    source=next(p for p in (RESEARCH/product).rglob(filename) if branch in p.parts)
    d=json.loads(source.read_text());dest=HERE/'public/assets'/slug/variant;dest.mkdir(parents=True,exist_ok=True)
    for entry in d.get('buffers',[])+d.get('images',[]):
        uri=entry.get('uri','')
        if not uri or uri.startswith('data:'):continue
        src=source.parent/uri;shutil.copy2(src,dest/uri)
        manifest.append({'product':slug,'variant':variant,'file':uri,'bytes':src.stat().st_size,'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'source':'https://www.apple.com/v/'+product+'/a/static/'+str(src.relative_to(RESEARCH/product))})
    if slug=='duo':
        for name in ['iFSuhcVrhLhMisa','vHeRSOZUeAIaYwi']:
            src=next(p for p in (RESEARCH/product).rglob(name+'.'+variant) if branch in p.parts)
            shutil.copy2(src,dest/src.name)
            manifest.append({'product':slug,'variant':variant,'file':src.name,'bytes':src.stat().st_size,'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'source':'https://www.apple.com/v/'+product+'/a/static/'+str(src.relative_to(RESEARCH/product))})
        # Supplied image assets on the model's existing screen UVs.
        for material,name in [(8,'QcYncVIkzdbhIbJ'),(7,'KwwxLhAVqcKFMjD')]:
            src=next(p for p in (RESEARCH/product).rglob(name+'.'+variant) if branch in p.parts)
            shutil.copy2(src,dest/src.name)
            manifest.append({'product':slug,'variant':variant,'file':src.name,'bytes':src.stat().st_size,'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'source':'https://www.apple.com/v/'+product+'/a/static/'+str(src.relative_to(RESEARCH/product))})
            d['images'].append({'uri':src.name,'mimeType':'image/ktx2' if variant=='ktx' else 'image/avif'})
            d['textures'].append({'source':len(d['images'])-1})
            d['materials'][material]['emissiveTexture']={'index':len(d['textures'])-1}
    # Native ASTC is routed by LoadingManager's file handler in our viewer.
    # Do not mislabel hardware-specific ASTC as Basis Universal.
    extensions=d.setdefault('extensionsUsed',[])
    # Preserve supported PBR data. Proprietary coat/edge shading is not replayed.
    d['extensionsUsed']=[x for x in extensions if x not in ['KHR_materials_coat','EXT_materials_specular_edge_color']]
    for material in d.get('materials',[]):
        ex=material.get('extensions',{})
        ex.pop('KHR_materials_coat',None)
        if 'KHR_materials_specular' in ex:
            ex['KHR_materials_specular'].pop('extensions',None)
            # Lotus's edge-color extension uses zero as a special mode; ordinary
            # dielectric Fresnel uses neutral specular reflectance instead.
            if ex['KHR_materials_specular'].get('specularColorFactor')==[0,0,0]:
                ex['KHR_materials_specular']['specularColorFactor']=[1,1,1]
    (dest/'model.gltf').write_text(json.dumps(d,separators=(',',':')))
    manifest.append({'product':slug,'variant':variant,'file':'model.gltf','source':'https://www.apple.com/v/'+product+'/a/static/'+str(source.relative_to(RESEARCH/product)),'originalSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'preparedSha256':hashlib.sha256((dest/'model.gltf').read_bytes()).hexdigest(),'bytes':(dest/'model.gltf').stat().st_size})
    print(slug,variant,'model and textures ready')
(HERE/'asset-manifest.json').write_text(json.dumps(manifest,indent=2))
for slug in ['pro','duo']:
    for old in (HERE/'public/assets'/slug).iterdir():
        if old.is_file() and old.suffix in ['.ktx','.gltf','.bin']:old.unlink()
