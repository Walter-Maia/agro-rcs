/*
 * QA da Fase 1 (abertura) em tempo real, uma sessão do Edge headless por caso.
 * Uso (servidor rodando): node qa/ferramentas/fase1.js [filtro]   → qa/fase1/resultados.json
 * A linha do tempo de cada caso vem de um observador injetado antes da página: a cada quadro ele anota as
 * trocas de classe do <html> e do #intro e o intervalo entre quadros (performance.now, em ms).
 * Limites: a aba oculta é simulada por visibilitychange (o headless não oculta a aba de verdade).
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { session, sleep } = require('./cdp');

const OUT = path.join(__dirname, '..', 'fase1');
const filtro = process.argv[2] || '';
const OBS = `(function(){window.__linha=[];window.__quadros=[];window.__lentos=[];var h0='',i0='',ult=0;
  function q(t){var h=document.documentElement.className,el=document.getElementById('intro'),i=el?el.className:'(fora do DOM)';
    if(h!==h0){window.__linha.push([Math.round(t),'html: '+h]);h0=h}
    if(i!==i0){window.__linha.push([Math.round(t),'#intro: '+i]);i0=i}
    if(ult){window.__quadros.push(t-ult);if(t-ult>50)window.__lentos.push([Math.round(ult),Math.round(t-ult)])}ult=t;if(t<6000)requestAnimationFrame(q)}
  requestAnimationFrame(q)})();`;
/* sessão nova só na primeira página do caso (o recarregar precisa encontrar a sessão gravada) */
const limpaSessao = "try{if(!sessionStorage.getItem('__qa')){sessionStorage.clear();sessionStorage.setItem('__qa','1')}}catch(e){}";

async function preparar(h, extra) {
  await h.cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: OBS + (extra || '') });
}
const resumoQuadros = (q) => { const d = q.slice().sort((a, b) => a - b); return { quadros: d.length, mediana: +d[Math.floor(d.length / 2)].toFixed(1), p95: +d[Math.floor(d.length * 0.95)].toFixed(1), maior: +d[d.length - 1].toFixed(1), acimaDe50ms: d.filter((x) => x > 50).length }; };
const estadoFinal = `return { html: document.documentElement.className, intro: !!document.getElementById('intro'), sessao: sessionStorage.getItem('tca-intro'),
  h1: getComputedStyle(document.querySelector('.hero__titulo')).opacity, scrollY: Math.round(scrollY), hash: location.hash,
  foco: document.activeElement && (document.activeElement.className || document.activeElement.tagName),
  theme: document.querySelector('meta[name=theme-color]').content }`;

const CASOS = {
  /* fim natural + sessão (recarregar não repete) */
  async natural() {
    const r = {};
    for (const [W, H] of [[1440, 900], [390, 844]]) {
      r[W] = await session('natural-' + W, { W, H, mobile: W < 800, touch: W < 800, intro: true, out: OUT }, async (h) => {
        await preparar(h, limpaSessao);
        await h.go(h.base); await sleep(4500);
        h.result.linha = await h.ev('return __linha');
        h.result.lentos = await h.ev('return __lentos');
        h.result.quadros = resumoQuadros(await h.ev('return __quadros'));
        h.result.final = await h.ev(estadoFinal);
        h.result.depoisDaSaida = await h.shot('depois');
        /* recarregar na mesma sessão: sem abertura */
        await h.cdp.send('Page.reload'); await sleep(1500);
        h.result.recarregada = await h.ev(`return { introActive: document.documentElement.classList.contains('intro-active'), intro: !!document.getElementById('intro'), linha: __linha }`);
        /* ?intro=1 força a abertura mesmo já vista na sessão */
        await h.go(h.base + '?intro=1'); await sleep(600);
        h.result.forcada = await h.ev(`return { linha: __linha }`);
      });
    }
    return r;
  },

  /* URL com #contato numa sessão nova: sem abertura, já na seção */
  async ancora() {
    return session('ancora', { W: 1440, H: 900, intro: true, out: OUT }, async (h) => {
      await preparar(h, limpaSessao);
      await h.go(h.base + '#contato'); await sleep(1500);
      h.result.final = await h.ev(`return { linha: __linha, intro: !!document.getElementById('intro'), topoContato: Math.round(document.getElementById('contato').getBoundingClientRect().top) }`);
    });
  },

  /* pular: Esc, Enter, Tab, roda, clique (desktop) e toque (celular) aos ~0,9 s */
  async pular() {
    const r = {};
    const acoes = {
      esc: async (h) => h.key('Escape'),
      enter: async (h) => h.key('Enter'),
      tab: async (h) => h.key('Tab'),
      roda: async (h) => h.rodar(120),
      rodaRajada: async (h) => { for (let i = 0; i < 3; i++) { await h.rodar(120); await sleep(30); } },
      clique: async (h) => { const p = await h.ev(`const r=document.querySelector('.hero__acoes .btn').getBoundingClientRect(); return [r.left+20, r.top+r.height/2]`); await h.mouse('mousePressed', p[0], p[1]); await h.mouse('mouseReleased', p[0], p[1]); },
      toque: async (h) => { /* um arrasto para cima: o touchstart pula (com preventDefault) e o resto do gesto não rola */
        await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 600, id: 1 }] });
        for (let y = 560; y >= 300; y -= 40) { await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y, id: 1 }] }); await sleep(16); }
        await h.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); },
      abaOculta: async (h) => h.ev(`Object.defineProperty(document,'hidden',{value:true,configurable:true}); document.dispatchEvent(new Event('visibilitychange'))`)
    };
    for (const [nome, fn] of Object.entries(acoes)) {
      const movel = nome === 'toque';
      r[nome] = await session('pular-' + nome, { W: movel ? 390 : 1440, H: movel ? 844 : 900, mobile: movel, touch: movel, intro: true, out: OUT }, async (h) => {
        await preparar(h, limpaSessao);
        await h.go(h.base + '?intro=1');
        await h.ev(`await new Promise(r=>{(function w(){ if(performance.now()>900) r(); else setTimeout(w,20) })()})`);
        const t0 = await h.ev('return performance.now()');
        await fn(h);
        await sleep(700);
        if (nome === 'abaOculta') await h.ev(`Object.defineProperty(document,'hidden',{value:false,configurable:true})`);
        const linha = await h.ev('return __linha');
        const saida = linha.find((l) => l[1].includes('is-leaving'));
        const fora = linha.find((l) => l[1] === '#intro: (fora do DOM)');
        h.result.acaoEm = Math.round(t0);
        h.result.leavingMs = saida ? saida[0] - Math.round(t0) : null;
        h.result.removidoMs = fora ? fora[0] - Math.round(t0) : null;
        h.result.final = await h.ev(estadoFinal);
        h.result.linha = linha;
      });
    }
    return r;
  },

  /* JS da abertura bloqueado (onerror libera) e intro.js que carrega vazio (o failsafe em CSS libera) */
  async jsBloqueado() {
    const bloqueado = await session('js-bloqueado', { W: 1440, H: 900, intro: true, out: OUT }, async (h) => {
      await preparar(h, limpaSessao);
      await h.cdp.send('Network.setBlockedURLs', { urls: ['*intro.js*'] });
      await h.go(h.base + '?intro=1'); await sleep(1200);
      h.result.linha = await h.ev('return __linha');
      h.result.final = await h.ev(estadoFinal);
      h.result.captura = await h.shot('1s');
    });
    const vazio = await session('js-vazio', { W: 1440, H: 900, intro: true, out: OUT }, async (h) => {
      await preparar(h, limpaSessao);
      await h.cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*intro.js*' }] });
      h.cdp.on('Fetch.requestPaused', (p) => h.cdp.send('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/javascript' }], body: Buffer.from('/* vazio */').toString('base64') }));
      await h.cdp.send('Page.navigate', { url: h.base + '?intro=1' });
      const cobertura = () => h.ev(`const s=getComputedStyle(document.documentElement,'::before'); return { introActive: document.documentElement.classList.contains('intro-active'), cobertura: s.content !== 'none' ? (s.visibility + ' ' + (+s.opacity).toFixed(2)) : 'sem', heroRodando: document.querySelector('.hero__sub').getAnimations().map(a=>a.playState).join(','), t: Math.round(performance.now()) }`);
      await sleep(3000);
      h.result.aos3s = await cobertura();
      h.result.captura3s = await h.shot('3s');
      await sleep(4500);
      h.result.aos7s5 = await cobertura();
      h.result.captura7s5 = await h.shot('7s5');
    });
    return { bloqueado, vazio };
  },

  /* CPU 4× no celular: nenhum quadro preso, a abertura termina e libera */
  async cpu4() {
    return session('cpu4', { W: 390, H: 844, mobile: true, touch: true, cpu: 4, intro: true, out: OUT }, async (h) => {
      await preparar(h, limpaSessao);
      await h.go(h.base + '?intro=1'); await sleep(6500);
      h.result.linha = await h.ev('return __linha');
      h.result.quadros = resumoQuadros(await h.ev('return __quadros'));
      h.result.lentos = await h.ev('return __lentos');
      h.result.final = await h.ev(estadoFinal);
    });
  },

  /* movimento reduzido e ?fx=0: nunca há abertura, nem com ?intro=1 */
  async semAbertura() {
    const rm = await session('rm', { W: 1440, H: 900, rm: true, intro: true, out: OUT }, async (h) => {
      await preparar(h, limpaSessao);
      await h.go(h.base + '?intro=1'); await sleep(1200);
      h.result.final = await h.ev(`return { linha: __linha, intro: !!document.getElementById('intro') }`);
    });
    const fx0 = await session('fx0', { W: 1440, H: 900, intro: true, out: OUT }, async (h) => {
      await preparar(h, limpaSessao);
      await h.go(h.base + '?intro=1&fx=0'); await sleep(1200);
      h.result.final = await h.ev(`return { linha: __linha, intro: !!document.getElementById('intro') }`);
    });
    return { rm, fx0 };
  },

  /* o palco cabe em 360 px de largura e em 500 px de altura; traços ≥ 1 px de tela */
  async tamanhos() {
    const r = {};
    for (const [W, H] of [[360, 640], [390, 844], [900, 500], [1440, 900], [1920, 1080]]) {
      r[W + 'x' + H] = await session('tamanho-' + W + 'x' + H, { W, H, mobile: W < 800, touch: W < 800, intro: true, out: OUT }, async (h) => {
        await preparar(h, limpaSessao + "var st=window.setTimeout;window.setTimeout=function(f,ms){return ms>=1400?0:st.apply(window,arguments)};");
        await h.go(h.base + '?intro=1');
        await h.ev(`await new Promise(r=>{(function w(){ if(document.querySelector('#intro.is-growing')) r(); else setTimeout(w,30) })()})`);
        await sleep(2600);
        h.result.medidas = await h.ev(`const m=document.querySelector('.it-marca').getBoundingClientRect(), esc=m.width/1373;
          const traco=parseFloat(getComputedStyle(document.querySelector('.it-linha')).strokeWidth);
          const campo=[...document.querySelectorAll('.it-campo path')].map(p=>parseFloat(getComputedStyle(p).strokeWidth));
          return { marca: [Math.round(m.left), Math.round(m.top), Math.round(m.right), Math.round(m.bottom)], cabe: m.left>=0 && m.top>=0 && m.right<=innerWidth && m.bottom<=innerHeight,
            larguraLogo: Math.round(m.width), contornoPx: +(traco*esc).toFixed(2), campoPx: campo, menorTracoOficialPx: +(23.2*esc).toFixed(2) }`);
        h.result.captura = await h.shot('2s6');
      });
    }
    return r;
  },

  /* a pose final da abertura é a logo oficial: o palco congelado em 2,68 s × o sprite aprovado no mesmo lugar */
  async poseFinal() {
    const r = {};
    for (const [W, H] of [[1440, 900], [390, 844]]) {
      r[W] = await session('pose-' + W, { W, H, mobile: W < 800, intro: true, out: OUT }, async (h) => {
        await preparar(h, limpaSessao + "var st=window.setTimeout;window.setTimeout=function(f,ms){return ms>=1400?0:st.apply(window,arguments)};");
        await h.go(h.base + '?intro=1');
        await h.ev(`await new Promise(r=>{(function w(){ if(document.querySelector('#intro.is-growing')) r(); else setTimeout(w,30) })()})`);
        await h.ev(`window.__an=document.querySelector('#intro').getAnimations({subtree:true}); window.__an.forEach(a=>{a.pause(); const n=a.animationName||''; a.currentTime=Math.max(0,(2.68-(n.startsWith('ig')?0.4:0)))*1000;}); await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));`);
        const caixa = await h.ev(`const r=document.querySelector('.it-logo').getBoundingClientRect(); return {x:r.left,y:r.top,width:r.width,height:r.height}`);
        const clip = { x: Math.floor(caixa.x) - 4, y: Math.floor(caixa.y) - 4, width: Math.ceil(caixa.width) + 8, height: Math.ceil(caixa.height) + 8, scale: 1 };
        const grava = async (rot) => { const s = await h.cdp.send('Page.captureScreenshot', { format: 'png', clip }); const f = path.join(OUT, 'capturas', 'pose-' + W + '-' + rot + '.png'); fs.writeFileSync(f, Buffer.from(s.data, 'base64')); return f; };
        const a = await grava('abertura');
        /* linha de base: um clone estático dos mesmos paths (sem classes, sem animação) na mesma caixa */
        await h.ev(`const s=document.querySelector('.it-logo'); const k=s.cloneNode(true);
          k.querySelectorAll('.it-folha-traco,.it-linha').forEach(e=>e.remove());
          k.querySelectorAll('[class]').forEach(e=>e.removeAttribute('class')); k.removeAttribute('class'); k.id='clone';
          k.style.cssText='position:absolute;inset:0;width:100%;height:100%;overflow:visible'; s.style.visibility='hidden'; s.parentNode.appendChild(k);
          await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));`);
        const k = await grava('clone-estatico');
        /* o sprite oficial (<use>) exatamente na mesma caixa */
        await h.ev(`document.getElementById('clone').remove();
          const o=document.createElementNS('http://www.w3.org/2000/svg','svg'); o.setAttribute('viewBox','0 0 1373 687');
          o.style.cssText='position:absolute;inset:0;width:100%;height:100%;overflow:visible';
          o.innerHTML='<use href="assets/marca/tca-logo.svg#tca-logo"/>'; document.querySelector('.it-logo').parentNode.appendChild(o);
          await new Promise(r=>setTimeout(r,600)); await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));`);
        const b = await grava('oficial');
        const dif = path.join(OUT, 'capturas', 'pose-' + W + '-diferenca.png');
        execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', a, '-i', b, '-filter_complex', '[0][1]blend=all_mode=difference,eq=contrast=4', dif]);
        const { comparar } = require('./comparar-png');
        h.result.caixa = caixa;
        h.result.cloneXoficial = comparar(k, b);        /* geometria: 0 = mesmos paths que o sprite aprovado */
        h.result.aberturaXoficial = comparar(a, b);     /* resto = antisserrilhado das camadas animadas */
        h.result.arquivos = [a, k, b, dif].map((f) => path.relative(path.join(__dirname, '..', '..'), f).replace(/\\/g, '/'));
      });
    }
    return r;
  }
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const arq = path.join(OUT, 'resultados.json');
  const anteriores = fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq, 'utf8')) : {};
  const resultados = {};
  for (const [nome, fn] of Object.entries(CASOS)) {
    if (filtro && !nome.toLowerCase().includes(filtro.toLowerCase())) continue;
    console.log('▶', nome);
    resultados[nome] = await fn();
  }
  fs.writeFileSync(arq, JSON.stringify(Object.assign(anteriores, resultados, { _atualizado: new Date().toISOString() }), null, 1));
  const problemas = [];
  (function varrer(o, onde) {
    if (!o || typeof o !== 'object') return;
    if (o.problemas) { const p = o.problemas; if (p.console.length + p.excecoes.length + p.respostas.length + p.falhas.length) problemas.push({ onde: o.nome || onde, ...p }); }
    if (o.erro) problemas.push({ onde: o.nome || onde, erro: o.erro });
    for (const [k, v] of Object.entries(o)) if (k !== 'problemas') varrer(v, k);
  })(resultados, 'raiz');
  console.log(JSON.stringify({ problemas }, null, 1));
})();
