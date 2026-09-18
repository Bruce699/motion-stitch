"""Archive publicly referenced viewer data for inspection; never execute Apple JS."""
import pathlib,json,urllib.request,urllib.parse,concurrent.futures,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[2]/'.tilt/apple-viewer-research'

def crawl(product,scene):
 base=f'https://www.apple.com/v/{product}/a/static/'
 root=ROOT/product;root.mkdir(exist_ok=True)
 queue={base+'scenes/'+scene+'.lsd'};seen=set();manifest=[]
 def download(url):
  relative=url.removeprefix(base);path=root/relative;path.parent.mkdir(parents=True,exist_ok=True)
  try:
   body=path.read_bytes() if path.exists() else urllib.request.urlopen(url,timeout=40).read()
   path.write_bytes(body)
   return url,body,None
  except Exception as e:return url,None,str(e)
 while queue:
  batch=queue-seen;queue=set();seen.update(batch)
  for url,body,error in concurrent.futures.ThreadPoolExecutor(10).map(download,batch):
   if error: print('ERROR',url,error);continue
   manifest.append({'url':url,'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest()})
   if not url.endswith(('.lsd','.gltf')):continue
   try:data=json.loads(body)
   except:continue
   def visit(v):
    if isinstance(v,dict):
     for k,x in v.items():
      if isinstance(x,str) and (x.startswith('/uploads/') or k=='uri' and not x.startswith('data:')):
       queue.add(base+x.lstrip('/') if x.startswith('/') else urllib.parse.urljoin(url,x))
      else:visit(x)
    elif isinstance(v,list):
     for x in v:visit(x)
   visit(data)
  print(product,'files',len(seen),'next',len(queue-seen),flush=True)
 (root/(scene+'-manifest.json')).write_text(json.dumps(manifest,indent=2))
 print(product,'TOTAL',len(manifest),sum(x['bytes'] for x in manifest),flush=True)
if __name__=='__main__':
 for p,s in [('iphone-duo','iPhoneDuo_US_L'),('iphone-18-pro','iPhone18Pro_US_L')]:
  for variant in ['ktx','avif']:crawl(p,s+'_'+variant)
