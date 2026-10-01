import {build} from 'esbuild';
import fs from 'node:fs/promises';
const scene='scenes/composition-1-23d9a75c';
await fs.mkdir(scene+'/source',{recursive:true});
await build({entryPoints:[scene+'/app/main.tsx'],bundle:true,outfile:scene+'/source/app.js',format:'iife',platform:'browser',jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"'}});
await fs.writeFile(scene+'/source/index.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Loop Search</title><link rel="stylesheet" href="app.css"></head><body><div id="root"></div><script src="app.js"></script></body></html>');

await fs.writeFile(scene+'/index.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Loop Search</title><link rel="stylesheet" href="source/app.css"></head><body><div id="root"></div><script src="source/app.js"></script></body></html>');
