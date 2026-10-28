/* Os três quadros do hero e a cortina, num tamanho de tela: capa (p 0), de cima (p 0,45), entrega (p 0,8)
   e a cortina subindo (p 1). Confere também vazamento horizontal e o lugar medido do broto.
   Uso: node qa/ferramentas/hero.js 390x844 [pasta-de-saida] [dpr]
   (a pasta padrão é qa/rascunho; os celulares, abaixo de 800 px de largura, vão com toque e "mobile") */
const path = require('path');
const { session, sleep } = require('./cdp');
const [W, H] = (process.argv[2] || '1440x900').split('x').map(Number);
const out = process.argv[3] || path.join(__dirname, '..', 'rascunho');
const dpr = Number(process.argv[4]) || (W < 800 ? 2 : 1);
session('hero-' + W + 'x' + H, { W, H, dpr, mobile: W < 800, touch: W < 800, out }, async (h) => {
  await h.go(h.base);
  await sleep(4200);
  const curso = await h.ev('const s=document.querySelector(".broto");return s.offsetHeight-innerHeight');
  h.result.medidas = await h.ev(`return {sw: document.documentElement.scrollWidth, iw: innerWidth, broto: window.TCA_BROTO && TCA_BROTO.estado(),
    texto: (()=>{const r=document.querySelector('.broto__texto').getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),left:Math.round(r.left),right:Math.round(r.right)}})()}`);
  h.result.capa = await h.shot('0-capa');
  for (const [p, nome] of [[0.45, '1-cima'], [0.8, '2-entrega'], [1.12, '3-cortina']]) {
    await h.ev(`window.scrollTo(0, ${Math.round(curso * p)}); return 1`);
    await sleep(1600);
    h.result[nome] = await h.shot(nome);
  }
}).then((r) => console.log(JSON.stringify({ medidas: r.medidas, erro: r.erro, problemas: r.problemas }, null, 1)));
