/*
 * Filma a abertura quadro a quadro (Edge headless, relógio controlado) e monta um MP4 com o ffmpeg.
 * Mesmo método do capturar-quadros.js: todas as animações pausadas e posicionadas em cada instante; as "ip*"
 * contam de 0 s, as "ig*" de 0,40 s e, a partir de 2,8 s, a saída (is-leaving) e a página no mesmo relógio.
 * Por isso o vídeo mostra o roteiro no tempo previsto, sem os soluços de captura de um headless.
 * Uso (servidor rodando):  node qa/ferramentas/filmar-abertura.js <larguraxaltura> [fps] [fim em s]
 * Saída: qa/fase1/abertura-<largura>.mp4
 */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { session } = require('./cdp');

const [W, H] = (process.argv[2] || '1440x900').split('x').map(Number);
const FPS = +(process.argv[3] || 30), FIM = +(process.argv[4] || 3.9);
const OUT = path.join(__dirname, '..', 'fase1');
const SAIDA = 2.8, GROW = 0.4;
const tmp = path.join(OUT, 'capturas', '_filme-' + W);

session('filme-' + W, { W, H, mobile: W < 800, touch: W < 800, dpr: W < 800 ? 2 : 1, intro: true, out: OUT }, async (h) => {
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  await h.cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: "(function(){try{sessionStorage.clear()}catch(e){}var st=window.setTimeout;window.setTimeout=function(f,ms){return ms>=1400?0:st.apply(window,arguments)}})();" });
  await h.cdp.send('Page.navigate', { url: h.base + '?intro=1' });
  let ok = false;
  for (let i = 0; i < 100 && !ok; i++) { await new Promise((r) => setTimeout(r, 100)); ok = await h.ev("return !!document.querySelector('#intro.is-growing')").catch(() => false); }
  if (!ok) throw new Error('a abertura não chegou a .is-growing');
  await new Promise((r) => setTimeout(r, 300));
  await h.ev("window.__an=document.querySelector('#intro').getAnimations({subtree:true});window.__an.forEach(a=>a.pause());return window.__an.length");
  let saiu = false, n = 0;
  for (let t = 0; t <= FIM + 1e-6; t += 1 / FPS) {
    if (t >= SAIDA && !saiu) {
      saiu = true;
      await h.ev(`const it=document.querySelector('#intro'), r=it.querySelector('.it-marca').getBoundingClientRect(), x=r.left+r.width*257.5/1373, y=r.top+r.height*342/687;
        it.style.setProperty('--it-ix', x+'px'); it.style.setProperty('--it-iy', y+'px'); it.style.setProperty('--it-raio', Math.ceil(Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y))+60)+'px');
        document.documentElement.classList.remove('intro-active'); document.documentElement.classList.add('intro-leaving');
        it.classList.add('is-leaving');
        await new Promise(r=>requestAnimationFrame(r));
        window.__saida = document.getAnimations().filter(a => !window.__an.includes(a)); window.__saida.forEach(a=>a.pause()); return window.__saida.length`);
    }
    await h.ev(`const t=${t};
      window.__an.forEach(a=>{const n=a.animationName||''; const base=n.startsWith('ig')?${GROW}:0; a.currentTime=Math.max(0,(t-base))*1000;});
      (window.__saida||[]).forEach(a=>{a.currentTime=Math.max(0,(t-${SAIDA}))*1000;});
      if (t >= ${SAIDA} + .66) { const it=document.querySelector('#intro'); if (it) it.style.display='none'; }
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));`);
    const { data } = await h.cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
    fs.writeFileSync(path.join(tmp, String(n++).padStart(4, '0') + '.jpg'), Buffer.from(data, 'base64'));
  }
  const mp4 = path.join(OUT, 'abertura-' + W + '.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(tmp, '%04d.jpg'),
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', mp4]);
  fs.rmSync(tmp, { recursive: true, force: true });
  h.result.video = 'qa/fase1/abertura-' + W + '.mp4';
  h.result.quadros = n;
}).then((r) => console.log(JSON.stringify({ video: r.video, quadros: r.quadros, erro: r.erro, problemas: r.problemas }, null, 1)));
