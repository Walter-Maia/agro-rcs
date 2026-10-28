/* ------------------------------------------------------------
   TcaEnterprise — site.js v0.6.4
   Lenis (01), ScrollTrigger, títulos linha a linha (02), fotos com máscara (04),
   botão magnético (07), raízes desenhadas pela rolagem (assinatura), curvas de solo em carrossel,
   números das fichas, paralaxe da hero, cabeçalho e menu do celular.
   O visual de cada efeito está no site.css; aqui só se decide quando ligar.

   Carrega antes do GSAP/Lenis (defer, primeiro da fila) para quebrar o H1 sem esperar o CDN;
   o resto liga no DOMContentLoaded, quando as bibliotecas já rodaram.
   Sem GSAP/Lenis (CDN fora do ar): rolagem nativa, conteúdo todo visível e raízes já desenhadas.
   html.rm (movimento reduzido ou ?fx=0, decidido no <head>): nada é armado; Lenis, marquee e
   magnético ficam desligados, e a troca da preferência com a página aberta é acompanhada.
------------------------------------------------------------ */
(function () {
  'use strict';
  var root = document.documentElement;
  var mqReduz = matchMedia('(prefers-reduced-motion: reduce)');
  var mqFino = matchMedia('(hover: hover) and (pointer: fine)');
  var mqLargo = matchMedia('(min-width: 720px)');   /* raízes: diagrama em SVG; abaixo disso, traço vertical */
  var gsapOk = false, lenis = null;

  function reduzido() { return root.classList.contains('rm'); }
  function lista(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function limitar(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* ---------- 02 · títulos: cada palavra numa máscara; o atraso é o da linha em que ela caiu ---------- */
  var titulos = lista('[data-split]');
  var heroTitulo = document.querySelector('[data-split="hero"]');
  titulos.forEach(function (el) {
    var palavras = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    palavras.forEach(function (p, i) {
      if (i) el.appendChild(document.createTextNode(' '));
      var w = document.createElement('span'), s = document.createElement('span');
      w.className = 'w'; s.textContent = p;
      w.appendChild(s); el.appendChild(w);
    });
  });
  function numerarLinhas() {
    /* lê todas as posições antes de escrever, para não intercalar layout */
    var leituras = titulos.map(function (el) { return lista('.w', el).map(function (w) { return [w, w.offsetTop]; }); });
    leituras.forEach(function (ws) {
      var topo = null, n = -1;
      ws.forEach(function (par) {
        if (topo === null || Math.abs(par[1] - topo) > 4) { topo = par[1]; n++; }
        par[0].firstChild.style.setProperty('--n', n);
      });
    });
  }
  /* espera a Montserrat (pré-carregada) para medir as linhas; no máximo 0,9 s */
  function fontesProntas() {
    var carga = document.fonts && document.fonts.load ? document.fonts.load('800 1em Montserrat') : Promise.resolve();
    return Promise.race([carga, new Promise(function (ok) { setTimeout(ok, 900); })]).catch(function () {});
  }
  fontesProntas().then(function () {
    numerarLinhas();
    if (heroTitulo) heroTitulo.classList.add('is-split');
    if (gsapOk) ScrollTrigger.refresh();
  });
  var larguraAntes = innerWidth, tResize = 0;
  addEventListener('resize', function () {
    clearTimeout(tResize);
    tResize = setTimeout(function () { if (innerWidth !== larguraAntes) { larguraAntes = innerWidth; numerarLinhas(); } }, 150);
  });

  /* ---------- 1 · cabeçalho: o fundo aparece ao rolar e a cor segue a seção que está logo abaixo da barra,
     a que está sendo lida (.tema-escuro → .is-escuro: logo negativa e botão Algodão; a transição fica no CSS) ---------- */
  var topo = document.querySelector('.topo'), rolado = null, escuro = null;
  /* o hero (.broto) troca de tema no meio da rolagem: a classe é conferida a cada vez */
  var secoesEscuras = lista('.tema-escuro, [data-broto]');
  /* no máximo uma leitura por quadro: a rolagem dispara vários eventos entre duas pinturas */
  var rafTopo = 0;
  function pedirTopo() { if (!rafTopo) rafTopo = requestAnimationFrame(function () { rafTopo = 0; marcarTopo(); }); }
  var progresso = topo.querySelector('.topo__progresso'), progressoAntes = -1;
  function marcarTopo() {
    var y = window.scrollY || window.pageYOffset, r = y > 8;
    if (progresso) {
      var q = Math.round(limitar(y / Math.max(1, document.documentElement.scrollHeight - innerHeight)) * 1000) / 1000;
      if (q !== progressoAntes) { progressoAntes = q; progresso.style.transform = 'scaleX(' + q + ')'; }
    }
    if (r !== rolado) { rolado = r; topo.classList.toggle('is-rolado', r); }
    var linha = topo.offsetHeight + 12;   /* folga: âncoras param 8 px abaixo da barra (scroll-padding) */
    var e = secoesEscuras.some(function (s) { var b = s.getBoundingClientRect(); return s.classList.contains('tema-escuro') && b.top <= linha && b.bottom > linha; });
    if (e !== escuro) { escuro = e; topo.classList.toggle('is-escuro', e); }
  }
  addEventListener('scroll', pedirTopo, { passive: true });
  addEventListener('resize', pedirTopo);
  marcarTopo();
  function alturaTopo() { return topo.getBoundingClientRect().height; }

  /* logo do rodapé (<use> do sprite): se não renderizar (arquivo fora do ar), mostra o nome em texto */
  function conferirMarca() {
    lista('.marca').filter(function (m) { return m.querySelector('use'); }).forEach(function (m) {
      var caixa = null;
      try { caixa = m.querySelector('use').getBBox(); } catch (e) { /* sem layout */ }
      m.classList.toggle('is-pendente', !caixa || caixa.width < 1);
    });
  }
  addEventListener('load', function () { conferirMarca(); setTimeout(conferirMarca, 1500); });

  /* ---------- menu em tela cheia (adaptado do "kinetic navigation") ----------
     Abrir: véu e palco aparecem, as três camadas entram pela direita em cascata (Trigo, Floresta, Floresta
     funda), os links sobem por máscara e o rodapé do menu sobe por último. Fechar: véu e palco somem e o
     painel sai inteiro para a direita. Sem GSAP ou com movimento reduzido, o menu só aparece e some. O resto
     da página fica inerte enquanto ele está aberto; Esc e o véu fecham, e o foco volta ao botão.
     v0.6.1, o "lag": o ease "main" do componente (.65,.01,.05,.99) fica quase parado no primeiro terço e depois
     salta, então o clique parecia não responder. Agora entrada e saída usam a curva de saída do site (--ease-out,
     .16,1,.3,1): o painel anda já no primeiro quadro e assenta devagar. Com o menu aberto, o broto e as curvas
     de solo param (o véu os cobre) e o véu não desfoca mais o fundo (o backdrop-filter refazia o desfoque da
     tela inteira a cada quadro do canvas). */
  var botaoMenu = document.querySelector('.topo__menu'), menu = document.getElementById('menu');
  var painel = menu.querySelector('.menu__painel'), veu = menu.querySelector('.menu__veu'), palcoMenu = menu.querySelector('.menu__palco');
  var camadas = lista('.menu__camada', menu), linksMenu = lista('.menu__link', menu), fadesMenu = lista('[data-menu-fade]', menu);
  var itensMenu = lista('.menu__lista li[data-cena]', menu);
  var foraDoMenu = [document.getElementById('conteudo'), document.querySelector('.rodape'), document.querySelector('.pular')];
  /* o "main" do componente (.65,.01,.05,.99) como cúbica de Bézier resolvida aqui: o GSAP aceita uma função
     como ease, e o CustomEase (um pedido a mais ao CDN) saiu na v0.6.0 */
  function bezier(x1, y1, x2, y2) {
    function eixo(a, b, t) { return ((1 - 3 * b + 3 * a) * t + (3 * b - 6 * a)) * t * t + 3 * a * t; }
    function inclinacao(a, b, t) { return 3 * (1 - 3 * b + 3 * a) * t * t + 2 * (3 * b - 6 * a) * t + 3 * a; }
    return function (x) {
      if (x <= 0 || x >= 1) return x;
      var t = x;
      for (var i = 0; i < 8; i++) {   /* Newton-Raphson; a curva é monotônica em x */
        var d = inclinacao(x1, x2, t);
        if (Math.abs(d) < 1e-6) break;
        t -= (eixo(x1, x2, t) - x) / d;
      }
      return eixo(y1, y2, Math.min(1, Math.max(0, t)));
    };
  }
  var aberto = false, tlMenu = null, EASE_MENU = bezier(0.16, 1, 0.3, 1);
  /* v0.6.2: o menu fica montado e só escondido (.is-fechado = visibility): abrir não recalcula layout nem
     pinta o painel do zero. Sem JS, o atributo hidden do HTML continua valendo. */
  menu.hidden = false;
  menu.classList.add('is-fechado');
  function menuAberto() { return aberto; }
  function animarMenu() { return gsapOk && !reduzido(); }
  /* avisa o broto.js (e as curvas de solo) para parar ou voltar */
  function avisarMenu(estado) { document.dispatchEvent(new CustomEvent('tca:menu', { detail: estado })); solo.atualizar(); }
  function abrirMenu(abrir, devolverFoco) {
    if (abrir === aberto) return;
    aberto = abrir;
    /* a única leitura de layout vem antes de qualquer escrita (senão o navegador refaz o layout da página no meio) */
    if (abrir) cenaPadrao = secaoNaTela();
    botaoMenu.setAttribute('aria-expanded', String(abrir));
    botaoMenu.querySelector('.sr').textContent = abrir ? 'Fechar menu' : 'Abrir menu';
    root.classList.toggle('menu-aberto', abrir);
    /* inert recalcula o estilo da página inteira: ao abrir, fica para o quadro seguinte, fora do primeiro
       quadro da animação; ao fechar, sai na hora (o foco precisa voltar ao botão) */
    if (abrir) requestAnimationFrame(function () { if (aberto) foraDoMenu.forEach(function (el) { if (el) el.inert = true; }); });
    else foraDoMenu.forEach(function (el) { if (el) el.inert = false; });
    if (lenis) { if (abrir) lenis.stop(); else lenis.start(); }
    if (tlMenu) { tlMenu.kill(); tlMenu = null; }
    if (abrir) {
      avisarMenu(true);
      itensMenu.forEach(function (li) { li.classList.toggle('is-atual', li.getAttribute('data-cena') === cenaPadrao); });
      hoverCena = null; focoCena = null; cenaAtual = null;
      /* a cena da seção já chega pronta e viva: nada se desenha depois */
      decidirCena(true);
      if (animarMenu()) {
        /* v0.6.3, ~0,8 s no total: véu em 0,35 s, camadas em cascata, links por máscara (sem o giro, que datava)
           a partir de 0,14 s e, à esquerda, a cena pronta subindo e assentando */
        tlMenu = gsap.timeline({ defaults: { ease: EASE_MENU, duration: 0.7 } })
          .set(painel, { xPercent: 0 })
          .fromTo(veu, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' }, 0)
          .fromTo(camadas, { xPercent: 101 }, { xPercent: 0, stagger: 0.06 }, 0)
          .fromTo(linksMenu, { yPercent: 110 }, { yPercent: 0, stagger: 0.045, duration: 0.75, clearProps: 'transform' }, 0.14)
          .fromTo(fadesMenu, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.6, clearProps: 'all' }, 0.3);
        if (palcoVisivel()) {
          tlMenu.fromTo(palcoMenu, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'power2.out' }, 0.1)
            .fromTo(palcoCenas, { y: 24, scale: 0.94 }, { y: 0, scale: 1, duration: 1.1, clearProps: 'transform' }, 0.1)
            .fromTo(legenda, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, clearProps: 'all' }, 0.35);
        }
      }
      /* só aparece depois de o GSAP pôr cada peça no ponto de partida (fromTo já aplicou), sem piscar */
      menu.classList.remove('is-fechado');
      linksMenu[0].focus({ preventScroll: true });
    } else {
      if (animarMenu()) {
        tlMenu = gsap.timeline({
          defaults: { ease: EASE_MENU, duration: 0.5 },
          onComplete: function () { menu.classList.add('is-fechado'); trocarCena(null); gsap.set([painel, veu, palcoMenu, palcoCenas, legenda].concat(camadas, linksMenu, fadesMenu), { clearProps: 'all' }); avisarMenu(false); }
        })
          .to(palcoMenu, { autoAlpha: 0, duration: 0.25, ease: 'power1.in' }, 0)
          .to(veu, { autoAlpha: 0, duration: 0.35, ease: 'power1.inOut' }, 0.05)
          .to(painel, { xPercent: 104 }, 0);
      } else { menu.classList.add('is-fechado'); trocarCena(null); avisarMenu(false); }
      if (devolverFoco) botaoMenu.focus();
    }
  }
  botaoMenu.addEventListener('click', function () { abrirMenu(!aberto, true); });
  menu.querySelector('[data-menu-fechar]').addEventListener('click', function () { abrirMenu(false, true); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && aberto) abrirMenu(false, true);
  });

  /* ---------- cenas do menu (v0.6.3: prontas e vivas) ----------
     Cada link tem uma cena em linha da marca que já chega desenhada (o traçado na hora, de até 3 s, saiu) e fica
     viva enquanto está em cena, num ciclo sem fim:
       1 Início ........ os três anéis numa órbita: um ponto Trigo orbita, o halo pontilhado gira ao contrário,
                          o anel do meio emite ondas e os anéis respiram
       2 Serviços ...... três curvas de nível andam, cada uma no seu passo; a boia Trigo flutua na curva Trigo
                          e pulsa
       3 Como funciona . pulsos de luz descem pela haste e pelas raízes; cada anel acende quando o seu chega
       4 Sobre ......... o broto: as folhas balançam fora de fase, o nó respira e grãos de luz sobem dele
       5 Contato ....... traços Trigo correm pelas linhas até o pino, como mensagens chegando; o pino emite
                          ondas e os pontos do mapa piscam
     Em cena fica UM item: o do mouse; sem mouse, o do foco (teclado); sem os dois, a seção que está na tela.
     A troca é um cruzamento com zoom de 0,94 para 1 (CSS); a cena que sai continua viva até sumir e só então
     para, e se ela voltar antes disso, segue de onde estava. Fechado o menu, nada roda.
     Regras que evitam desenho quebrado: nada de vector-effect (com pathLength, ele desconta o tracejado),
     escala e giro só em <g> com svgOrigin explícito. */
  var cenasSvg = lista('.cena', menu);
  var legenda = menu.querySelector('.menu__legenda'), legendaNum = legenda.querySelector('[data-legenda-num]'), legendaTexto = legenda.querySelector('[data-legenda]');
  var palcoCenas = menu.querySelector('.menu__cenas');
  var cenaAtual = null, cenaPadrao = '1', hoverCena = null, focoCena = null, tlLegenda = null;
  var mqPalco = matchMedia('(min-width: 900px)');
  function palcoVisivel() { return mqPalco.matches; }
  function el(f, n) { return f.querySelector('[data-p="' + n + '"]'); }
  function els(f, n) { return lista('[data-p="' + n + '"]', f); }
  function caminhos(gs) { return gs.map(function (g) { return g.querySelector('path, circle'); }); }
  function centro(g) { return g.getAttribute('data-c'); }
  /* as curvas de Serviços: período de 400 unidades (a largura da cena), desenhadas de −20 a 820 para andar sem emenda */
  var ONDAS = [
    function (x) { var t = x / 400 * Math.PI * 2; return 160 + 26 * Math.sin(t + 0.6) + 9 * Math.sin(2 * t + 1.9); },
    function (x) { var t = x / 400 * Math.PI * 2; return 236 + 30 * Math.sin(t + 2.1) + 8 * Math.sin(2 * t + 0.4); },
    function (x) { var t = x / 400 * Math.PI * 2; return 302 + 22 * Math.sin(t + 4.0) + 7 * Math.sin(2 * t + 2.6); }
  ];
  lista('[data-onda]', menu).forEach(function (p) { p.setAttribute('d', curvaPeriodica(ONDAS[+p.getAttribute('data-onda')], -20, 820, 20)); });
  var CENAS = {
    1: function (f, tl) {
      var aneis = els(f, 'anel'), onda = el(f, 'onda');
      gsap.set([el(f, 'satelite'), el(f, 'giro')], { rotation: 0, svgOrigin: '200 200' });
      gsap.set(onda, { opacity: 0, scale: 1, svgOrigin: '200 268' });
      aneis.forEach(function (g) { gsap.set(g, { scale: 1, svgOrigin: centro(g) }); });
      tl.to(el(f, 'satelite'), { rotation: 360, duration: 12, ease: 'none', repeat: -1 }, 0)
        .to(el(f, 'giro'), { rotation: -360, duration: 70, ease: 'none', repeat: -1 }, 0)
        .fromTo(onda, { opacity: 0.75, scale: 1 }, { opacity: 0, scale: 2.3, duration: 2.2, ease: 'power2.out', repeat: -1, repeatDelay: 0.5 }, 0.15)
        .to(aneis, { scale: 1.05, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.35 }, 0);
    },
    2: function (f, tl) {
      var trilhos = els(f, 'trilho'), boia = el(f, 'boia'), halo = el(f, 'halo');
      gsap.set(trilhos, { x: 0 });
      gsap.set(halo, { opacity: 0, scale: 1, svgOrigin: '200 236' });
      function boiar() { gsap.set(boia, { y: ONDAS[1](200 - gsap.getProperty(trilhos[1], 'x')) - 236 }); }
      boiar();
      tl.to(trilhos[0], { x: -400, duration: 11, ease: 'none', repeat: -1 }, 0)
        .to(trilhos[1], { x: -400, duration: 7, ease: 'none', repeat: -1, onUpdate: boiar }, 0)
        .to(trilhos[2], { x: -400, duration: 15, ease: 'none', repeat: -1 }, 0)
        .fromTo(halo, { opacity: 0.7, scale: 1 }, { opacity: 0, scale: 2.8, duration: 1.8, ease: 'power2.out', repeat: -1, repeatDelay: 0.7 }, 0.2);
    },
    3: function (f, tl) {
      var cometas = els(f, 'cometa'), aneis = els(f, 'anel');
      aneis.forEach(function (g) { gsap.set(g, { scale: 1, svgOrigin: centro(g) }); });
      gsap.set(cometas, { strokeDasharray: '0.08 1', strokeDashoffset: 0.08 });
      gsap.set(caminhos(aneis), { fillOpacity: 0 });
      /* o pulso desce pela haste (mesmo caminho nos três) e se abre nas raízes; o anel acende quando ele chega */
      tl.add(gsap.timeline({ repeat: -1, repeatDelay: 0.5 })
        .fromTo(cometas, { strokeDashoffset: 0.08 }, { strokeDashoffset: -1, duration: 1.5, stagger: 0.16, ease: 'power1.in' }, 0)
        .to(aneis, { scale: 1.16, duration: 0.2, yoyo: true, repeat: 1, stagger: 0.16, ease: 'power2.out' }, 1.3)
        .to(caminhos(aneis), { fillOpacity: 0.3, duration: 0.2, yoyo: true, repeat: 1, stagger: 0.16 }, 1.3), 0.1);
    },
    4: function (f, tl) {
      var folhas = els(f, 'folha'), no = el(f, 'no'), polens = els(f, 'polen');
      gsap.set(folhas.concat(no), { rotation: 0, scale: 1, svgOrigin: '200 209' });
      gsap.set(polens, { x: 0, y: 0, opacity: 0 });
      tl.to(folhas[0], { rotation: 4, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0)
        .to(folhas[1], { rotation: -4, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0)
        .to(no, { scale: 1.3, duration: 1.3, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0);
      /* três grãos de luz sobem do nó, desencontrados: sobem 80 em 3,4 s e acendem no meio do caminho */
      polens.forEach(function (p, i) {
        tl.to(p, { y: -80, x: (i - 1) * 16, duration: 3.4, ease: 'sine.out', repeat: -1 }, i * 1.13)
          .to(p, { opacity: 0.9, duration: 1.7, ease: 'sine.inOut', yoyo: true, repeat: -1 }, i * 1.13);
      });
    },
    5: function (f, tl) {
      var pontos = els(f, 'ponto'), ligas = els(f, 'liga'), ondas = els(f, 'onda');
      pontos.forEach(function (g) { gsap.set(g, { scale: 1, svgOrigin: centro(g) }); });
      gsap.set(ondas, { opacity: 0, scale: 1, svgOrigin: '200 210' });
      gsap.set(ligas, { strokeDasharray: '0.03 0.17', strokeDashoffset: 0 });
      tl.to(ligas, { strokeDashoffset: -0.2, duration: 1.1, ease: 'none', repeat: -1 }, 0)
        .fromTo(ondas, { opacity: 0.8, scale: 1 }, { opacity: 0, scale: 3.6, duration: 2.2, ease: 'power2.out', stagger: { each: 1.1, repeat: -1 } }, 0)
        .to(pontos, { scale: 1.3, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: { each: 0.45, from: 'random' } }, 0);
    }
  };
  function cenaSvg(id) { return menu.querySelector('.cena[data-cena="' + id + '"]'); }
  function trocarLegenda(id, texto, imediato) {
    var num = ('0' + id).slice(-2);
    if (tlLegenda) { tlLegenda.kill(); tlLegenda = null; }
    if (imediato || !animarMenu()) {
      legendaNum.textContent = num;
      legendaTexto.textContent = texto;
      if (gsapOk) gsap.set(legendaTexto, { clearProps: 'transform' });
      return;
    }
    tlLegenda = gsap.timeline()
      .to(legendaTexto, { yPercent: -110, duration: 0.18, ease: 'power2.in' })
      .add(function () { legendaNum.textContent = num; legendaTexto.textContent = texto; })
      .fromTo(legendaTexto, { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: EASE_MENU });
  }
  function trocarCena(id, imediato) {
    if (id === cenaAtual) return;
    var saindo = cenaAtual && cenaSvg(cenaAtual);
    if (saindo) {
      saindo.classList.remove('is-ativa');
      var tlSai = saindo._tl;
      saindo._tl = null;
      saindo._saindo = tlSai;
      setTimeout(function () { if (saindo._saindo === tlSai && tlSai) { tlSai.kill(); saindo._saindo = null; } }, 450);
    }
    cenaAtual = id;
    if (!id) return;
    var item = menu.querySelector('.menu__lista li[data-cena="' + id + '"]'), entra = cenaSvg(id);
    trocarLegenda(id, item.getAttribute('data-legenda'), imediato);
    /* voltou antes de sumir: segue viva de onde estava */
    if (entra._saindo) { entra._tl = entra._saindo; entra._saindo = null; }
    else if (animarMenu() && palcoVisivel()) { entra._tl = gsap.timeline(); CENAS[id](entra, entra._tl); }
    entra.classList.add('is-ativa');
  }
  function decidirCena(imediato) {
    if (!aberto) return;
    var escolhida = hoverCena || focoCena;
    /* a faixa dourada marca só o item apontado (mouse ou teclado), não a seção padrão */
    itensMenu.forEach(function (li) { li.classList.toggle('is-cena', li.getAttribute('data-cena') === escolhida); });
    trocarCena(escolhida || cenaPadrao, imediato);
  }
  /* a seção que está na tela: a última cujo topo já passou do meio da tela */
  function secaoNaTela() {
    var ids = ['1', '2', '3', '4', '5'], alvos = ['inicio', 'servicos', 'como-funciona', 'sobre', 'contato'], atual = '1';
    alvos.forEach(function (a, i) { var s = document.getElementById(a); if (s && s.getBoundingClientRect().top < innerHeight / 2) atual = ids[i]; });
    return atual;
  }
  var listaMenu = menu.querySelector('.menu__lista');
  listaMenu.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse') return;
    var li = e.target.closest('li[data-cena]');
    if (li) { hoverCena = li.getAttribute('data-cena'); decidirCena(); }
  });
  listaMenu.addEventListener('pointerleave', function () { hoverCena = null; decidirCena(); });
  listaMenu.addEventListener('focusin', function (e) {
    var li = e.target.closest('li[data-cena]');
    focoCena = li && e.target.matches(':focus-visible') ? li.getAttribute('data-cena') : null;
    decidirCena();
  });
  listaMenu.addEventListener('focusout', function (e) {
    if (!listaMenu.contains(e.relatedTarget)) { focoCena = null; decidirCena(); }
  });

  /* ---------- âncoras: Lenis (ou rolagem nativa) até o destino, com foco no destino ---------- */
  function irPara(alvo, hash) {
    function focar() {
      if (!alvo.matches('a, button, input, select, textarea, [tabindex]')) alvo.setAttribute('tabindex', '-1');
      alvo.focus({ preventScroll: true });
    }
    if (lenis) lenis.scrollTo(alvo, { offset: -alturaTopo(), duration: 1.2, onComplete: focar });
    else { alvo.scrollIntoView({ behavior: reduzido() ? 'auto' : 'smooth', block: 'start' }); focar(); }
    if (history.pushState && location.hash !== hash) history.pushState(null, '', hash);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var hash = a.getAttribute('href'), alvo = hash.length > 1 && document.getElementById(hash.slice(1));
    if (!alvo) return;
    e.preventDefault();
    abrirMenu(false);
    irPara(alvo, hash);
  });

  /* ---------- 01 · Lenis (com o ticker do GSAP quando ele existe) ---------- */
  function tickLenis(t) { if (lenis) lenis.raf(t * 1000); }
  function ligarLenis() {
    if (lenis || reduzido() || !window.Lenis) return;
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    if (gsapOk) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(tickLenis);
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function quadro(t) { if (!lenis) return; lenis.raf(t); requestAnimationFrame(quadro); });
    }
    lenis.on('scroll', function (e) { solo.velocidade(e.velocity); });
    if (menuAberto()) lenis.stop();
  }
  function desligarLenis() {
    if (!lenis) return;
    if (gsapOk) gsap.ticker.remove(tickLenis);
    lenis.destroy();
    lenis = null;
  }

  /* ---------- 02 e 04 abaixo da dobra: armados aqui, revelados ao entrar (ScrollTrigger, ou IO sem GSAP) ---------- */
  var armados = [];
  function aoEntrar(el, fn) {
    if (gsapOk) { ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: fn }); return; }
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); fn(); }
    }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(el);
  }
  function armarReveals() {
    if (reduzido()) return;
    var alvos = lista('[data-split]:not([data-split="hero"]), [data-revelar]');
    var abaixo = alvos.filter(function (el) { return el.getBoundingClientRect().top > innerHeight * 0.92; });
    abaixo.forEach(function (el) {
      el.classList.add('is-armado');
      armados.push(el);
      lista('[data-valor]', el).forEach(function (n) { n.textContent = formatar(0, n); });
      aoEntrar(el, function () { revelar(el); });
    });
  }
  /* revela uma vez só, venha do ScrollTrigger ou da parada da rolagem; os números contam junto */
  function revelar(el) {
    if (el.classList.contains('is-dentro')) return;
    el.classList.add('is-dentro');
    lista('[data-valor]', el).forEach(function (n) { contar(n, 1500); });
  }
  function revelarTudo() { armados.forEach(revelar); }

  /* ---------- números das fichas: contam de 0 até o valor (o HTML já traz o valor final, para sem JS) ---------- */
  function formatar(v, el) {
    var casas = +(el.getAttribute('data-casas') || 0);
    return v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }
  function contar(el, ms) {
    var alvo = +el.getAttribute('data-valor'), t0 = 0;
    if (reduzido()) { el.textContent = formatar(alvo, el); return; }
    requestAnimationFrame(function quadro(t) {
      if (!t0) t0 = t + 700;                        /* espera a ficha subir */
      var q = limitar((t - t0) / ms), e = 1 - Math.pow(1 - q, 4);
      el.textContent = formatar(alvo * e, el);
      if (q < 1) requestAnimationFrame(quadro);
    });
  }
  /* se a rolagem parar com algo armado à vista (na faixa de baixo da tela), revela ~220 ms depois */
  var tParada = 0;
  addEventListener('scroll', function () {
    clearTimeout(tParada);
    tParada = setTimeout(function () {
      var vistos = armados.filter(function (el) {
        if (el.classList.contains('is-dentro')) return false;
        var r = el.getBoundingClientRect();
        return r.top < innerHeight && r.bottom > 0;
      });
      vistos.forEach(revelar);
    }, 220);
  }, { passive: true });

  /* ---------- assinatura · raízes desenhadas pela rolagem ----------
     Um progresso p (0–1) da rolagem pela seção. No diagrama largo, cada traço tem sua faixa de p
     (haste, depois raiz 1, 2 e 3: Sentir → Analisar → Agir) e cada anel acende quando a sua raiz chega.
     No celular, um traço vertical cresce e acende o anel de cada etapa. Histerese de 0,03 nos anéis:
     ao voltar, eles apagam uma vez, sem piscar no limite. */
  var TRECHOS = [[0, 0.14], [0.14, 0.42], [0.42, 0.68], [0.68, 0.94]];
  var raizes = { estado: function () { return null; } };
  function iniciarRaizes() {
    var caixa = document.querySelector('[data-raizes]');
    if (!caixa) return;
    var svg = caixa.querySelector('.raizes__svg');
    var tracos = lista('.raizes__traco path', caixa), luzes = lista('.anel-luz', caixa), etapas = lista('.etapa', caixa);
    var trilho = caixa.querySelector('.raizes__trilho'), trilhoTraco = trilho.querySelector('i');
    var aceso = [false, false, false], limiteMovel = [1, 1, 1], st = null, largo = true, ultimoP = 0;

    function acender(i, sim) {
      if (aceso[i] === sim) return;
      aceso[i] = sim;
      luzes[i].classList.toggle('is-aceso', sim);
      etapas[i].classList.toggle('is-aceso', sim);
    }
    function desenhar(p) {
      ultimoP = p;
      if (largo) {
        tracos.forEach(function (t, i) {
          var q = limitar((p - TRECHOS[i][0]) / (TRECHOS[i][1] - TRECHOS[i][0]));
          t.style.strokeDashoffset = ((1 - q) * 1.05).toFixed(4);
        });
      } else {
        trilhoTraco.style.transform = 'scaleY(' + limitar(p / 0.94).toFixed(4) + ')';
      }
      for (var i = 0; i < 3; i++) {
        var lim = largo ? TRECHOS[i + 1][1] : limiteMovel[i];
        if (p >= lim) acender(i, true);
        else if (p < lim - 0.03) acender(i, false);
      }
    }
    /* celular: altura do traço até o centro do último anel e o p em que ele alcança cada anel */
    function medir() {
      if (largo) return;
      var base = caixa.getBoundingClientRect().top;
      var centros = etapas.map(function (e) {
        var r = e.querySelector('.etapa__anel').getBoundingClientRect();
        return { c: r.top + r.height / 2 - base, raio: r.height / 2 };
      });
      var h = centros[2].c;
      trilho.style.height = h.toFixed(1) + 'px';
      limiteMovel = centros.map(function (o) { return limitar((o.c - o.raio) / h) * 0.94; });
    }
    function estadoFinal() {
      caixa.classList.remove('is-armado');
      tracos.forEach(function (t) { t.style.strokeDashoffset = ''; });
      trilhoTraco.style.transform = '';
      for (var i = 0; i < 3; i++) acender(i, true);
    }
    function montar() {
      if (st) { st.kill(); st = null; }
      largo = mqLargo.matches;
      medir();
      if (reduzido() || !gsapOk) { estadoFinal(); return; }
      caixa.classList.add('is-armado');
      tracos.forEach(function (t) { t.style.strokeDashoffset = ''; });
      trilhoTraco.style.transform = '';
      st = ScrollTrigger.create({
        trigger: largo ? svg : caixa,
        start: 'top 78%',
        end: largo ? 'bottom 40%' : 'bottom 60%',
        onUpdate: function (s) { desenhar(s.progress); },
        onRefresh: function (s) { desenhar(s.progress); }
      });
      desenhar(st.progress);
    }
    if (gsapOk) ScrollTrigger.addEventListener('refreshInit', medir);
    else addEventListener('resize', medir);
    mqLargo.addEventListener('change', montar);
    raizes.montar = montar;
    raizes.estado = function () { return { p: ultimoP, aceso: aceso.slice(), largo: largo, armado: caixa.classList.contains('is-armado') }; };
    montar();
  }

  /* ---------- solo: curvas de nível em carrossel (substituem o marquee 06) ----------
     Cada .solo recebe N curvas periódicas (período de 1440 unidades, desenhadas em duas voltas num SVG de 200 %
     da largura da caixa) e dá a volta sem emenda (o deslocamento é tomado módulo a largura da caixa).
     Parada, cada curva deriva na sua velocidade (as de trás, mais claras e mais lentas, como as camadas de um
     relevo). Rolando, as curvas são arrastadas junto com a página, ganham um impulso de até 10× que decai,
     invertem o sentido quando a rolagem volta e o relevo "levanta" (scaleY) e assenta.
     data-velocidade multiplica a velocidade da caixa. Só roda com a caixa à vista, aba visível e sem
     movimento reduzido.
     v0.6.3, as linhas do fim (data-abre): o relevo nasce achatado e afundado e abre (scaleY de 0,15 a 1, as da
     frente subindo mais) conforme a página chega ao fim; data-inchaco multiplica o "levantar" da rolagem
     rápida; com mouse, as curvas acompanham o ponteiro em profundidade (as da frente andam mais). */
  var solos = [];
  function semente(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  /* Catmull-Rom sobre y(x) amostrado de x0 a x1 (padrão: duas voltas de 1440, com um passo de folga em cada ponta) */
  function curvaPeriodica(y, x0, x1, passo) {
    var pts = [], d = '', i, x;
    x0 = x0 === undefined ? -24 : x0; x1 = x1 === undefined ? 2904 : x1; passo = passo || 24;
    for (x = x0; x <= x1; x += passo) pts.push([x, y(x)]);
    for (i = 1; i < pts.length - 2; i++) {
      var p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2];
      if (i === 1) d = 'M' + p1[0] + ' ' + p1[1].toFixed(2);
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(2) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(2) + ' ' + p2[0] + ' ' + p2[1].toFixed(2);
    }
    return d;
  }
  function montarSolo(caixa) {
    var n = +caixa.getAttribute('data-solo') || 4, rnd = semente(+caixa.getAttribute('data-semente') || 1);
    var comTrigo = caixa.hasAttribute('data-trigo'), f0 = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], NS = 'http://www.w3.org/2000/svg', linhas = [];
    var abre = caixa.hasAttribute('data-abre');
    for (var i = 0; i < n; i++) {
      var k = n > 1 ? i / (n - 1) : 1;
      var base = 48 + (i - (n - 1) / 2) * (80 / n), amp = 17 * (0.8 + 0.4 * k);
      var fases = [f0[0] + i * 0.12, f0[1] + i * 0.26, f0[2] + i * 0.38];
      var svg = document.createElementNS(NS, 'svg'), path = document.createElementNS(NS, 'path');
      svg.setAttribute('class', 'solo__linha' + (comTrigo && i === n - 2 ? ' is-trigo' : ''));
      svg.setAttribute('viewBox', '0 0 2880 100');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('focusable', 'false');
      svg.style.setProperty('--o', (0.2 + 0.3 * k).toFixed(3));
      svg.style.setProperty('--e', (1.3 + 0.6 * k).toFixed(2));
      path.setAttribute('d', curvaPeriodica((function (b, a, f) {
        return function (x) {
          var t = x / 1440 * Math.PI * 2;
          return b + a * (0.58 * Math.sin(t + f[0]) + 0.28 * Math.sin(2 * t + f[1]) + 0.14 * Math.sin(3 * t + f[2]));
        };
      })(base, amp, fases)));
      svg.appendChild(path);
      caixa.appendChild(svg);
      /* cada curva tem a sua velocidade (as de trás, mais claras, andam menos: profundidade) */
      var mult = +caixa.getAttribute('data-velocidade') || 1;
      /* v0.6.0: mais calmas (eram 34–90 px/s, 0,45–1,3 px/px e impulso de 10×): andam e respondem à rolagem
         sem disputar a leitura */
      linhas.push({
        el: svg, x: 0, onda: 0, k: k,
        sobe: abre ? 24 + 56 * k : 0,     /* px que a curva sobe ao abrir: as da frente sobem mais */
        base: (20 + 34 * k) * mult,       /* px/s parada: 20 a 54 px/s */
        arrasto: (0.25 + 0.45 * k) * mult, /* px de deslocamento por px rolado */
        inchaco: 0.55 + 0.45 * k          /* quanto a curva incha com a rolagem rápida */
      });
    }
    return {
      caixa: caixa, linhas: linhas, larg: caixa.clientWidth || 1, visivel: false,
      abre: abre, inchaco: +caixa.getAttribute('data-inchaco') || 1, topoAbs: 0, alt: 0, maxY: 0,
      px: 0, py: 0, alvoPx: 0, alvoPy: 0
    };
  }
  function iniciarSolo() {
    solos = lista('[data-solo]').map(montarSolo);
    var raf = 0, ultimo = 0, vel = 1, alvo = 1, dir = 1, sentido = 1, yQuadro = window.scrollY || 0, onda = 0;
    function algumVisivel() { return solos.some(function (s) { return s.visivel; }); }
    function voltaDe(x, larg) { return -(((-x) % larg) + larg) % larg; }
    /* linhas do fim: onde a caixa está na página (sem ler o layout a cada quadro) */
    function medirAbertura(s) {
      if (!s.abre) return;
      var r = s.caixa.getBoundingClientRect();
      s.topoAbs = r.top + (window.scrollY || 0);
      s.alt = r.height;
      s.maxY = document.documentElement.scrollHeight - innerHeight;
    }
    /* 0 com a caixa entrando por baixo da tela; 1 com o meio dela no meio da tela (ou no fim da página) */
    function abertura(s, y) {
      var ini = s.topoAbs - innerHeight, fim = Math.min(s.maxY, s.topoAbs + s.alt / 2 - innerHeight / 2);
      if (fim <= ini + 1) return 1;
      var p = limitar((y - ini) / (fim - ini));
      return 1 - Math.pow(1 - p, 3);
    }
    function rodando() { return !reduzido() && !document.hidden && !menuAberto() && algumVisivel(); }
    /* a cada quadro: deriva (px/s × impulso) + arrasto direto da rolagem (px rolados × fator da curva).
       A rolagem rápida também "levanta" o relevo: as curvas crescem em altura (scaleY) e assentam com mola. */
    function quadro(t) {
      raf = 0;
      var dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 0;
      ultimo = t;
      var y = window.scrollY || window.pageYOffset, dy = y - yQuadro;
      yQuadro = y;
      if (Math.abs(dy) > 0.5) dir = dy < 0 ? -1 : 1;
      /* o sentido vira devagar (antes trocava de um quadro para o outro e as curvas davam um tranco) */
      sentido += (dir - sentido) * (1 - Math.exp(-dt * 4));
      alvo += (1 - alvo) * 0.035;            /* o impulso da rolagem decai */
      vel += (alvo - vel) * 0.1;
      onda += (Math.min(Math.abs(dy) / 60, 0.3) - onda) * (Math.abs(dy) > 0.5 ? 0.15 : 0.05);
      solos.forEach(function (s) {
        if (!s.visivel) return;
        var e = s.abre ? abertura(s, y) : 1;
        s.px += (s.alvoPx - s.px) * (1 - Math.exp(-dt * 3));
        s.py += (s.alvoPy - s.py) * (1 - Math.exp(-dt * 3));
        s.linhas.forEach(function (l) {
          l.x -= l.base * vel * sentido * dt + dy * l.arrasto;
          l.x = voltaDe(l.x, s.larg);
          var tx = s.abre ? voltaDe(l.x + s.px * (l.k - 0.35) * 70, s.larg) : l.x;
          var ty = s.abre ? (1 - e) * l.sobe + s.py * (0.3 + l.k) * 12 : 0;
          var sy = (s.abre ? 0.15 + 0.85 * e : 1) * (1 + onda * l.inchaco * s.inchaco);
          l.el.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0) scaleY(' + sy.toFixed(3) + ')';
        });
      });
      if (rodando()) raf = requestAnimationFrame(quadro);
    }
    function atualizar() {
      if (rodando()) { if (!raf) { ultimo = 0; yQuadro = window.scrollY || 0; raf = requestAnimationFrame(quadro); } }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (reduzido()) {
        solos.forEach(function (s) { s.linhas.forEach(function (l) { l.el.style.transform = ''; l.x = 0; }); });
      }
    }
    /* impulso pela velocidade da rolagem (Lenis, ou a rolagem nativa sem ele): até 3,5× a deriva */
    solo.velocidade = function (v) {
      if (Math.abs(v) < 0.5) return;
      alvo = 1 + Math.min(Math.abs(v) * 0.3, 2.5);
    };
    solo.estado = function () { return { rodando: rodando(), vel: vel, dir: dir, onda: onda, x: solos.map(function (s) { return s.linhas.map(function (l) { return +l.x.toFixed(1); }); }) }; };
    var yAntes = window.scrollY;
    addEventListener('scroll', function () {
      var y = window.scrollY;
      if (!lenis) solo.velocidade((y - yAntes) / 4);
      yAntes = y;
    }, { passive: true });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        solos.forEach(function (s) {
          if (s.caixa !== e.target) return;
          s.visivel = e.isIntersecting;
          if (s.visivel) medirAbertura(s);
        });
      });
      atualizar();
    }, { rootMargin: '80px 0px' });
    solos.forEach(function (s) { io.observe(s.caixa); });
    addEventListener('resize', function () { solos.forEach(function (s) { s.larg = s.caixa.clientWidth || 1; medirAbertura(s); }); });
    addEventListener('load', function () { solos.forEach(medirAbertura); });
    /* com mouse, as linhas do fim seguem o ponteiro por toda a seção, em profundidade */
    if (mqFino.matches) solos.forEach(function (s) {
      if (!s.abre) return;
      var area = s.caixa.closest('section') || s.caixa.parentElement;
      area.addEventListener('pointermove', function (e) {
        var r = area.getBoundingClientRect();
        s.alvoPx = limitar(e.clientX / innerWidth) * 2 - 1;
        s.alvoPy = limitar((e.clientY - r.top) / r.height) * 2 - 1;
      });
      area.addEventListener('pointerleave', function () { s.alvoPx = 0; s.alvoPy = 0; });
    });
    document.addEventListener('visibilitychange', atualizar);
    solo.atualizar = atualizar;
    atualizar();
  }
  var solo = { atualizar: function () {}, velocidade: function () {}, estado: function () { return null; } };

  /* ---------- desenho em linha no fundo dos serviços (v0.6.3) ----------
     Um traço só, como um sulco de plantio, desce pelo corredor entre a foto e o texto de cada serviço, cruza de um
     lado para o outro no vão até o próximo e termina num anel sobre a nota do fim. A ponta (um ponto Trigo) vai perto
     da altura de 62 % da tela (nas travessias, um pouco à frente e depois um pouco atrás): o traço se desenha com a rolagem e, ao passar por cada título, acende um anel da marca.
     Atrás, "morros" de curvas de nível (anéis irregulares, um deles Trigo) ocupam o vão do lado do texto, se
     desenham ao entrar e andam devagar com a rolagem (paralaxe; cada morro é um <svg> próprio e só muda o
     transform). Tudo sai do layout real (offsets, sem as transformações dos reveals) e é refeito quando a seção
     muda de tamanho. Abaixo de 820 px, só os morros, nos vãos entre os serviços. Movimento reduzido: o traço
     inteiro, os anéis acesos e sem paralaxe. */
  var trilha = { estado: function () { return null; } };
  function iniciarTrilha() {
    var caixa = document.querySelector('[data-trilha]');
    if (!caixa) return;
    var secao = caixa.parentElement, servicos = lista('.servico', secao);
    var topo = secao.querySelector('.servicos__topo'), nota = secao.querySelector('.servicos__nota');
    var NS = 'http://www.w3.org/2000/svg', mqServ = matchMedia('(min-width: 820px)');
    var traco = null, ponta = null, nos = [], morros = [], pts = [], acum = [], total = 0, cruzes = [];
    var topoAbs = 0, raf = 0, visivel = false, ultimoLen = -1, montarPedido = 0, ioMorros = null;
    function criar(nome, attrs, pai) {
      var e = document.createElementNS(NS, nome);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (pai) pai.appendChild(e);
      return e;
    }
    /* caixa no layout (sem transform), relativa à seção */
    function caixaDe(el) {
      var x = 0, y = 0, e = el;
      while (e && e !== secao) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
      return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight, r: x + el.offsetWidth, b: y + el.offsetHeight };
    }
    /* Catmull-Rom fechada (os anéis dos morros) */
    function fechada(p) {
      var n = p.length, d = 'M' + p[0][0].toFixed(1) + ' ' + p[0][1].toFixed(1);
      for (var i = 0; i < n; i++) {
        var p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
        d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
          (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' +
          p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
      }
      return d + 'Z';
    }
    /* um morro: 6 anéis do pé ao topo, o topo fora do centro, cada anel com a sua deformação */
    function morro(cx, cy, R, sem) {
      var rnd = semente(sem), f = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], ang = rnd() * 6.28, N = 6;
      var w = Math.ceil(R * 2.9), h = Math.ceil(R * 2.3);
      var s = criar('svg', { class: 'trilha__morro', viewBox: '0 0 ' + w + ' ' + h, width: w, height: h, focusable: 'false' });
      s.style.left = (cx - w / 2).toFixed(1) + 'px';
      s.style.top = (cy - h / 2).toFixed(1) + 'px';
      for (var j = 0; j < N; j++) {
        var q = j / (N - 1), r = R * (1 - 0.8 * q), ox = w / 2 + Math.cos(ang) * R * 0.24 * q, oy = h / 2 + Math.sin(ang) * R * 0.18 * q, p = [];
        for (var a = 0; a < 40; a++) {
          var t = a / 40 * Math.PI * 2;
          var k = 1 + 0.09 * Math.sin(t + f[0] + j * 0.2) + 0.06 * Math.sin(2 * t + f[1] - j * 0.15) + 0.035 * Math.sin(3 * t + f[2] + j * 0.3);
          p.push([ox + 1.25 * r * k * Math.cos(t), oy + 0.92 * r * k * Math.sin(t)]);
        }
        var c = criar('path', { d: fechada(p), pathLength: '1' }, s);
        if (j === 2) c.setAttribute('class', 'is-trigo');
        c.style.setProperty('--j', N - 1 - j);              /* desenha do topo para o pé */
        c.style.setProperty('--o', (0.11 + 0.1 * q).toFixed(3));
      }
      caixa.insertBefore(s, caixa.firstChild);     /* atrás do traço */
      return { el: s, cy: cy };
    }
    /* o traço, ponto a ponto (polilinha densa: o comprimento de cada trecho é exato e a ponta cai em cima dele) */
    function montarTraco(W, H) {
      var P = [], passo = 12;
      var faixas = servicos.map(function (s, i) {
        var m = caixaDe(s.querySelector('.servico__midia')), t = caixaDe(s.querySelector('.servico__texto'));
        var f = s.querySelector('.ficha--servico'), fb = f ? caixaDe(f) : m, h3 = caixaDe(s.querySelector('h3'));
        var dir = t.x > m.x, vao = dir ? t.x - m.r : m.x - t.r;
        return { gx: dir ? t.x - vao * 0.32 : t.r + vao * 0.32, topo: Math.min(m.y, t.y), base: Math.max(m.b, fb.b, t.b), no: h3.y + h3.h / 2, fase: i * 1.7, caixas: [m, fb, t] };
      });
      function corre(gx, ya, yb, fase) {
        for (var y = ya; y < yb; y += passo) P.push([gx + 7 * Math.sin(Math.PI * (y - ya) / (yb - ya)) * Math.sin(y / 80 + fase), y]);
      }
      /* pesos de Bernstein da cúbica em u: ponto (d = 0), primeira (d = 1) e segunda derivada (d = 2) */
      function pesos(u, d) {
        var v = 1 - u;
        return d === 2 ? [6 * v, 6 * (3 * u - 2), 6 * (1 - 3 * u), 6 * u]
          : d === 1 ? [-3 * v * v, 3 * v * (v - 2 * u), 3 * u * (2 * v - u), 3 * u * u]
          : [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u];
      }
      function aplicar(p, w) {
        return [w[0] * p[0][0] + w[1] * p[1][0] + w[2] * p[2][0] + w[3] * p[3][0], w[0] * p[0][1] + w[1] * p[1][1] + w[2] * p[2][1] + w[3] * p[3][1]];
      }
      var amostras = [];
      for (var j = 1; j < 28; j++) amostras.push([pesos(j / 28, 0), pesos(j / 28, 1), pesos(j / 28, 2)]);
      /* a travessia de um corredor ao outro. O vão entre dois serviços é baixo (a ficha de um em cima, a foto do outro
         embaixo): só nele a curva tinha uns 60 px de altura para 345 de largura, com as duas dobras quase em ângulo reto.
         Ela agora pode começar mais cedo e chegar mais tarde dentro dos corredores e escolhe, entre esses começos,
         chegadas e alças, a de dobras mais abertas (menor curvatura máxima) que passa a 14 px de tudo. Sai sempre na
         vertical; chega na vertical no corredor seguinte ou, no fim (deitada), na horizontal até o anel. As alças
         somam menos que a altura, então a curva só desce (y monotônico) */
      function travessia(xa, ya0, yaMin, xb, yb0, ybMax, caixas, deitada) {
        var melhor = null, eaMax = Math.min(180, Math.max(0, ya0 - yaMin)), ebMax = Math.min(180, Math.max(0, ybMax - yb0));
        for (var ea = 0; ea <= eaMax; ea += 20) for (var eb = 0; eb <= ebMax; eb += 20) for (var ka = 0.15; ka < 0.7; ka += 0.1) for (var kb = 0.15; kb < 0.7; kb += 0.1) {
          if (!deitada && ka + kb > 0.9) continue;
          var ya = ya0 - ea, yb = yb0 + eb, dy = yb - ya, toques = 0, kmax = 0;
          var c = { ya: ya, yb: yb, p: [[xa, ya], [xa, ya + ka * dy], deitada ? [xb - kb * (xb - xa), yb] : [xb, yb - kb * dy], [xb, yb]] };
          for (var j = 0; j < amostras.length; j++) {
            var p = aplicar(c.p, amostras[j][0]), d1 = aplicar(c.p, amostras[j][1]), d2 = aplicar(c.p, amostras[j][2]);
            for (var q = 0; q < caixas.length; q++) {
              var b = caixas[q];
              if (p[0] > b.x - 14 && p[0] < b.r + 14 && p[1] > b.y - 14 && p[1] < b.b + 14) toques++;
            }
            kmax = Math.max(kmax, Math.abs(d1[0] * d2[1] - d1[1] * d2[0]) / Math.pow(d1[0] * d1[0] + d1[1] * d1[1], 1.5));
            if (melhor && (toques > melhor.toques || (!melhor.toques && kmax >= melhor.kmax))) break;   /* já perdeu */
          }
          if (!melhor || toques < melhor.toques || (toques === melhor.toques && kmax < melhor.kmax)) { c.toques = toques; c.kmax = kmax; melhor = c; }
        }
        return melhor;
      }
      function cruza(c) {
        var n = Math.max(16, Math.ceil(1.5 * Math.hypot(c.p[3][0] - c.p[0][0], c.yb - c.ya) / passo));
        for (var k = 0; k <= n; k++) P.push(aplicar(c.p, pesos(k / n, 0)));
      }
      var y0 = caixaDe(topo).b + 18, fim = caixaDe(nota);
      cruzes = faixas.map(function (fx, i) {
        var prox = faixas[i + 1];
        return prox ? travessia(fx.gx, fx.base + 12, fx.no + 40, prox.gx, prox.topo - 12, prox.no - 40, fx.caixas.concat(prox.caixas))
          : travessia(fx.gx, fx.base + 12, fx.no + 40, W / 2, fim.y - 30, fim.y - 30, fx.caixas.concat([fim]), true);
      });
      faixas.forEach(function (fx, i) {
        corre(fx.gx, i ? cruzes[i - 1].yb : y0, cruzes[i].ya, fx.fase);
        cruza(cruzes[i]);
      });
      pts = P; acum = [0]; total = 0;
      for (var i = 1; i < P.length; i++) { total += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); acum.push(total); }
      suavizar();

      var svg = criar('svg', { class: 'trilha__svg', width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, focusable: 'false' });
      traco = criar('path', { class: 'trilha__traco', pathLength: '1', d: 'M' + P.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') }, svg);
      criar('circle', { class: 'trilha__semente', cx: P[0][0].toFixed(1), cy: P[0][1].toFixed(1), r: 3 }, svg);
      /* um anel na altura de cada título e o último, maior, no fim */
      nos = faixas.map(function (fx) { return fx.no; }).concat([P[P.length - 1][1]]).map(function (y, i, arr) {
        var a = medida(y), g = criar('g', { class: 'trilha__no' + (i === arr.length - 1 ? ' trilha__no--fim' : '') }, svg);
        var r = i === arr.length - 1 ? 9 : 7;
        criar('circle', { class: 'trilha__onda', cx: a.x.toFixed(1), cy: a.y.toFixed(1), r: r }, g);
        criar('circle', { class: 'trilha__anel', cx: a.x.toFixed(1), cy: a.y.toFixed(1), r: r }, g);
        return { el: g, len: a.len, aceso: false };
      });
      caixa.appendChild(svg);
      ponta = document.createElement('i');
      ponta.className = 'trilha__ponta';
      caixa.appendChild(ponta);
    }
    /* ponto e comprimento do traço na altura y (o traço só desce, então uma busca binária basta) */
    function medida(y) {
      if (!pts.length) return { x: 0, y: 0, len: 0 };
      if (y <= pts[0][1]) return { x: pts[0][0], y: pts[0][1], len: 0 };
      var n = pts.length - 1;
      if (y >= pts[n][1]) return { x: pts[n][0], y: pts[n][1], len: total };
      var lo = 0, hi = n;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (pts[mid][1] < y) lo = mid; else hi = mid; }
      var a = pts[lo], b = pts[hi], u = (y - a[1]) / ((b[1] - a[1]) || 1);
      return { x: a[0] + (b[0] - a[0]) * u, y: y, len: acum[lo] + (acum[hi] - acum[lo]) * u };
    }
    /* quanto do traço está desenhado com a linha de 62 % na altura y. Medido direto (medida(y).len), as travessias
       andavam muito mais do que a rolagem: até 11 px de traço por pixel rolado, a ponta atravessava num estalo. O
       comprimento por altura passa por duas médias móveis de ±SUAVE px (núcleo triangular): a ponta começa a
       travessia um pouco antes, cruza no máximo a ~2× a rolagem e alcança a linha de 62 % logo depois, sem tranco */
    var SUAVE = 140, PASSO_G = 4, grade = [], g0 = 0;
    function media(a, m) {
      var n = a.length, s = [0], out = [];
      for (var i = 0; i < n; i++) s.push(s[i] + a[i]);
      for (i = 0; i < n; i++) { var lo = Math.max(0, i - m), hi = Math.min(n - 1, i + m); out.push((s[hi + 1] - s[lo]) / (hi - lo + 1)); }
      return out;
    }
    function suavizar() {
      g0 = pts[0][1] - 2 * SUAVE;
      var n = Math.ceil((pts[pts.length - 1][1] + 2 * SUAVE - g0) / PASSO_G) + 1, a = [], m = Math.round(SUAVE / PASSO_G);
      for (var k = 0; k < n; k++) a.push(medida(g0 + k * PASSO_G).len);
      grade = media(media(a, m), m);
    }
    function comprimento(y) {
      var k = (y - g0) / PASSO_G, n = grade.length - 1;
      if (k <= 0) return grade[0];
      if (k >= n) return grade[n];
      var i = Math.floor(k);
      return grade[i] + (grade[i + 1] - grade[i]) * (k - i);
    }
    /* o ponto do traço a um comprimento dado */
    function ponto(len) {
      var lo = 0, hi = acum.length - 1;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (acum[mid] < len) lo = mid; else hi = mid; }
      var a = pts[lo], b = pts[hi], u = Math.min(1, Math.max(0, (len - acum[lo]) / ((acum[hi] - acum[lo]) || 1)));
      return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u };
    }
    function montar() {
      montarPedido = 0;
      caixa.textContent = '';
      traco = null; ponta = null; nos = []; morros = []; ultimoLen = -1;
      if (ioMorros) ioMorros.disconnect();
      var W = secao.offsetWidth, H = secao.offsetHeight, largo = mqServ.matches;
      topoAbs = secao.getBoundingClientRect().top + (window.scrollY || 0);
      if (largo) montarTraco(W, H);
      /* os morros: no vão do lado do texto (telas largas) ou entre os serviços (celular) */
      servicos.forEach(function (s, i) {
        var t = caixaDe(s.querySelector('.servico__texto')), prox = servicos[i + 1], R, cx, cy;
        if (largo) {
          R = Math.min(t.w * 0.5, 175);
          cx = t.x + t.w * (t.x > W / 2 ? 0.66 : 0.34);
          cy = t.b + 14 + R * 0.92;
        } else {
          if (!prox) return;
          var b = caixaDe(s), c = caixaDe(prox);
          R = Math.min(W * 0.28, 110);
          cx = W * (i % 2 ? -0.02 : 1.02);     /* quase todo fora da tela: só a borda do morro, longe do texto */
          cy = (b.b + c.y) / 2;
        }
        morros.push(morro(cx, cy, R, 11 + i * 7));
      });
      if (reduzido() || !('IntersectionObserver' in window)) morros.forEach(function (m) { m.el.classList.add('is-dentro'); });
      else {
        ioMorros = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-dentro'); ioMorros.unobserve(e.target); } });
        }, { rootMargin: '0px 0px -10% 0px' });
        morros.forEach(function (m) { ioMorros.observe(m.el); });
      }
      desenhar();
    }
    function desenhar() {
      raf = 0;
      var y = window.scrollY || 0, rm = reduzido();
      if (traco) {
        var len = rm ? total : comprimento(y + innerHeight * 0.62 - topoAbs);
        if (Math.abs(len - ultimoLen) > 0.5) {
          ultimoLen = len;
          traco.style.strokeDashoffset = (1 - len / (total || 1)).toFixed(5);
          var viva = !rm && len > 0.5 && len < total - 0.5;
          ponta.classList.toggle('is-viva', viva);
          if (viva) { var a = ponto(len); ponta.style.transform = 'translate3d(' + a.x.toFixed(1) + 'px,' + a.y.toFixed(1) + 'px,0)'; }
          nos.forEach(function (n) {
            var sim = len >= n.len - 1 ? true : len < n.len - 6 ? false : n.aceso;   /* histerese: não pisca no limite */
            if (sim !== n.aceso) { n.aceso = sim; n.el.classList.toggle('is-aceso', sim); }
          });
        }
      }
      var meio = y + innerHeight / 2 - topoAbs;
      morros.forEach(function (m) { m.el.style.transform = rm ? '' : 'translate3d(0,' + ((m.cy - meio) * -0.07).toFixed(1) + 'px,0)'; });
    }
    function pedir() { if (!raf && visivel) raf = requestAnimationFrame(desenhar); }
    function pedirMontar() { if (!montarPedido) montarPedido = requestAnimationFrame(montar); }
    addEventListener('scroll', pedir, { passive: true });
    new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; pedir(); }, { rootMargin: '200px 0px' }).observe(secao);
    /* layout que muda (fontes, largura, quebra de linha): refaz tudo, uma vez por quadro */
    if ('ResizeObserver' in window) new ResizeObserver(pedirMontar).observe(secao);
    else addEventListener('resize', pedirMontar);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(pedirMontar);
    addEventListener('load', pedirMontar);
    trilha.montar = pedirMontar;
    trilha.estado = function () {
      var vel = 0;
      for (var k = 1; k < grade.length; k++) vel = Math.max(vel, (grade[k] - grade[k - 1]) / PASSO_G);
      return { pontos: pts.length, total: Math.round(total), desenhado: Math.round(ultimoLen), nos: nos.map(function (n) { return n.aceso; }), morros: morros.length,
        velMax: +vel.toFixed(2), travessias: cruzes.map(function (c) { return { altura: Math.round(c.yb - c.ya), raioMin: Math.round(1 / c.kmax), toques: c.toques }; }) };
    };
    montar();
  }

  /* ---------- 07 · magnético (só ponteiro fino) + press com mola no CTA final ---------- */
  function iniciarMagnetico() {
    if (!gsapOk || !mqFino.matches) return;
    lista('.magnetico').forEach(function (btn) {
      var rotulo = btn.querySelector('.btn__rotulo');
      btn.addEventListener('mousemove', function (e) {
        if (reduzido()) return;
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        gsap.to(btn, { x: dx * 0.25, y: dy * 0.25, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        gsap.to(rotulo, { x: dx * 0.1, y: dy * 0.1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      });
      /* volta ao lugar sem quicar (era um elástico) */
      btn.addEventListener('mouseleave', function () {
        gsap.to([btn, rotulo], { x: 0, y: 0, duration: 0.8, ease: 'power3.out', overwrite: 'auto' });
      });
    });
  }
  /* ---------- fotos que ganham vida (v0.6.2): cinemagraphs do Higgsfield, ~0,35–0,5 MB cada ----------
     Com mouse: o vídeo pré-carrega quando o serviço chega perto da tela, toca no hover da linha inteira e só
     aparece (cruzamento sobre a foto, no CSS) quando já está tocando; ao sair, some e pausa. No toque: toca
     enquanto a foto está bem à vista. Nada carrega com economia de dados nem com movimento reduzido. */
  function iniciarVideos() {
    var conexao = navigator.connection || {};
    if (conexao.saveData || !('IntersectionObserver' in window)) return;
    lista('.servico').forEach(function (s) {
      var v = s.querySelector('.midia__video');
      if (!v) return;
      var midia = v.closest('.midia'), quer = false, tPausa = 0;
      function carregar() {
        if (v.getAttribute('src') || reduzido()) return;
        v.preload = 'auto';
        v.src = v.getAttribute('data-src');
      }
      function tocar() {
        if (reduzido()) return;
        quer = true;
        clearTimeout(tPausa);
        carregar();
        var p = v.play();
        if (p && p.catch) p.catch(function () { /* autoplay negado: fica a foto */ });
      }
      function parar() {
        quer = false;
        midia.classList.remove('is-vivo');
        clearTimeout(tPausa);
        tPausa = setTimeout(function () { if (!quer) v.pause(); }, 900);   /* pausa depois do cruzamento */
      }
      v.addEventListener('playing', function () { if (quer) midia.classList.add('is-vivo'); });
      if (mqFino.matches) {
        new IntersectionObserver(function (es, io) { if (es[0].isIntersecting) { io.disconnect(); carregar(); } }, { rootMargin: '300px 0px' }).observe(s);
        s.addEventListener('pointerenter', tocar);
        s.addEventListener('pointerleave', parar);
      } else {
        new IntersectionObserver(function (es) { if (es[0].isIntersecting) tocar(); else if (quer) parar(); }, { threshold: 0.6 }).observe(midia);
      }
    });
  }

  /* ---------- liga tudo depois das bibliotecas ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    gsapOk = !!(window.gsap && window.ScrollTrigger);
    if (gsapOk) gsap.registerPlugin(ScrollTrigger);
    ligarLenis();
    armarReveals();
    iniciarRaizes();
    iniciarMagnetico();
  });
  /* as curvas não dependem das bibliotecas: montam já, antes da 1ª pintura da página */
  iniciarSolo();
  iniciarVideos();
  iniciarTrilha();

  /* a preferência de movimento muda com a página aberta (o <head> já trocou html.rm) */
  mqReduz.addEventListener('change', function () {
    if (reduzido()) { desligarLenis(); revelarTudo(); }
    else ligarLenis();
    solo.atualizar();
    if (raizes.montar) raizes.montar();
    if (trilha.montar) trilha.montar();
  });

  /* sondas para o QA (qa/ferramentas): leitura apenas */
  window.TCA = {
    lenis: function () { return lenis; },
    solo: function () { return solo.estado(); },
    raizes: function () { return raizes.estado(); },
    trilha: function () { return trilha.estado(); },
    topo: marcarTopo        /* o broto.js chama quando o hero troca de tema */
  };
})();
