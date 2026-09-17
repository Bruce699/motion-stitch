import {build} from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
await build({configFile:false,root,plugins:[tailwindcss()],resolve:{alias:{'~':path.join(root,'app')}},esbuild:{jsx:'automatic'},build:{outDir:path.resolve(root,'../admin-order'),emptyOutDir:true}});
