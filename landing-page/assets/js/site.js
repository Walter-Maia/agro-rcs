/* ------------------------------------------------------------
   TcaEnterprise — site.js v0.2.0
   Lenis (01), ScrollTrigger, títulos linha a linha (02), fotos com máscara (04), marquee (06),
   botão magnético (07), raízes desenhadas pela rolagem (assinatura), cabeçalho e menu do celular.
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

  /* ---------- 1 · cabeçalho: ao rolar, só o fundo muda (classe; o visual é opacidade no ::before) ---------- */
  var topo = document.querySelector('.topo'), rolado = null;
  function marcarTopo() {
    var r = (window.scrollY || window.pageYOffset) > 8;
    if (r !== rolado) { rolado = r; topo.classList.toggle('is-rolado', r); }
  }
  addEventListener('scroll', marcarTopo, { passive: true });
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

  /* ---------- menu do celular: overlay simples; o resto da página fica inerte enquanto ele está aberto ---------- */
  var botaoMenu = document.querySelector('.topo__menu'), menu = document.getElementById('menu-movel');
  var foraDoMenu = [document.getElementById('conteudo'), document.querySelector('.rodape'), document.querySelector('.pular')];
  function menuAberto() { return botaoMenu.getAttribute('aria-expanded') === 'true'; }
  function abrirMenu(abrir) {
    if (abrir === menuAberto()) return;
    botaoMenu.setAttribute('aria-expanded', String(abrir));
    botaoMenu.querySelector('.sr').textContent = abrir ? 'Fechar menu' : 'Abrir menu';
    menu.hidden = !abrir;
    menu.classList.toggle('is-aberto', abrir);
    root.classList.toggle('menu-aberto', abrir);
    foraDoMenu.forEach(function (el) { if (el) el.inert = abrir; });
    if (lenis) { if (abrir) lenis.stop(); else lenis.start(); }
    if (abrir) menu.querySelector('a').focus();
  }
  botaoMenu.addEventListener('click', function () { abrirMenu(!menuAberto()); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuAberto()) { abrirMenu(false); botaoMenu.focus(); }
  });
  matchMedia('(min-width: 960px)').addEventListener('change', function (e) { if (e.matches) abrirMenu(false); });

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
    lenis.on('scroll', function (e) { faixa.velocidade(e.velocity); });
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
      aoEntrar(el, function () { el.classList.add('is-dentro'); });
    });
  }
  function revelarTudo() { armados.forEach(function (el) { el.classList.add('is-dentro'); }); }
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
      vistos.forEach(function (el) { el.classList.add('is-dentro'); });
    }, 220);
  }, { passive: true });

  /* ---------- 06 · marquee: px/s com dt (sem salto ao voltar), acelera e inverte com a rolagem;
     pausa fora da tela, em aba oculta, pelo botão e com movimento reduzido ---------- */
  var faixa = { velocidade: function () {} };
  function iniciarFaixa() {
    var caixa = document.querySelector('.faixa');
    if (!caixa) return;
    var trilho = caixa.querySelector('.faixa__trilho'), grupo = caixa.querySelector('.faixa__grupo');
    var botao = caixa.querySelector('.faixa__pausa'), rotulo = botao.querySelector('.sr');
    var BASE = 42, larg = 1, x = 0, vel = 1, alvo = 1, dir = 1;
    var visivel = false, pausada = false, raf = 0, ultimo = 0;

    function montar() {
      lista('[data-clone]', trilho).forEach(function (c) { c.remove(); });
      larg = grupo.getBoundingClientRect().width || 1;
      var n = Math.ceil(caixa.clientWidth / larg) + 1;
      for (var i = 0; i < n; i++) {
        var c = grupo.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.setAttribute('data-clone', '');
        lista('[data-copy]', c).forEach(function (el) { el.removeAttribute('data-copy'); });
        trilho.appendChild(c);
      }
      x = x % larg;
    }
    function rodando() { return visivel && !pausada && !document.hidden && !reduzido(); }
    function quadro(t) {
      raf = 0;
      if (!rodando()) return;
      var dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 0;
      ultimo = t;
      alvo += (1 - alvo) * 0.04;            /* o impulso da rolagem decai */
      vel += (alvo - vel) * 0.12;
      x -= BASE * vel * dir * dt;
      if (x <= -larg) x += larg;
      if (x > 0) x -= larg;
      trilho.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      raf = requestAnimationFrame(quadro);
    }
    function atualizar() {
      if (rodando()) { if (!raf) { ultimo = 0; raf = requestAnimationFrame(quadro); } }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (reduzido()) trilho.style.transform = '';
      botao.hidden = reduzido();
    }
    faixa.velocidade = function (v) {
      if (Math.abs(v) < 0.5) return;
      dir = v < 0 ? -1 : 1;
      alvo = 1 + Math.min(Math.abs(v) * 0.4, 6);
    };
    faixa.atualizar = atualizar;
    faixa.estado = function () { return { rodando: rodando(), visivel: visivel, pausada: pausada, x: x, vel: vel, larg: larg }; };

    montar();
    fontesProntas().then(montar);
    var largFaixa = caixa.clientWidth;
    addEventListener('resize', function () { if (caixa.clientWidth !== largFaixa) { largFaixa = caixa.clientWidth; montar(); } });
    new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; atualizar(); }).observe(caixa);
    document.addEventListener('visibilitychange', atualizar);
    botao.addEventListener('click', function () {
      pausada = !pausada;
      botao.setAttribute('aria-pressed', String(pausada));
      rotulo.textContent = pausada ? 'Retomar a faixa' : 'Pausar a faixa';
      atualizar();
    });
    /* sem Lenis, a velocidade vem da rolagem nativa */
    var yAntes = window.scrollY;
    addEventListener('scroll', function () {
      var y = window.scrollY;
      if (!lenis) faixa.velocidade((y - yAntes) / 4);
      yAntes = y;
    }, { passive: true });
    atualizar();
  }

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
    ligarLenis();
    armarReveals();
    iniciarFaixa();
    iniciarRaizes();
    iniciarMagnetico();
  });

  /* a preferência de movimento muda com a página aberta (o <head> já trocou html.rm) */
  mqReduz.addEventListener('change', function () {
    if (reduzido()) { desligarLenis(); revelarTudo(); }
    else ligarLenis();
    if (faixa.atualizar) faixa.atualizar();
    if (raizes.montar) raizes.montar();
  });

  /* sondas para o QA (qa/ferramentas): leitura apenas */
  window.TCA = {
    lenis: function () { return lenis; },
    faixa: function () { return faixa.estado ? faixa.estado() : null; },
    raizes: function () { return raizes.estado(); }
  };
})();
