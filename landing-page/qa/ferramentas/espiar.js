/* Olhada rápida: carrega, espera a entrada da hero, rola a página inteira devagar e fotografa.
   Uso: node qa/ferramentas/espiar.js 1440x900 [rotulo] [query] */
const { session, sleep } = require('./cdp');
const [W, H] = (process.argv[2] || '1440x900').split('x').map(Number);
const rotulo = process.argv[3] || ('espiar-' + W);
const query = process.argv[4] || '';
session(rotulo, { W, H, mobile: W < 800, touch: W < 800, dpr: 1, out: require('path').join(__dirname, '..', 'rascunho') }, async (h) => {
  await h.go(h.base + query);
  await sleep(2200);
  h.result.hero = await h.shot('hero');
  h.result.medidas = await h.ev(`return {sw: document.documentElement.scrollWidth, iw: innerWidth, alt: document.documentElement.scrollHeight,
    lenis: document.documentElement.classList.contains('lenis'), marcaPendente: [...document.querySelectorAll('.marca')].map(m=>m.className),
    h1linhas: new Set([...document.querySelectorAll('.hero__titulo .w')].map(w=>w.offsetTop)).size }`);
  const alt = h.result.medidas.alt;
  for (let y = 0; y < alt; y += Math.round(H * 0.5)) { await h.ev(`window.scrollTo(0, ${y})`); await sleep(160); }
  await sleep(1500);
  await h.ev('window.scrollTo(0,0)'); await sleep(400);
  h.result.inteira = await h.shot('inteira', true);
}).then((r) => console.log(JSON.stringify(r, null, 1)));
