/*
 * QA da Fase 2 (landing sem a abertura). Edge headless via CDP, uma sessão por caso.
 * Uso (com o servidor rodando: node qa/ferramentas/servidor.js):
 *   node qa/ferramentas/fase2.js            → todos os casos
 *   node qa/ferramentas/fase2.js raizes     → só os casos cujo nome contém "raizes"
 * Saída: qa/fase2/resultados.json e qa/fase2/capturas/*.jpg
 * Limites: Edge (Chromium) headless no Windows; mobile é emulação (viewport + toque), não aparelho.
 */
const fs = require('fs');
const path = require('path');
const { session, sleep } = require('./cdp');

const OUT = path.join(__dirname, '..', 'fase2');
const filtro = process.argv[2] || '';
const resultados = {};

/* rola a página inteira em passos (dispara os reveals), volta ao topo */
async function percorrer(h) {
  const alt = await h.ev('return document.documentElement.scrollHeight');
  const H = h.opts.H;
  for (let y = 0; y <= alt; y += Math.round(H * 0.45)) { await h.ev(`window.scrollTo(0, ${y})`); await sleep(140); }
  await sleep(1400);
}
/* rolagem imediata (pelo Lenis quando ele existe, para o ScrollTrigger acompanhar) */
const rolar = (h, y) => h.ev(`const l=window.TCA&&TCA.lenis(); if(l) l.scrollTo(${y},{immediate:true,force:true}); else window.scrollTo(0,${y}); await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));`);

const CASOS = {
  /* 1. larguras: estouro lateral, quebras dos títulos, cabeçalho/menu, captura da página inteira */
  async larguras() {
    const saida = {};
    for (const [W, H] of [[320, 640], [390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]]) {
      const movel = W < 800;
      saida[W] = await session('largura-' + W, { W, H, mobile: movel, touch: movel, out: OUT }, async (h) => {
        await h.go(h.base);
        await sleep(2200);
        h.result.hero = await h.shot('1-hero');
        h.result.medidas = await h.ev(`
          const iw = innerWidth, sw = document.documentElement.scrollWidth;
          const vaza = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > iw + 0.5 || r.left < -0.5) && !e.closest('.faixa__trilho') && !e.closest('.midia') && !e.closest('.sprite') && !e.closest('.solo') && !e.closest('.ficha'); })
            .slice(0, 8).map(e => (e.className && e.className.baseVal !== undefined ? e.tagName : e.tagName + '.' + e.className) + ' ' + Math.round(e.getBoundingClientRect().right));
          const linhas = el => new Set([...el.querySelectorAll('.w')].map(w => w.offsetTop)).size;
          const vis = s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none'; };
          return { scrollWidth: sw, innerWidth: iw, estouro: sw > iw, vazamentos: vaza,
            titulos: [...document.querySelectorAll('[data-split]')].map(t => t.id + ': ' + linhas(t) + ' linha(s)'),
            navDesktop: vis('.topo__nav'), ctaTopo: vis('.topo__cta'), botaoMenu: vis('.topo__menu'),
            marca: [...document.querySelectorAll('.marca')].map(m => m.classList.contains('is-pendente') ? 'texto (sprite não renderizou)' : 'sprite ok'),
            alturaPagina: document.documentElement.scrollHeight }`);
        await percorrer(h);
        await rolar(h, 0); await sleep(300);
        h.result.inteira = await h.shot('2-inteira', true);
      });
    }
    return saida;
  },

  /* 2. menu do celular: abre, foco, inércia, Esc, âncora de dentro do menu */
  async menuMovel() {
    return session('menu-390', { W: 390, H: 844, mobile: true, touch: true, out: OUT }, async (h) => {
      await h.go(h.base); await sleep(1500);
      const centro = await h.ev(`const r=document.querySelector('.topo__menu').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]`);
      await h.tap(centro[0], centro[1]); await sleep(500);
      h.result.aberto = await h.ev(`return { expandido: document.querySelector('.topo__menu').getAttribute('aria-expanded'), rotulo: document.querySelector('.topo__menu .sr').textContent,
        foco: document.activeElement.textContent.trim(), mainInerte: document.getElementById('conteudo').inert, travaRolagem: getComputedStyle(document.documentElement).overflow + ' / lenis-stopped=' + document.documentElement.classList.contains('lenis-stopped') }`);
      h.result.capturaAberto = await h.shot('aberto');
      await h.key('Escape'); await sleep(300);
      h.result.aposEsc = await h.ev(`return { expandido: document.querySelector('.topo__menu').getAttribute('aria-expanded'), menuOculto: document.getElementById('menu-movel').hidden, foco: document.activeElement.className, mainInerte: document.getElementById('conteudo').inert }`);
      await h.tap(centro[0], centro[1]); await sleep(400);
      const link = await h.ev(`const r=[...document.querySelectorAll('.menu-movel__nav a')].find(a=>a.getAttribute('href')==='#sobre').getBoundingClientRect(); return [r.left+20, r.top+r.height/2]`);
      await h.tap(link[0], link[1]); await sleep(1800);
      h.result.ancoraPeloMenu = await h.ev(`return { menuOculto: document.getElementById('menu-movel').hidden, topoDoAlvo: Math.round(document.getElementById('sobre').getBoundingClientRect().top), alturaCabecalho: Math.round(document.querySelector('.topo').getBoundingClientRect().height), hash: location.hash, foco: document.activeElement.id }`);
      h.result.capturaSobre = await h.shot('ancora-sobre');
    });
  },

  /* 3. âncoras no desktop (Lenis): destino logo abaixo do cabeçalho e foco no destino */
  async ancoras() {
    return session('ancoras-1440', { W: 1440, H: 900, out: OUT }, async (h) => {
      await h.go(h.base); await sleep(1500);
      h.result.links = [];
      for (const id of ['servicos', 'como-funciona', 'sobre', 'contato', 'inicio']) {
        const sel = id === 'inicio' ? '.topo .marca' : `.topo__nav a[href="#${id}"]`;
        const p = await h.ev(`const r=document.querySelector('${sel}').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]`);
        await h.mouse('mousePressed', p[0], p[1]); await h.mouse('mouseReleased', p[0], p[1]);
        await sleep(1700);
        h.result.links.push(await h.ev(`return { id: '${id}', topo: Math.round(document.getElementById('${id}').getBoundingClientRect().top), scrollY: Math.round(scrollY), foco: document.activeElement.id || document.activeElement.tagName, hash: location.hash }`));
      }
      /* "Pular para o conteúdo" pelo teclado */
      await h.go(h.base); await sleep(1200);
      await h.key('Tab'); await sleep(150);
      h.result.pularVisivel = await h.ev(`const a=document.activeElement, r=a.getBoundingClientRect(); return { texto: a.textContent, top: Math.round(r.top), outline: getComputedStyle(a).outlineStyle }`);
      h.result.capturaPular = await h.shot('pular');
      await h.key('Enter'); await sleep(1500);
      h.result.aposPular = await h.ev('return document.activeElement.id');
    });
  },

  /* 4. raízes: progresso medido em p ≈ 0,25 / 0,5 / 0,75 descendo e subindo; anéis sem piscar na rolagem real */
  async raizes() {
    const saida = {};
    for (const [W, H, movel] of [[1440, 900, false], [390, 844, true]]) {
      saida[W] = await session('raizes-' + W, { W, H, mobile: movel, touch: false, out: OUT }, async (h) => {
        await h.go(h.base); await sleep(1500);
        const faixa = await h.ev(`
          const largo = innerWidth >= 720, H = innerHeight, sy = scrollY;
          const t = largo ? document.querySelector('.raizes__svg') : document.querySelector('[data-raizes]');
          const r = t.getBoundingClientRect();
          const ini = r.top + sy - 0.78 * H, fim = r.bottom + sy - (largo ? 0.40 : 0.60) * H;
          return { ini, fim, largo }`);
        const em = (p) => Math.round(faixa.ini + p * (faixa.fim - faixa.ini));
        const ler = () => h.ev(`const s = TCA.raizes();
          const tr = [...document.querySelectorAll('.raizes__traco path')].map(p => +parseFloat(getComputedStyle(p).strokeDashoffset).toFixed(3));
          const m = document.querySelector('.raizes__trilho i'); const esc = getComputedStyle(m).transform;
          return { p: +s.p.toFixed(3), aceso: s.aceso, dashoffset: tr, trilhoMovel: esc }`);
        h.result.faixaDeRolagem = faixa;
        h.result.descendo = [];
        for (const p of [0.25, 0.5, 0.75, 1]) { await rolar(h, em(p)); await sleep(120); h.result.descendo.push(Object.assign({ alvo: p }, await ler())); if (p === 0.75) h.result.captura075 = await h.shot('p075'); }
        h.result.subindo = [];
        for (const p of [0.75, 0.5, 0.25, 0]) { await rolar(h, em(p)); await sleep(120); h.result.subindo.push(Object.assign({ alvo: p }, await ler())); }
        /* rolagem real pela roda (Lenis suaviza): conta quantas vezes cada anel muda de estado */
        await rolar(h, em(-0.15)); await sleep(300);
        const trocas = async (sentido) => {
          const hist = [];
          for (let i = 0; i < 40; i++) { await h.rodar(sentido * 45); await sleep(60); hist.push((await h.ev('return TCA.raizes().aceso')).map(Number).join('')); }
          await sleep(700); hist.push((await h.ev('return TCA.raizes().aceso')).map(Number).join(''));
          const n = [0, 0, 0];
          for (let i = 1; i < hist.length; i++) for (let k = 0; k < 3; k++) if (hist[i][k] !== hist[i - 1][k]) n[k]++;
          return { trocasPorAnel: n, estadoFinal: hist[hist.length - 1], pFinal: +(await h.ev('return TCA.raizes().p')).toFixed(3) };
        };
        h.result.rodaDescendo = await trocas(1);
        h.result.capturaFimRoda = await h.shot('fim-roda');
        h.result.rodaSubindo = await trocas(-1);
      });
    }
    return saida;
  },

  /* 5. marquee: velocidade, aceleração com a rolagem, pausa fora da tela, aba oculta e botão */
  async marquee() {
    return session('marquee-1440', { W: 1440, H: 900, out: OUT }, async (h) => {
      await h.go(h.base); await sleep(1500);
      const y0 = await h.ev(`const r=document.querySelector('.faixa').getBoundingClientRect(); return Math.round(r.top + scrollY - innerHeight/2)`);
      await rolar(h, y0); await sleep(800);
      const desloc = async (ms) => {
        const a = await h.ev('return TCA.faixa()'); await sleep(ms); const b = await h.ev('return TCA.faixa()');
        let d = b.x - a.x; if (d > b.larg / 2) d -= b.larg; if (d < -b.larg / 2) d += b.larg;
        return { pxPorSegundo: +(d / (ms / 1000)).toFixed(1), rodando: b.rodando, vel: +b.vel.toFixed(2) };
      };
      h.result.parado = await desloc(1000);
      const rodando = [];
      for (let i = 0; i < 5; i++) { await h.rodar(40); await sleep(40); }
      rodando.push(await desloc(300));
      h.result.rolandoParaBaixo = rodando[0];
      await sleep(2500);
      h.result.depoisDeParar = await desloc(1000);
      for (let i = 0; i < 5; i++) { await h.rodar(-40); await sleep(40); }
      h.result.rolandoParaCima = await desloc(300);
      await sleep(2000);
      /* aba oculta (simulada: o headless não oculta a aba de verdade) */
      await rolar(h, y0); await sleep(300);
      await h.ev(`Object.defineProperty(document,'hidden',{value:true,configurable:true}); document.dispatchEvent(new Event('visibilitychange'))`);
      h.result.abaOculta = await desloc(800);
      await h.ev(`Object.defineProperty(document,'hidden',{value:false,configurable:true}); document.dispatchEvent(new Event('visibilitychange'))`);
      await sleep(200);
      h.result.abaVisivelDeNovo = await desloc(800);
      /* botão de pausa */
      const b = await h.ev(`const r=document.querySelector('.faixa__pausa').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]`);
      await h.mouse('mousePressed', b[0], b[1]); await h.mouse('mouseReleased', b[0], b[1]); await sleep(200);
      h.result.pausadaPeloBotao = Object.assign(await desloc(800), await h.ev(`const b=document.querySelector('.faixa__pausa'); return { ariaPressed: b.getAttribute('aria-pressed'), rotulo: b.textContent.trim() }`));
      h.result.capturaPausada = await h.shot('pausada');
      await h.mouse('mousePressed', b[0], b[1]); await h.mouse('mouseReleased', b[0], b[1]); await sleep(200);
      /* fora da tela */
      await rolar(h, y0 + 2600); await sleep(500);
      h.result.foraDaTela = await desloc(800);
      h.result.leitores = await h.ev(`return { gruposLidos: document.querySelectorAll('.faixa__grupo:not([aria-hidden])').length, copias: document.querySelectorAll('.faixa__grupo[aria-hidden="true"]').length }`);
    });
  },

  /* 6. magnético: segue o ponteiro fino, volta ao soltar; nada no toque */
  async magnetico() {
    const fino = await session('magnetico-1440', { W: 1440, H: 900, out: OUT }, async (h) => {
      await h.go(h.base); await sleep(1500);
      const y = await h.ev(`const r=document.querySelector('.magnetico').getBoundingClientRect(); return Math.round(r.top + scrollY - innerHeight/2)`);
      await rolar(h, y); await sleep(2000);
      const r = await h.ev(`const r=document.querySelector('.magnetico').getBoundingClientRect(); return {x:r.left,y:r.top,w:r.width,h:r.height}`);
      await h.mouse('mouseMoved', r.x + r.w / 2, r.y + r.h / 2); await sleep(100);
      await h.mouse('mouseMoved', r.x + r.w - 6, r.y + 6); await sleep(600);
      h.result.comPonteiro = await h.ev(`return { botao: getComputedStyle(document.querySelector('.magnetico')).transform, rotulo: getComputedStyle(document.querySelector('.magnetico .btn__rotulo')).transform }`);
      h.result.capturaPerto = await h.shot('perto');
      await h.mouse('mouseMoved', r.x + r.w / 2, r.y - 220); await sleep(1200);
      h.result.aposSair = await h.ev(`return getComputedStyle(document.querySelector('.magnetico')).transform`);
      /* clique no CTA sem destino: aviso honesto e sem salto de rolagem */
      const antes = await h.ev('return Math.round(scrollY)');
      await h.mouse('mouseMoved', r.x + r.w / 2, r.y + r.h / 2); await sleep(500);
      const r2 = await h.ev(`const r=document.querySelector('.magnetico').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2]`);
      await h.mouse('mousePressed', r2[0], r2[1]); await h.mouse('mouseReleased', r2[0], r2[1]); await sleep(900);
      h.result.cliqueSemDestino = await h.ev(`return { aviso: document.querySelector('[data-aviso]').textContent, scrollAntes: ${antes}, scrollDepois: Math.round(scrollY), hash: location.hash }`);
      h.result.capturaAviso = await h.shot('aviso');
    });
    const toque = await session('magnetico-toque', { W: 390, H: 844, mobile: true, touch: true, out: OUT }, async (h) => {
      await h.go(h.base); await sleep(1500);
      const y = await h.ev(`const r=document.querySelector('.magnetico').getBoundingClientRect(); return Math.round(r.top + scrollY - innerHeight/2)`);
      await h.ev(`window.scrollTo(0, ${y})`); await sleep(1200);
      const r = await h.ev(`const r=document.querySelector('.magnetico').getBoundingClientRect(); return {x:r.left,y:r.top,w:r.width,h:r.height}`);
      await h.mouse('mouseMoved', r.x + 10, r.y + 10); await sleep(500);
      h.result.semMagnetico = await h.ev(`return { hoverFino: matchMedia('(hover: hover) and (pointer: fine)').matches, transform: getComputedStyle(document.querySelector('.magnetico')).transform }`);
    });
    return { fino, toque };
  },

  /* 7. movimento reduzido no carregamento, ao vivo e por ?fx=0 */
  async reduzido() {
    const estadoFinal = `return {
      rm: document.documentElement.classList.contains('rm'), lenis: !!(window.TCA && TCA.lenis()), htmlLenis: document.documentElement.classList.contains('lenis'),
      armados: document.querySelectorAll('.is-armado').length,
      tracos: [...document.querySelectorAll('.raizes__traco path')].map(p => parseFloat(getComputedStyle(p).strokeDashoffset)),
      aneis: [...document.querySelectorAll('.anel-luz')].map(a => getComputedStyle(a).opacity),
      faixa: { transform: getComputedStyle(document.querySelector('.faixa__trilho')).transform, copiasVisiveis: [...document.querySelectorAll('.faixa__grupo[data-clone]')].filter(g => getComputedStyle(g).display !== 'none').length, botao: getComputedStyle(document.querySelector('.faixa__pausa')).display, rodando: TCA.faixa() && TCA.faixa().rodando },
      h1: getComputedStyle(document.querySelector('.hero__titulo')).opacity,
      palavrasDeslocadas: [...document.querySelectorAll('.w > span')].filter(s => getComputedStyle(s).transform !== 'none').length }`;
    const carga = await session('reduzido-carga', { W: 1440, H: 900, rm: true, out: OUT }, async (h) => {
      await h.go(h.base); await sleep(1200);
      h.result.estado = await h.ev(estadoFinal);
      h.result.inteira = await h.shot('inteira', true);
    });
    const aoVivo = await session('reduzido-ao-vivo', { W: 1440, H: 900, out: OUT }, async (h) => {
      await h.go(h.base); await sleep(1500);
      h.result.antes = await h.ev(estadoFinal);
      await h.cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await sleep(500);
      h.result.depoisDeLigar = await h.ev(estadoFinal);
      await h.cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
      await sleep(500);
      h.result.depoisDeDesligar = await h.ev(estadoFinal);
    });
    const fx0 = await session('reduzido-fx0', { W: 390, H: 844, mobile: true, touch: true, out: OUT }, async (h) => {
      await h.go(h.base + '?fx=0'); await sleep(1200);
      h.result.estado = await h.ev(estadoFinal);
      h.result.inteira = await h.shot('inteira', true);
    });
    return { carga, aoVivo, fx0 };
  },

  /* 8. sem JavaScript: tudo legível */
  async semJs() {
    const r = {};
    for (const [W, H] of [[1440, 900], [390, 844]]) {
      r[W] = await session('sem-js-' + W, { W, H, js: false, mobile: W < 800, out: OUT }, async (h) => {
        await h.go(h.base); await sleep(1500);
        h.result.inteira = await h.shot('inteira', true);
      });
    }
    return r;
  },

  /* 9. teclado: ordem de foco e anel visível sobre claro e sobre Floresta */
  async teclado() {
    return session('teclado-1440', { W: 1440, H: 900, out: OUT }, async (h) => {
      await h.go(h.base); await sleep(1500);
      h.result.ordem = [];
      for (let i = 0; i < 12; i++) {
        await h.key('Tab'); await sleep(80);
        h.result.ordem.push(await h.ev(`const a=document.activeElement; const cs=getComputedStyle(a); return (a.textContent.trim().slice(0,28) || a.getAttribute('aria-label') || a.tagName) + ' | outline ' + cs.outlineStyle + ' ' + cs.outlineColor`));
        if (i === 2) h.result.capturaNav = await h.shot('foco-nav');
      }
      await h.ev(`document.querySelector('.magnetico').focus(); document.querySelector('.magnetico').scrollIntoView({block:'center'})`);
      await sleep(800);
      await h.key('Tab'); await h.key('Tab', 8);  /* Shift+Tab (modificador 8): volta ao CTA pelo teclado para o :focus-visible valer */
      await sleep(300);
      h.result.focoCta = await h.ev(`const cs=getComputedStyle(document.activeElement); return document.activeElement.className + ' | ' + cs.outlineStyle + ' ' + cs.outlineColor + ' ' + cs.outlineWidth`);
      h.result.capturaCta = await h.shot('foco-cta');
    });
  },

  /* 10. CPU 4×: tarefas longas ao carregar e ao rolar a página inteira pela roda */
  async cpu4() {
    const r = {};
    for (const q of ['', '?fx=0']) r[q || 'efeitos'] = await session('cpu4-390' + (q ? '-fx0' : ''), { W: 390, H: 844, mobile: true, touch: true, cpu: 4, out: OUT }, async (h) => {
      await h.cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: "window.__lt=[];try{new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__lt.push(Math.round(e.duration)))).observe({type:'longtask',buffered:true})}catch(e){}" });
      await h.go(h.base + q); await sleep(3000);
      h.result.carga = await h.ev(`return { tarefasLongas: __lt.slice(), soma: __lt.reduce((a,b)=>a+b,0) }`);
      await h.ev('__lt.length=0; window.__q=[]; let t0=performance.now(); (function f(t){__q.push(t); if(t-t0<9000) requestAnimationFrame(f)})(t0)');
      for (let i = 0; i < 70; i++) { await h.ev('window.scrollBy(0, 90)'); await sleep(110); }
      await sleep(1500);
      h.result.rolagem = await h.ev(`const d=[]; for(let i=1;i<__q.length;i++) d.push(__q[i]-__q[i-1]); d.sort((a,b)=>a-b);
        return { quadros: __q.length, mediana: +d[Math.floor(d.length/2)].toFixed(1), p95: +d[Math.floor(d.length*0.95)].toFixed(1), maior: +d[d.length-1].toFixed(1), acimaDe50ms: d.filter(x=>x>50).length, tarefasLongas: __lt.slice() }`);
    });
    return r;
  }
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const arq = path.join(OUT, 'resultados.json');
  const anteriores = fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq, 'utf8')) : {};
  for (const [nome, fn] of Object.entries(CASOS)) {
    if (filtro && !nome.toLowerCase().includes(filtro.toLowerCase())) continue;
    console.log('▶', nome);
    resultados[nome] = await fn();
  }
  const tudo = Object.assign(anteriores, resultados, { _atualizado: new Date().toISOString() });
  fs.writeFileSync(arq, JSON.stringify(tudo, null, 1));
  /* problemas de console/rede de todas as sessões desta rodada */
  const problemas = [];
  (function varrer(o, onde) {
    if (!o || typeof o !== 'object') return;
    if (o.problemas) { const p = o.problemas; const n = p.console.length + p.excecoes.length + p.respostas.length + p.falhas.length; if (n) problemas.push({ onde: o.nome || onde, ...p }); }
    if (o.erro) problemas.push({ onde: o.nome || onde, erro: o.erro });
    for (const [k, v] of Object.entries(o)) if (k !== 'problemas') varrer(v, k);
  })(resultados, 'raiz');
  console.log(JSON.stringify({ problemas }, null, 1));
})();
