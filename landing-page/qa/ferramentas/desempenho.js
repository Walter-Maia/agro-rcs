/* Auditoria de desempenho num tamanho de tela (28/10, v0.6.3), nesta ordem:
     carga ......... fria, sem cache: bytes e pedidos por tipo, FCP, LCP, CLS e TBT (tarefas longas depois do FCP)
     hero-parado ... no topo, sem tocar em nada (o broto em WebGL desenha a cada quadro)
     rolagem ....... a página inteira, ~2000 px/s: pela roda do mouse no desktop (passa pelo Lenis), por scrollBy no toque
     fim/meio ...... parado no fim da página e no meio dos serviços
     menu-* ........ de volta ao topo: abrir, passar o mouse pelos cinco links (as cenas vivas), parado, fechar e o
                     depois (com o menu fechado nenhuma timeline das cenas pode continuar ativa)
   Em cada janela: custo do fio principal por segundo (Performance.getMetrics), quantos rAF o código da página pede
   por segundo (no topo, um a mais por quadro denuncia o broto desenhado duas vezes), a duração dos quadros
   (p50/p95/máx, só onde há movimento) e os quadros longos (LoAF, > 50 ms) com os scripts culpados.
   Uso: node qa/ferramentas/desempenho.js [1440x900] [cpu=1] [rede: cabo|4g] [pasta-de-saida]
   (abaixo de 800 px de largura vai com toque, "mobile" e dpr 2; 4g = 150 ms de latência e 1,6 Mbps, como o
   Lighthouse no celular). Os custos por segundo dependem da taxa do monitor (nesta máquina, 240 Hz: cerca de 4×
   os de um monitor de 60 Hz); valem para comparar versões, não como número absoluto. */
const fs = require('fs');
const path = require('path');
const { session, sleep } = require('./cdp');
const [W, H] = (process.argv[2] || '1440x900').split('x').map(Number);
const cpu = Number(process.argv[3]) || 1;
const rede = process.argv[4] || 'cabo';
const out = process.argv[5] || path.join(__dirname, '..', 'rascunho');
const movel = W < 800;

/* antes de qualquer script da página: observadores de desempenho, um contador de rAF e um gravador de quadros
   que usa o rAF original (não entra na conta) */
const SONDA = `(() => {
  const raf0 = window.requestAnimationFrame.bind(window);
  const P = window.__perf = { lcp: 0, lcpEl: '', cls: 0, longas: [], loaf: [], fcp: 0, rafs: 0, q: null };
  window.requestAnimationFrame = function (cb) { P.rafs++; return raf0(cb); };
  const obs = (type, fn) => { try { new PerformanceObserver((l) => l.getEntries().forEach(fn)).observe({ type, buffered: true }); } catch (e) {} };
  obs('largest-contentful-paint', (e) => { const el = e.element; P.lcp = e.startTime;
    P.lcpEl = (el ? el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : '') : '') + (e.url ? ' ' + e.url.split('/').pop() : ''); });
  obs('layout-shift', (e) => { if (!e.hadRecentInput) P.cls += e.value; });
  obs('longtask', (e) => P.longas.push([Math.round(e.startTime), Math.round(e.duration)]));
  obs('long-animation-frame', (e) => P.loaf.push({ t: Math.round(e.startTime), d: Math.round(e.duration), bloqueio: Math.round(e.blockingDuration || 0),
    estiloLayout: e.styleAndLayoutStart ? Math.round(e.startTime + e.duration - e.styleAndLayoutStart) : 0,
    scripts: (e.scripts || []).map((s) => (s.sourceURL || '?').split('/').pop().split('?')[0] + ' ' + (s.sourceFunctionName || s.invoker || '') + ' ' + Math.round(s.duration) + 'ms').slice(0, 4) }));
  obs('paint', (e) => { if (e.name === 'first-contentful-paint') P.fcp = e.startTime; });
  P.gravar = () => { const q = P.q = []; let ant = performance.now(); const f = (t) => { if (P.q !== q) return; q.push(t - ant); ant = t; raf0(f); }; raf0(f); };
  P.parar = () => { const q = P.q || []; P.q = null; return q.slice(1); };
})();`;

function estat(q) {
  if (!q || !q.length) return null;
  const s = q.slice().sort((a, b) => a - b), soma = q.reduce((a, b) => a + b, 0);
  const pc = (p) => +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(1);
  return { n: q.length, fps: +(q.length / (soma / 1000)).toFixed(1), p50: pc(0.5), p95: pc(0.95), p99: pc(0.99), max: +s[s.length - 1].toFixed(1),
    acima17ms: q.filter((x) => x > 17).length, acima25ms: q.filter((x) => x > 25).length, acima50ms: q.filter((x) => x > 50).length };
}

session('desempenho-' + W + 'x' + H, { W, H, dpr: movel ? 2 : 1, mobile: movel, touch: movel, cpu, out }, async (h) => {
  const { cdp, ev } = h;
  await cdp.send('Performance.enable', { timeDomain: 'timeTicks' });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: SONDA });
  if (rede === '4g') await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });

  /* rede: cada pedido com tipo, bytes na rede e em que janela ele saiu */
  const pedidos = new Map();
  let janelaAtual = 'carga', t0 = 0;
  cdp.on('Network.requestWillBeSent', (p) => {
    if (!t0) t0 = p.timestamp;
    pedidos.set(p.requestId, { url: p.request.url, tipo: p.type || '?', janela: janelaAtual, ini: Math.round((p.timestamp - t0) * 1000), bytes: 0 });
  });
  cdp.on('Network.responseReceived', (p) => { const r = pedidos.get(p.requestId); if (r) { r.tipo = p.type || r.tipo; r.status = p.response.status; } });
  cdp.on('Network.loadingFinished', (p) => { const r = pedidos.get(p.requestId); if (r) { r.bytes = p.encodedDataLength; r.fim = Math.round((p.timestamp - t0) * 1000); } });

  const metricas = async () => { const r = await cdp.send('Performance.getMetrics'); const m = {}; r.metrics.forEach((x) => (m[x.name] = x.value)); return m; };
  async function janela(nome, seg, acao, gravar) {
    janelaAtual = nome;
    process.stderr.write('· ' + nome + '\n');
    const m0 = await metricas(), r0 = await ev('return __perf.rafs'), l0 = await ev('return __perf.loaf.length');
    if (gravar) await ev('__perf.gravar(); return 1');
    const ini = Date.now();
    if (acao) await acao();
    const resto = seg * 1000 - (Date.now() - ini);
    if (resto > 0) await sleep(resto);
    const s = (Date.now() - ini) / 1000;
    const q = gravar ? await ev('return __perf.parar()') : null;
    const m1 = await metricas(), r1 = await ev('return __perf.rafs'), loaf = await ev(`return __perf.loaf.slice(${l0})`);
    const d = (k) => m1[k] - m0[k], porSeg = (k) => +((d(k) * 1000) / s).toFixed(1);
    const r = { seg: +s.toFixed(1), rafPorSeg: +((r1 - r0) / s).toFixed(1),
      fioPrincipal_msPorSeg: porSeg('TaskDuration'), script_msPorSeg: porSeg('ScriptDuration'), layout_msPorSeg: porSeg('LayoutDuration'), estilo_msPorSeg: porSeg('RecalcStyleDuration'),
      layouts: d('LayoutCount'), recalcEstilo: d('RecalcStyleCount'), quadros: estat(q), quadrosLongos: loaf.length,
      piores: loaf.sort((a, b) => b.d - a.d).slice(0, 3) };
    h.result.janelas[nome] = r;
    return r;
  }
  h.result.janelas = {};

  /* 1 · carga fria */
  await h.go(h.base);
  await sleep(rede === '4g' ? 9000 : 6000);
  process.stderr.write('· carga\n');
  h.result.carga = await ev(`const P = __perf, n = performance.getEntriesByType('navigation')[0];
    const tbt = P.longas.filter(([t]) => t >= P.fcp).reduce((a, [, d]) => a + Math.max(0, d - 50), 0);
    const c = document.createElement('canvas').getContext('webgl'), dbg = c && c.getExtension('WEBGL_debug_renderer_info');
    return { ttfb: Math.round(n.responseStart), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), fcp: Math.round(P.fcp), lcp: Math.round(P.lcp), lcpEl: P.lcpEl,
      cls: +P.cls.toFixed(4), tbt, tarefasLongas: P.longas.length, maiorTarefa: P.longas.reduce((a, [, d]) => Math.max(a, d), 0),
      dom: document.getElementsByTagName('*').length, webgl: dbg ? c.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : (c ? 'webgl sem debug' : 'sem webgl'),
      broto: window.TCA_BROTO && TCA_BROTO.estado && (({ gl, vertices, triangulos, dpr }) => ({ gl, vertices, triangulos, dpr }))(TCA_BROTO.estado()) }`);
  h.result.capa = await h.shot('capa');

  /* 2 · o hero parado */
  await janela('hero-parado', 4, null, false);

  /* 3 · a rolagem até o fim: pela roda no desktop; no toque, scrollBy (a roda não rola com o toque emulado).
     Para quando chega ao fim ou quando 8 passos seguidos não mexem na página. Um passo de roda que o Edge não
     confirma em 2 s vira scrollBy (e conta em rodaPresa), para a medição nunca travar */
  let rodaPresa = 0;
  await janela('rolagem', 1, async () => {
    let antes = -1;
    for (let i = 0; i < 600; i++) {
      if (movel) await ev('window.scrollBy(0, 100); return 1');
      else if (await Promise.race([h.rodar(100).then(() => true), sleep(2000).then(() => false)]) === false) { rodaPresa++; await ev('window.scrollBy(0, 100); return 1'); }
      await sleep(50);
      if (i % 8 === 7) {
        const y = await ev('return Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2 ? -2 : Math.round(scrollY)');
        if (y === -2 || y === antes) break;
        antes = y;
      }
    }
    await sleep(1500);
  }, true);
  h.result.rolagem = { alturaPagina: await ev('return document.documentElement.scrollHeight'), rodaPresa };

  /* 4 · parado no fim, e parado no meio dos serviços */
  await janela('fim-parado', 3, null, false);
  await ev('const s = document.getElementById("servicos"); window.scrollTo(0, s.offsetTop + s.offsetHeight * 0.4); return 1');
  await sleep(1500);
  await janela('meio-parado', 4, null, false);

  /* 5 · o menu, aberto de volta no topo (o broto tem de parar) */
  await ev('window.scrollTo(0, 0); return 1');
  await sleep(2000);
  const btn = await ev('const r = document.querySelector(".topo__menu").getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]');
  const clicar = async ([x, y]) => { if (movel) { await h.tap(x, y); return; } await h.mouse('mouseMoved', x, y); await h.mouse('mousePressed', x, y); await h.mouse('mouseReleased', x, y); };
  await janela('menu-abrir', 2, () => clicar(btn), true);
  if (!movel) {
    const links = await ev('return [...document.querySelectorAll(".menu__lista li")].map((li) => { const r = li.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })');
    await janela('menu-cenas', links.length * 1.3, async () => { for (const [x, y] of links) { await h.mouse('mouseMoved', x, y); await sleep(1300); } }, true);
    h.result.menuCena = await h.shot('menu-cena5');
  }
  await janela('menu-parado', 3, null, true);
  h.result.menuAberto = await ev('return { ativas: gsap.globalTimeline.getChildren(true, true, false).filter((t) => t.isActive()).length }');
  if (!movel) await h.mouse('mouseMoved', 40, H - 40);
  await janela('menu-fechar', 1.5, () => h.key('Escape'), true);
  await janela('depois-do-menu', 3, null, false);
  h.result.menuFechado = await ev(`return { aberto: document.documentElement.classList.contains('menu-aberto'),
    ativas: gsap.globalTimeline.getChildren(true, true, false).filter((t) => t.isActive()).map((t) => (t.targets ? t.targets().map((e) => e.getAttribute && (e.getAttribute('class') || e.tagName)).join(',') : 'timeline') + ' ' + t.duration().toFixed(1) + 's') }`);

  h.result.memoria = await ev('return performance.memory ? { heapMB: +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) } : null');
  /* resumo da rede por janela e por tipo */
  const lista = [...pedidos.values()];
  const porJanela = {};
  lista.forEach((r) => {
    const j = porJanela[r.janela] || (porJanela[r.janela] = { pedidos: 0, kb: 0, tipos: {} });
    j.pedidos++; j.kb += r.bytes / 1024;
    const t = j.tipos[r.tipo] || (j.tipos[r.tipo] = { n: 0, kb: 0 }); t.n++; t.kb += r.bytes / 1024;
  });
  Object.values(porJanela).forEach((j) => { j.kb = Math.round(j.kb); Object.values(j.tipos).forEach((t) => (t.kb = Math.round(t.kb))); });
  h.result.rede = porJanela;
  h.result.pedidos = lista.map((r) => ({ janela: r.janela, tipo: r.tipo, kb: +(r.bytes / 1024).toFixed(1), ini: r.ini, fim: r.fim, status: r.status,
    url: r.url.replace(h.base, '').replace(/^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net)\/.*\//, '$1/…/') }));
}).then((r) => {
  fs.mkdirSync(out, { recursive: true });
  const arq = path.join(out, `desempenho-${W}x${H}-cpu${cpu}-${rede}.json`);
  fs.writeFileSync(arq, JSON.stringify(r, null, 1));
  const { pedidos, ...resumo } = r;
  console.log(JSON.stringify(resumo, null, 1));
  console.log('pedidos e detalhes em', arq);
});
