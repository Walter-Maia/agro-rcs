/* Regressão rápida da página inteira (28/10, v0.6.4), em 9 tamanhos e 2 com movimento reduzido:
   estouro lateral (só o que nenhum ancestral corta), imagens e vídeos quebrados, erros e respostas 4xx/5xx,
   contatos e botão do CTA, a linha dos serviços (velocidade máxima da ponta, travessias sem encostar em nada) e o
   menu (abre com o foco no 1º link e fecha com Esc). Foto do contato e do menu aberto em cada tamanho.
   Substitui, para o dia a dia, os casos do fase2.js que ficaram para trás na v0.4.0 (menu de celular, marquee).
   Uso: node qa/ferramentas/regressao.js [filtro] [pasta]   (filtro: "390", "rm", "1440"...; pasta padrão: qa/rascunho)
   A logo de reserva do hero (loading="lazy", só aparece sem WebGL) sai como "não carregada": é o esperado. */
const path = require('path');
const fs = require('fs');
const { session, sleep } = require('./cdp');
const filtro = process.argv[2] || '';
const out = process.argv[3] || path.join(__dirname, '..', 'rascunho');
const TELAS = [
  ['320x640', { dpr: 2, mobile: true, touch: true }], ['360x780', { dpr: 3, mobile: true, touch: true }], ['390x844', { dpr: 3, mobile: true, touch: true }],
  ['768x1024', { dpr: 2, mobile: true, touch: true }], ['1024x768', { dpr: 1 }], ['1280x800', { dpr: 1 }], ['1440x900', { dpr: 1 }],
  ['1920x1080', { dpr: 1 }], ['2560x1440', { dpr: 1 }], ['390x844-rm', { dpr: 3, mobile: true, touch: true, rm: true }], ['1440x900-rm', { dpr: 1, rm: true }],
];
const rolar = (h, y) => h.ev(`const l=window.TCA&&TCA.lenis(); if(l) l.scrollTo(${y},{immediate:true,force:true}); else scrollTo(0,${y}); await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); return 1`);
(async () => {
  const todos = {};
  for (const [nome, extra] of TELAS) {
    if (filtro && !nome.includes(filtro)) continue;
    const [W, H] = nome.split('-')[0].split('x').map(Number);
    todos[nome] = await session('regressao-' + nome, Object.assign({ W, H, out }, extra), async (h) => {
      await h.go(h.base);
      await sleep(1800);
      /* a página inteira em passos de meia tela (dispara os reveals e as imagens com loading="lazy") */
      const alt = await h.ev('return document.documentElement.scrollHeight');
      for (let y = 0; y <= alt; y += Math.round(H * 0.5)) { await rolar(h, y); await sleep(120); }
      await sleep(1500);
      h.result.pagina = await h.ev(`
        const iw = innerWidth, fora = [];
        document.querySelectorAll('body *').forEach(e => {
          const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
          if (r.right > iw + 1 || r.left < -1) {
            let a = e.parentElement, cortado = false;
            while (a && a !== document.body) { const cs = getComputedStyle(a); if (cs.overflowX !== 'visible' || cs.clipPath !== 'none' || cs.contain.includes('paint')) { cortado = true; break; } a = a.parentElement; }
            if (!cortado && getComputedStyle(e).position !== 'fixed') fora.push((e.className && e.className.baseVal === undefined ? e.className : e.tagName) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
          }
        });
        const canais = [...document.querySelectorAll('#contato-canais > div')].map(d => { const a = d.querySelector('a'), r = a && a.getBoundingClientRect(); return { dt: d.querySelector('dt').textContent, dd: d.querySelector('dd').textContent.trim(), href: a && a.getAttribute('href'), alvo: r ? Math.round(r.width) + 'x' + Math.round(r.height) : null }; });
        const cta = document.querySelector('.cta .btn--trigo'), t = window.TCA && TCA.trilha();
        return { estouro: document.documentElement.scrollWidth > document.documentElement.clientWidth, fora: fora.slice(0, 12),
          imagensNaoCarregadas: [...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => (i.currentSrc || i.src).split('/').pop()),
          fotoServico: [...document.querySelectorAll('.servico__midia img')].map(i => i.currentSrc.split('/').pop())[0],
          videosComErro: [...document.querySelectorAll('video')].filter(v => v.error).map(v => v.currentSrc + ' ' + v.error.code),
          canais, cta: { href: cta.getAttribute('href'), target: cta.target, rel: cta.rel },
          pendencias: ['A CONFIRMAR', 'Endereço'].filter(s => document.body.innerText.includes(s)),
          trilha: t && t.pontos ? { velMax: t.velMax, travessias: t.travessias.map(c => 'toques ' + c.toques + ', raio ' + c.raioMin), nosAcesos: t.nos.filter(Boolean).length + '/' + t.nos.length } : null };`);
      await h.ev(`document.querySelector('#contato-canais').scrollIntoView({block:'center'}); return 1`);
      await rolar(h, await h.ev('return Math.round(scrollY)'));
      await sleep(900);
      h.result.fotoContato = await h.shot('contato');
      /* menu: abre (clique ou toque), o foco vai ao 1º link; Esc fecha e devolve o foco ao botão */
      await rolar(h, 0); await sleep(500);
      const b = await h.ev(`const r=document.querySelector('.topo__menu').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}`);
      if (extra.touch) await h.tap(b.x, b.y); else { await h.mouse('mousePressed', b.x, b.y); await h.mouse('mouseReleased', b.x, b.y); }
      await sleep(1400);
      const aberto = await h.ev(`return { expandido: document.querySelector('.topo__menu').getAttribute('aria-expanded'), foco: document.activeElement.className }`);
      h.result.fotoMenu = await h.shot('menu');
      await h.key('Escape'); await sleep(900);
      const fechado = await h.ev(`return { expandido: document.querySelector('.topo__menu').getAttribute('aria-expanded'), foco: document.activeElement.className }`);
      h.result.menu = { ok: aberto.expandido === 'true' && aberto.foco === 'menu__link' && fechado.expandido === 'false', aberto, fechado };
    });
    const r = todos[nome], p = r.pagina || {};
    console.log(nome, JSON.stringify({ estouro: p.estouro, fora: p.fora, imagens: p.imagensNaoCarregadas, foto: p.fotoServico, videos: p.videosComErro, pendencias: p.pendencias,
      canais: (p.canais || []).map((c) => c.dt + ': ' + c.dd + ' → ' + c.href + ' (' + c.alvo + ')'), cta: p.cta, trilha: p.trilha, menu: r.menu && r.menu.ok, erro: r.erro, problemas: r.problemas }));
  }
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'regressao' + (filtro ? '-' + filtro : '') + '.json'), JSON.stringify(todos, null, 1));
})();
