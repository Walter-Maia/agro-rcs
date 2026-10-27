/* ------------------------------------------------------------
   TcaEnterprise — site.js v0.4.0
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
  function marcarTopo() {
    var r = (window.scrollY || window.pageYOffset) > 8;
    if (r !== rolado) { rolado = r; topo.classList.toggle('is-rolado', r); }
    var linha = topo.offsetHeight + 12;   /* folga: âncoras param 8 px abaixo da barra (scroll-padding) */
    var e = secoesEscuras.some(function (s) { var b = s.getBoundingClientRect(); return s.classList.contains('tema-escuro') && b.top <= linha && b.bottom > linha; });
    if (e !== escuro) { escuro = e; topo.classList.toggle('is-escuro', e); }
  }
  addEventListener('scroll', marcarTopo, { passive: true });
  addEventListener('resize', marcarTopo);
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
     funda), os links sobem de 140 % com 10° de giro e o rodapé do menu sobe por último. Fechar: véu e palco
     somem e o painel sai inteiro para a direita. Ease "main" (CustomEase .65,.01,.05,.99), 0,7 s, como no
     componente. Sem GSAP ou com movimento reduzido, o menu só aparece e some. O resto da página fica inerte
     enquanto ele está aberto; Esc e o véu fecham, e o foco volta ao botão. */
  var botaoMenu = document.querySelector('.topo__menu'), menu = document.getElementById('menu');
  var painel = menu.querySelector('.menu__painel'), veu = menu.querySelector('.menu__veu'), palcoMenu = menu.querySelector('.menu__palco');
  var camadas = lista('.menu__camada', menu), linksMenu = lista('.menu__link', menu), fadesMenu = lista('[data-menu-fade]', menu);
  var itensMenu = lista('.menu__lista li[data-cena]', menu);
  var foraDoMenu = [document.getElementById('conteudo'), document.querySelector('.rodape'), document.querySelector('.pular')];
  var aberto = false, tlMenu = null, EASE_MENU = 'power3.inOut';
  function menuAberto() { return aberto; }
  function animarMenu() { return gsapOk && !reduzido(); }
  function abrirMenu(abrir, devolverFoco) {
    if (abrir === aberto) return;
    aberto = abrir;
    botaoMenu.setAttribute('aria-expanded', String(abrir));
    botaoMenu.querySelector('.sr').textContent = abrir ? 'Fechar menu' : 'Abrir menu';
    root.classList.toggle('menu-aberto', abrir);
    foraDoMenu.forEach(function (el) { if (el) el.inert = abrir; });
    if (lenis) { if (abrir) lenis.stop(); else lenis.start(); }
    if (tlMenu) { tlMenu.kill(); tlMenu = null; }
    if (abrir) {
      menu.hidden = false;
      cenaPadrao = secaoNaTela();
      itensMenu.forEach(function (li) { li.classList.toggle('is-atual', li.getAttribute('data-cena') === cenaPadrao); });
      hoverCena = null; focoCena = null;
      decidirCena();
      if (animarMenu()) {
        tlMenu = gsap.timeline({ defaults: { ease: EASE_MENU, duration: 0.7 } })
          .set(painel, { xPercent: 0 })
          .fromTo([veu, palcoMenu], { autoAlpha: 0 }, { autoAlpha: 1 }, 0)
          .fromTo(camadas, { xPercent: 101 }, { xPercent: 0, stagger: 0.12, duration: 0.575 }, 0)
          .fromTo(linksMenu, { yPercent: 140, rotate: 10 }, { yPercent: 0, rotate: 0, stagger: 0.05, clearProps: 'transform' }, 0.35)
          .fromTo(fadesMenu, { autoAlpha: 0, yPercent: 50 }, { autoAlpha: 1, yPercent: 0, stagger: 0.04, clearProps: 'all' }, 0.55);
      }
      linksMenu[0].focus({ preventScroll: true });
    } else {
      if (animarMenu()) {
        tlMenu = gsap.timeline({
          defaults: { ease: EASE_MENU, duration: 0.7 },
          onComplete: function () { menu.hidden = true; trocarCena(null); gsap.set([painel, veu, palcoMenu].concat(camadas, linksMenu, fadesMenu), { clearProps: 'all' }); }
        })
          .to([veu, palcoMenu], { autoAlpha: 0 }, 0)
          .to(painel, { xPercent: 120 }, 0);
      } else { menu.hidden = true; trocarCena(null); }
      if (devolverFoco) botaoMenu.focus();
    }
  }
  botaoMenu.addEventListener('click', function () { abrirMenu(!aberto, true); });
  menu.querySelector('[data-menu-fechar]').addEventListener('click', function () { abrirMenu(false, true); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && aberto) abrirMenu(false, true);
  });

  /* ---------- cenas do menu ----------
     Cada link conta uma pequena história em linha, com começo (o desenho entra na ordem em que a coisa nasce)
     e um detalhe que fica vivo enquanto ele está em cena:
       1 Início ........ a órbita se desenha, os três anéis da marca acendem em cascata, o do meio pulsa e um
                          ponto Trigo orbita
       2 Serviços ...... duas curvas de nível entram e andam sozinhas; um marcador boia na curva Trigo
       3 Como funciona . a haste desce, as raízes se abrem, cada anel acende quando a raiz chega; depois,
                          pulsos de luz correm pelas raízes e os anéis respondem
       4 Sobre ......... o broto: chão, raízes para baixo, caule de baixo para cima e, com o caule firme, o nó
                          e as duas folhas se abrindo dele; depois balançam de leve
       5 Contato ....... os pontos do mapa aparecem, as linhas se ligam ao pino, o pino cai e emite ondas;
                          pela linha correm traços até ele
     Em cena fica UM item: o do mouse; sem mouse, o do foco (teclado); sem os dois, a seção que está na
     tela. A troca é um cruzamento de 0,35 s: a cena que sai continua viva até sumir e só então para.
     Regras que evitam desenho quebrado: nada de vector-effect (com pathLength, ele desconta o tracejado),
     escala e giro só em <g> com svgOrigin explícito, e cada cena parte sempre do zero (fromTo). */
  var cenasSvg = lista('.cena', menu), legenda = menu.querySelector('.menu__legenda');
  var cenaAtual = null, cenaPadrao = '1', hoverCena = null, focoCena = null;
  function el(f, n) { return f.querySelector('[data-p="' + n + '"]'); }
  function els(f, n) { return lista('[data-p="' + n + '"]', f); }
  function caminhos(gs) { return gs.map(function (g) { return g.tagName === 'g' ? g.querySelector('path, circle') : g; }); }
  function centro(g) { return g.getAttribute('data-c'); }
  function tracar(alvos) { gsap.set(alvos, { strokeDasharray: '1 2', strokeDashoffset: 1 }); }
  /* as curvas de Serviços: período de 400 unidades (a largura da cena), desenhadas de −20 a 820 para andar sem emenda */
  var ONDAS = [
    function (x) { var t = x / 400 * Math.PI * 2; return 172 + 26 * Math.sin(t + 0.6) + 9 * Math.sin(2 * t + 1.9); },
    function (x) { var t = x / 400 * Math.PI * 2; return 236 + 30 * Math.sin(t + 2.1) + 8 * Math.sin(2 * t + 0.4); }
  ];
  lista('[data-onda]', menu).forEach(function (p) { p.setAttribute('d', curvaPeriodica(ONDAS[+p.getAttribute('data-onda')], -20, 820, 20)); });
  var CENAS = {
    1: function (f, tl) {
      var orbita = el(f, 'orbita'), aneis = els(f, 'anel'), onda = el(f, 'onda'), satelite = el(f, 'satelite');
      tracar([orbita].concat(caminhos(aneis)));
      gsap.set(satelite, { opacity: 0, rotation: 0, svgOrigin: '200 200' });
      aneis.forEach(function (g) { gsap.set(g, { scale: 0.55, svgOrigin: centro(g) }); });
      gsap.set(onda, { opacity: 0, scale: 1, svgOrigin: '200 268' });
      tl.to(orbita, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' }, 0)
        .to(caminhos(aneis), { strokeDashoffset: 0, duration: 0.8, stagger: 0.14, ease: 'power2.out' }, 0.35)
        .to(aneis, { scale: 1, duration: 1, stagger: 0.14, ease: 'back.out(2.2)' }, 0.35)
        .to(satelite, { opacity: 1, duration: 0.4 }, 1.1)
        .to(satelite, { rotation: 360, duration: 10, ease: 'none', repeat: -1 }, 1.1)
        .fromTo(onda, { opacity: 0.75, scale: 1 }, { opacity: 0, scale: 2.2, duration: 1.9, ease: 'power2.out', repeat: -1, repeatDelay: 0.5 }, 1.3);
    },
    2: function (f, tl) {
      var trilhos = els(f, 'trilho'), curvas = caminhos(trilhos), marcador = el(f, 'marcador');
      tracar(curvas);
      gsap.set(trilhos, { x: 0 });
      gsap.set(marcador, { opacity: 0, scale: 0, svgOrigin: '200 236', attr: { cy: ONDAS[1](200) } });
      function boiar() {
        var cy = ONDAS[1](200 - gsap.getProperty(trilhos[1], 'x'));
        gsap.set(marcador, { attr: { cy: cy }, svgOrigin: '200 ' + cy.toFixed(1) });
      }
      tl.to(curvas, { strokeDashoffset: 0, duration: 1.2, stagger: 0.2, ease: 'power2.inOut' }, 0)
        .to(trilhos[0], { x: -400, duration: 9, ease: 'none', repeat: -1 }, 0)
        .to(trilhos[1], { x: -400, duration: 6, ease: 'none', repeat: -1, onUpdate: boiar }, 0)
        .to(marcador, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2.6)' }, 1.1);
    },
    3: function (f, tl) {
      var haste = el(f, 'haste'), raizes = els(f, 'raiz'), cometas = els(f, 'cometa'), aneis = els(f, 'anel');
      tracar([haste].concat(raizes, caminhos(aneis)));
      aneis.forEach(function (g) { gsap.set(g, { scale: 0.4, svgOrigin: centro(g) }); });
      gsap.set(cometas, { strokeDasharray: '0.08 1', strokeDashoffset: 0.08 });
      tl.to(haste, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.in' }, 0)
        .to(raizes, { strokeDashoffset: 0, duration: 0.75, stagger: 0.09, ease: 'power2.out' }, 0.55)
        .to(caminhos(aneis), { strokeDashoffset: 0, duration: 0.8, stagger: 0.09, ease: 'power2.out' }, 1.05)
        .to(aneis, { scale: 1, duration: 0.8, stagger: 0.09, ease: 'back.out(2.4)' }, 1.05);
      /* o detalhe: pulsos de luz descem pelas raízes e cada anel responde quando o seu chega */
      var pulso = gsap.timeline({ repeat: -1, repeatDelay: 0.6 })
        .fromTo(cometas, { strokeDashoffset: 0.08 }, { strokeDashoffset: -1, duration: 1.4, stagger: 0.14, ease: 'power1.in' }, 0)
        .to(aneis, { scale: 1.15, duration: 0.18, yoyo: true, repeat: 1, stagger: 0.14, ease: 'power2.out' }, 1.25);
      tl.add(pulso, 1.9);
    },
    4: function (f, tl) {
      var chao = els(f, 'chao'), raizinhas = els(f, 'raizinha'), caule = el(f, 'caule'), no = el(f, 'no');
      var folhas = els(f, 'folha'), contornos = caminhos(folhas);
      tracar(chao.concat(raizinhas, [caule], contornos));
      gsap.set(contornos, { fillOpacity: 0 });
      gsap.set(no, { scale: 0, svgOrigin: '200 209' });
      /* folhas fechadas: dobradas para cima, rente ao caule, e pequenas; abrem a partir do nó */
      folhas.forEach(function (g) { gsap.set(g, { svgOrigin: '200 209', rotation: -(+g.getAttribute('data-lado')) * 58, scale: 0.2 }); });
      tl.to(chao, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.out' }, 0)
        .to(raizinhas, { strokeDashoffset: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out' }, 0.25)
        .to(caule, { strokeDashoffset: 0, duration: 1, ease: 'power3.out' }, 0.45)          /* nasce do chão e sobe */
        .to(no, { scale: 1, duration: 0.5, ease: 'back.out(3)' }, 1.45)                      /* caule firme: o nó */
        .to(folhas, { rotation: 0, scale: 1, duration: 1.3, stagger: 0.14, ease: 'elastic.out(1, .6)' }, 1.6)
        .to(contornos, { strokeDashoffset: 0, duration: 0.9, stagger: 0.14, ease: 'power2.out' }, 1.6)
        .to(contornos, { fillOpacity: 1, duration: 0.7, stagger: 0.14 }, 2.1)
        /* o detalhe: as folhas balançam devagar, fora de fase */
        .to(folhas[0], { rotation: 3.5, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 2.9)
        .to(folhas[1], { rotation: -3.5, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 3.0);
    },
    5: function (f, tl) {
      var pontos = els(f, 'ponto'), ligas = els(f, 'liga'), pino = el(f, 'pino'), ondas = els(f, 'onda');
      tracar(ligas);
      pontos.forEach(function (g) { gsap.set(g, { scale: 0, svgOrigin: centro(g) }); });
      gsap.set(pino, { y: -70, opacity: 0 });
      gsap.set(ondas, { opacity: 0, scale: 1, svgOrigin: '200 210' });
      tl.to(pontos, { scale: 1, duration: 0.5, stagger: { each: 0.08, from: 'random' }, ease: 'back.out(2.6)' }, 0)
        .to(ligas, { strokeDashoffset: 0, duration: 0.8, stagger: 0.08, ease: 'power2.inOut' }, 0.3)  /* do ponto até o pino */
        .to(pino, { y: 0, opacity: 1, duration: 0.8, ease: 'bounce.out' }, 0.95)
        .fromTo(ondas, { opacity: 0.8, scale: 1 }, { opacity: 0, scale: 3.6, duration: 2, ease: 'power2.out', stagger: { each: 1, repeat: -1 } }, 1.6)
        /* o detalhe: as linhas viram tracejado que corre até o pino, como mensagens chegando */
        .set(ligas, { strokeDasharray: '0.035 0.065', strokeDashoffset: 0 }, 1.7)
        .to(ligas, { strokeDashoffset: -0.1, duration: 0.9, ease: 'none', repeat: -1 }, 1.7);
    }
  };
  function cenaSvg(id) { return menu.querySelector('.cena[data-cena="' + id + '"]'); }
  function palcoVisivel() { return palcoMenu && getComputedStyle(palcoMenu).display !== 'none'; }
  function trocarCena(id) {
    if (id === cenaAtual) return;
    var saindo = cenaAtual && cenaSvg(cenaAtual);
    if (saindo) {
      saindo.classList.remove('is-ativa');
      var tlSai = saindo._tl;
      saindo._tl = null;
      saindo._saindo = tlSai;
      setTimeout(function () { if (saindo._saindo === tlSai && tlSai) { tlSai.kill(); saindo._saindo = null; } }, 400);
    }
    cenaAtual = id;
    if (!id) return;
    var item = menu.querySelector('.menu__lista li[data-cena="' + id + '"]');
    legenda.classList.add('is-trocando');
    clearTimeout(legenda._t);
    legenda._t = setTimeout(function () {
      legenda.querySelector('[data-legenda-num]').textContent = ('0' + id).slice(-2);
      legenda.querySelector('[data-legenda]').textContent = item.getAttribute('data-legenda');
      legenda.classList.remove('is-trocando');
    }, 180);
    var entra = cenaSvg(id);
    if (entra._saindo) { entra._saindo.kill(); entra._saindo = null; }
    if (entra._tl) entra._tl.kill();
    entra._tl = null;
    if (animarMenu() && palcoVisivel()) { entra._tl = gsap.timeline(); CENAS[id](entra, entra._tl); }
    entra.classList.add('is-ativa');
  }
  function decidirCena() {
    if (!aberto) return;
    var escolhida = hoverCena || focoCena;
    /* a faixa de fundo marca só o item apontado (mouse ou teclado), não a seção padrão */
    itensMenu.forEach(function (li) { li.classList.toggle('is-cena', li.getAttribute('data-cena') === escolhida); });
    trocarCena(escolhida || cenaPadrao);
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
     movimento reduzido. */
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
      linhas.push({
        el: svg, x: 0, onda: 0,
        base: (34 + 56 * k) * mult,      /* px/s parada: 34 a 90 px/s */
        arrasto: (0.45 + 0.85 * k) * mult, /* px de deslocamento por px rolado */
        inchaco: 0.55 + 0.45 * k          /* quanto a curva incha com a rolagem rápida */
      });
    }
    return { caixa: caixa, linhas: linhas, larg: caixa.clientWidth || 1, visivel: false };
  }
  function iniciarSolo() {
    solos = lista('[data-solo]').map(montarSolo);
    var raf = 0, ultimo = 0, vel = 1, alvo = 1, dir = 1, yQuadro = window.scrollY || 0, onda = 0;
    function algumVisivel() { return solos.some(function (s) { return s.visivel; }); }
    function rodando() { return !reduzido() && !document.hidden && algumVisivel(); }
    /* a cada quadro: deriva (px/s × impulso) + arrasto direto da rolagem (px rolados × fator da curva).
       A rolagem rápida também "levanta" o relevo: as curvas crescem em altura (scaleY) e assentam com mola. */
    function quadro(t) {
      raf = 0;
      var dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 0;
      ultimo = t;
      var y = window.scrollY || window.pageYOffset, dy = y - yQuadro;
      yQuadro = y;
      if (Math.abs(dy) > 0.5) dir = dy < 0 ? -1 : 1;
      alvo += (1 - alvo) * 0.035;            /* o impulso da rolagem decai */
      vel += (alvo - vel) * 0.14;
      onda += (Math.min(Math.abs(dy) / 40, 0.5) - onda) * (Math.abs(dy) > 0.5 ? 0.25 : 0.06);
      solos.forEach(function (s) {
        if (!s.visivel) return;
        s.linhas.forEach(function (l) {
          l.x -= l.base * vel * dir * dt + dy * l.arrasto;
          l.x = -(((-l.x) % s.larg) + s.larg) % s.larg;
          var sy = 1 + onda * l.inchaco;
          l.el.style.transform = 'translate3d(' + l.x.toFixed(2) + 'px,0,0) scaleY(' + sy.toFixed(3) + ')';
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
    /* impulso pela velocidade da rolagem (Lenis, ou a rolagem nativa sem ele): até 10× a deriva */
    solo.velocidade = function (v) {
      if (Math.abs(v) < 0.5) return;
      alvo = 1 + Math.min(Math.abs(v) * 0.6, 9);
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
        solos.forEach(function (s) { if (s.caixa === e.target) s.visivel = e.isIntersecting; });
      });
      atualizar();
    }, { rootMargin: '80px 0px' });
    solos.forEach(function (s) { io.observe(s.caixa); });
    addEventListener('resize', function () { solos.forEach(function (s) { s.larg = s.caixa.clientWidth || 1; }); });
    document.addEventListener('visibilitychange', atualizar);
    solo.atualizar = atualizar;
    atualizar();
  }
  var solo = { atualizar: function () {}, velocidade: function () {}, estado: function () { return null; } };

  /* ---------- 07 · magnético (só ponteiro fino) + press com mola no CTA final ---------- */
  function iniciarMagnetico() {
    if (!gsapOk || !mqFino.matches) return;
    lista('.magnetico').forEach(function (btn) {
      var rotulo = btn.querySelector('.btn__rotulo');
      btn.addEventListener('mousemove', function (e) {
        if (reduzido()) return;
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        gsap.to(btn, { x: dx * 0.35, y: dy * 0.35, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
        gsap.to(rotulo, { x: dx * 0.15, y: dy * 0.15, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      });
      btn.addEventListener('mouseleave', function () {
        gsap.to([btn, rotulo], { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.35)', overwrite: 'auto' });
      });
    });
  }
  /* CTA sem destino confirmado: não leva a lugar nenhum e diz isso, sem fingir envio */
  lista('[data-destino-pendente]').forEach(function (btn) {
    var aviso = document.querySelector('[data-aviso]'), face = btn.querySelector('.btn__face');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (aviso) aviso.textContent = aviso.getAttribute('data-texto');
      if (face.animate && !reduzido()) {
        face.animate([{ transform: 'scale(.97)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.34, 1.56, .64, 1)' });
      }
    });
  });

  /* ---------- liga tudo depois das bibliotecas ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    gsapOk = !!(window.gsap && window.ScrollTrigger);
    if (gsapOk) gsap.registerPlugin(ScrollTrigger);
    /* o "main" do componente; sem o CustomEase (CDN fora), um inOut parecido */
    if (gsapOk && window.CustomEase) {
      try { gsap.registerPlugin(CustomEase); EASE_MENU = CustomEase.create('main', '0.65, 0.01, 0.05, 0.99'); } catch (e) { /* fica o power3.inOut */ }
    }
    ligarLenis();
    armarReveals();
    iniciarRaizes();
    iniciarMagnetico();
  });
  /* as curvas não dependem das bibliotecas: montam já, antes da 1ª pintura da página */
  iniciarSolo();

  /* a preferência de movimento muda com a página aberta (o <head> já trocou html.rm) */
  mqReduz.addEventListener('change', function () {
    if (reduzido()) { desligarLenis(); revelarTudo(); }
    else ligarLenis();
    solo.atualizar();
    if (raizes.montar) raizes.montar();
  });

  /* sondas para o QA (qa/ferramentas): leitura apenas */
  window.TCA = {
    lenis: function () { return lenis; },
    solo: function () { return solo.estado(); },
    raizes: function () { return raizes.estado(); },
    topo: marcarTopo        /* o broto.js chama quando o hero troca de tema */
  };
})();
