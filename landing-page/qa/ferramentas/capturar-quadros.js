/*
 * Congela a abertura em instantes do roteiro e fotografa cada quadro (Edge headless, sem dependências).
 * Adaptado de "efeitos visuais skills/efeito-de-intro/scripts/capturar-quadros.js" para os dois tempos desta
 * abertura: as animações "ip*" contam de 0 s (.is-playing) e as "ig*" de 0,40 s (.is-growing). A partir de 2,8 s
 * o script simula a saída (is-leaving, "it*") e solta a página, que também é congelada no mesmo relógio.
 * Uso (servidor rodando):
 *   node qa/ferramentas/capturar-quadros.js <nome> <tempos em s, vírgula> [larguraxaltura]
 *   node qa/ferramentas/capturar-quadros.js abertura-1440 0,0.8,1.6,2.4,3.2 1440x900
 * Saída: qa/fase1/capturas/<nome>-<t>.jpg e qa/fase1/<nome>-folha.jpg (ffmpeg no PATH)
 * Como no original: timers ≥ 1,4 s são anulados (fim natural e travas não disparam).
 */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { session, sleep } = require('./cdp');

const [, , nome, tempos, tamanho] = process.argv;
if (!nome || !tempos) { console.error('uso: node capturar-quadros.js <nome> <t1,t2,...> [1440x900]'); process.exit(1); }
const T = tempos.split(',').map(Number).sort((a, b) => a - b);
const [W, H] = (tamanho || '1440x900').split('x').map(Number);
const OUT = path.join(__dirname, '..', 'fase1');
const SAIDA = 2.8, GROW = 0.4;

session(nome, { W, H, mobile: W < 800, touch: W < 800, intro: true, out: OUT }, async (h) => {
  await h.cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: "(function(){try{sessionStorage.clear()}catch(e){}var st=window.setTimeout;window.setTimeout=function(f,ms){return ms>=1400?0:st.apply(window,arguments)}})();" });
  await h.cdp.send('Page.navigate', { url: h.base + '?intro=1' });
  let ok = false;
  for (let i = 0; i < 100 && !ok; i++) { await sleep(100); ok = await h.ev("return !!document.querySelector('#intro.is-growing')").catch(() => false); }
  if (!ok) throw new Error('a abertura não chegou a .is-growing');
  await sleep(200);
  h.result.animacoes = await h.ev("window.__an=document.querySelector('#intro').getAnimations({subtree:true});window.__an.forEach(a=>a.pause());return window.__an.length");
  const arquivos = [];
  let saiu = false;
  for (const t of T) {
    if (t >= SAIDA && !saiu) {
      saiu = true;
      /* simula o finish("open"): mede o centro do amanhecer (com o palco ainda visível), a página sai do pausado e a abertura ganha a saída; tudo no mesmo relógio */
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
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));`);
    arquivos.push(await h.shot(t.toFixed(2).replace('.', '_')));
  }
  h.result.quadros = arquivos;
  try {
    const tmp = path.join(OUT, 'capturas', '_seq-' + nome);
    fs.mkdirSync(tmp, { recursive: true });
    arquivos.forEach((f, i) => fs.copyFileSync(path.join(__dirname, '..', '..', f), path.join(tmp, String(i).padStart(2, '0') + '.jpg')));
    const cols = Math.min(5, arquivos.length), rows = Math.ceil(arquivos.length / cols);
    const larg = W < 800 ? 300 : 560;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(tmp, '%02d.jpg'), '-vf', `scale=${larg}:-1,tile=${cols}x${rows}:padding=6:color=white`, '-frames:v', '1', path.join(OUT, nome + '-folha.jpg')]);
    fs.rmSync(tmp, { recursive: true, force: true });
    h.result.folha = 'qa/fase1/' + nome + '-folha.jpg';
  } catch (e) { h.result.folha = 'sem ffmpeg: ' + e.message.split('\n')[0]; }
}).then((r) => console.log(JSON.stringify({ animacoes: r.animacoes, folha: r.folha, erro: r.erro, problemas: r.problemas }, null, 1)));
