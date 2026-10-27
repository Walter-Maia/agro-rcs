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
  var secoesEscuras = lista('.tema-escuro');
  function marcarTopo() {
    var r = (window.scrollY || window.pageYOffset) > 8;
    if (r !== rolado) { rolado = r; topo.classList.toggle('is-rolado', r); }
    var linha = topo.offsetHeight + 12;   /* folga: âncoras param 8 px abaixo da barra (scroll-padding) */
    var e = secoesEscuras.some(function (s) { var b = s.getBoundingClientRect(); return b.top <= linha && b.bottom > linha; });
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
     Abrir: véu aparece, as três camadas entram pela direita em cascata (Trigo, Floresta, Floresta funda),
     os links sobem de 140 % com 10° de giro e o rodapé do menu sobe por último. Fechar: véu some e o painel
     sai inteiro para a direita. Ease "main" (CustomEase .65,.01,.05,.99), 0,7 s, como no componente.
     Sem GSAP ou com movimento reduzido, o menu só aparece e some. O resto da página fica inerte enquanto
     ele está aberto; Esc e o véu fecham, e o foco volta ao botão. */
  var botaoMenu = document.querySelector('.topo__menu'), menu = document.getElementById('menu');
  var painel = menu.querySelector('.menu__painel'), veu = menu.querySelector('.menu__veu');
  var camadas = lista('.menu__camada', menu), linksMenu = lista('.menu__link', menu), fadesMenu = lista('[data-menu-fade]', menu);
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
      if (animarMenu()) {
        tlMenu = gsap.timeline({ defaults: { ease: EASE_MENU, duration: 0.7 } })
          .set(painel, { xPercent: 0 })
          .fromTo(veu, { autoAlpha: 0 }, { autoAlpha: 1 }, 0)
          .fromTo(camadas, { xPercent: 101 }, { xPercent: 0, stagger: 0.12, duration: 0.575 }, 0)
          .fromTo(linksMenu, { yPercent: 140, rotate: 10 }, { yPercent: 0, rotate: 0, stagger: 0.05 }, 0.35)
          .fromTo(fadesMenu, { autoAlpha: 0, yPercent: 50 }, { autoAlpha: 1, yPercent: 0, stagger: 0.04, clearProps: 'all' }, 0.55);
      }
      linksMenu[0].focus({ preventScroll: true });
    } else {
      apagarFormas(true);
      if (animarMenu()) {
        tlMenu = gsap.timeline({
          defaults: { ease: EASE_MENU, duration: 0.7 },
          onComplete: function () { menu.hidden = true; gsap.set([painel, veu].concat(camadas, linksMenu, fadesMenu), { clearProps: 'all' }); }
        })
          .to(veu, { autoAlpha: 0 }, 0)
          .to(painel, { xPercent: 120 }, 0);
      } else menu.hidden = true;
      if (devolverFoco) botaoMenu.focus();
    }
  }
  botaoMenu.addEventListener('click', function () { abrirMenu(!aberto, true); });
  menu.querySelector('[data-menu-fechar]').addEventListener('click', function () { abrirMenu(false, true); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && aberto) abrirMenu(false, true);
  });

  /* grafismos do hover: cada link acende o seu (anéis, curvas de nível, raízes, folha, pontos do mapa).
     Com GSAP, o gesto do componente (escala .5 → 1, −10° → 0, back.out em cascata); sem ele, o mesmo em CSS. */
  var formas = lista('.menu__forma', menu);
  formas.forEach(function (f) { lista('.forma-el', f).forEach(function (el, i) { el.style.setProperty('--k', i); }); });
  function apagarFormas(agora) {
    formas.forEach(function (f) {
      if (!f.classList.contains('is-ativa')) return;
      var els = lista('.forma-el', f);
      if (animarMenu() && !agora) {
        gsap.to(els, { scale: 0.8, opacity: 0, duration: 0.3, ease: 'power2.in', overwrite: 'auto', onComplete: function () { f.classList.remove('is-ativa'); } });
      } else {
        if (animarMenu()) gsap.set(els, { opacity: 0 });
        f.classList.remove('is-ativa');
      }
    });
  }
  lista('.menu__lista li[data-forma]', menu).forEach(function (item) {
    var forma = menu.querySelector('.menu__forma[data-forma="' + item.getAttribute('data-forma') + '"]');
    if (!forma) return;
    var els = lista('.forma-el', forma);
    function entrar() {
      formas.forEach(function (f) { if (f !== forma) f.classList.remove('is-ativa'); });
      if (animarMenu()) gsap.set(lista('.forma-el', menu).filter(function (el) { return els.indexOf(el) < 0; }), { opacity: 0 });
      forma.classList.add('is-ativa');
      if (animarMenu()) {
        gsap.fromTo(els, { scale: 0.5, opacity: 0, rotation: -10 },
          { scale: 1, opacity: 1, rotation: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(1.7)', overwrite: 'auto' });
      }
    }
    function sair() {
      if (animarMenu()) {
        gsap.to(els, { scale: 0.8, opacity: 0, duration: 0.3, ease: 'power2.in', overwrite: 'auto', onComplete: function () { forma.classList.remove('is-ativa'); } });
      } else forma.classList.remove('is-ativa');
    }
    item.addEventListener('mouseenter', entrar);
    item.addEventListener('mouseleave', sair);
    item.addEventListener('focusin', entrar);
    item.addEventListener('focusout', sair);
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
     data-velocidade multiplica a velocidade da caixa. No mesmo quadro, a foto e a ficha da hero ganham
     paralaxe (--p). Só roda com a caixa à vista, aba visível e sem movimento reduzido. */
  var solos = [], heroVisual = document.querySelector('.hero__visual'), heroCaixa = document.querySelector('.hero');
  var ultimoPHero = -1;
  function semente(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function curvaPeriodica(y) {
    var pts = [], d = '', i, x;
    for (x = -24; x <= 2904; x += 24) pts.push([x, y(x)]);
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
      paralaxeHero(y);
      if (rodando()) raf = requestAnimationFrame(quadro);
    }
    function atualizar() {
      if (rodando()) { if (!raf) { ultimo = 0; yQuadro = window.scrollY || 0; raf = requestAnimationFrame(quadro); } }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (reduzido()) {
        solos.forEach(function (s) { s.linhas.forEach(function (l) { l.el.style.transform = ''; l.x = 0; }); });
        if (heroVisual) heroVisual.style.removeProperty('--p');
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
  /* paralaxe da hero: --p vai de 0 a 1 enquanto a hero sai da tela (foto desce 9 %, ficha sobe 48 px) */
  function paralaxeHero(y) {
    if (!heroVisual || reduzido()) return;
    var p = limitar(y / (heroCaixa.offsetHeight || 1));
    if (Math.abs(p - ultimoPHero) < 0.001) return;
    ultimoPHero = p;
    heroVisual.style.setProperty('--p', p.toFixed(4));
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
    if (!gsapOk) root.classList.add('sem-gsap');
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
    raizes: function () { return raizes.estado(); }
  };
})();
