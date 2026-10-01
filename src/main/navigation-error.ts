const escapeHTML = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );

/** Self-contained recovery UI: the editor bundle may be the thing that failed. */
export function navigationErrorPage(detail: string, nonce: string) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Couldn't open project — Tilt</title>
<style nonce="${nonce}">
:root{color-scheme:light dark;--surface:#fff;--text:#1a1c1f;--secondary:#67686a;--control:rgba(26,28,31,.049);--ring:#339cff}
@media(prefers-color-scheme:dark){:root{--surface:#141414;--text:#dfdfdf;--secondary:#969696;--control:rgba(255,255,255,.052);--ring:#83c3ff}}
*{box-sizing:border-box}body{margin:0;background:var(--surface);color:var(--text);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.toolbar{height:52px;-webkit-app-region:drag}main{width:min(440px,100%);margin:clamp(48px,18vh,180px) auto;padding:0 24px}
h1{font-size:22px;font-weight:550;line-height:1.3;margin:0 0 24px}.actions{display:flex;gap:8px}button{border:0;border-radius:10px;padding:0 14px;height:36px;background:var(--control);color:var(--text);font:inherit;cursor:default}
button:focus-visible,summary:focus-visible{outline:2px solid var(--ring);outline-offset:3px}details{margin-top:24px;color:var(--secondary)}summary{width:fit-content;cursor:default}pre{font:12px/1.6 ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere}
</style></head><body><div class="toolbar"></div><main aria-labelledby="title"><h1 id="title">Couldn't open project</h1>
<div class="actions"><button id="retry">Retry</button><button id="back">Back</button></div>
<details><summary>Technical details</summary><pre>${escapeHTML(detail)}</pre></details></main>
<script nonce="${nonce}">document.getElementById('retry').addEventListener('click',()=>location.reload());document.getElementById('back').addEventListener('click',()=>{if(history.length>1)history.back();else location.assign('/#home')});</script>
</body></html>`;
}
