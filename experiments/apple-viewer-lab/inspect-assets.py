import json, pathlib, struct, collections
root = pathlib.Path(__file__).resolve().parents[2] / '.tilt/apple-viewer-research'
for product in ['iphone-duo', 'iphone-18-pro']:
    print('\nPRODUCT', product)
    for file in (root/product).rglob('*.gltf'):
        d=json.loads(file.read_text())
        triangles=sum(d['accessors'][p['indices']]['count']//3 for m in d.get('meshes',[]) for p in m['primitives'] if 'indices' in p)
        print(file.name, 'meshes', len(d.get('meshes',[])), 'triangles',triangles)
        if len(d.get('meshes',[])) > 40:
            print('animations',[(a.get('name'),len(a.get('channels',[]))) for a in d.get('animations',[])])
            print('textures',len(d.get('images',[])))
    counts=collections.Counter()
    for file in (root/product).rglob('*.ktx'):
        b=file.read_bytes();counts[struct.unpack_from('<5I',b,12)]+=1
    print('KTX vkFormat,typeSize,width,height,depth/count',dict(counts))
