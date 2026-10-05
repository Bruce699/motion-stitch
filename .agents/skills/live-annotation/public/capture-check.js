(()=>{
 const sample=document.querySelector('#sample'),status=document.querySelector('#status'),result=document.querySelector('#result');
 const gl=document.querySelector('#gl').getContext('webgl',{preserveDrawingBuffer:true});gl.clearColor(.9,.2,.2,1);gl.clear(gl.COLOR_BUFFER_BIT);
 document.querySelector('#run').onclick=async()=>{status.textContent='Capturing…';try{const image=await (window.html2canvas.default||window.html2canvas)(sample,{logging:false,scale:1});result.src=image.toDataURL('image/png');result.hidden=false;status.textContent='Capture succeeded: '+image.width+' × '+image.height}catch(error){status.textContent='Capture failed: '+error.message}};
})();
