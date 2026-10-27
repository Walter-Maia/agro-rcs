/* ABERTURA — "o broto que acende" (~3,4 s, versão noturna). Roda de forma síncrona como primeira coisa do <body>:
   monta o palco, toca e libera a página. A coreografia fica toda em assets/css/intro.css;
   aqui só se liga, encerra e limpa. Quem decide se toca é o <head> (html.intro-active).
   Modelo: a abertura da Pousada Alecrim (dois tempos, finish "open" | "skip" | "now"). */
(function(){
  var root = document.documentElement;
  if(!root.classList.contains("intro-active")) return;   /* movimento reduzido, sessão vista, #âncora, aba oculta: sem abertura */

  /* paths oficiais do sprite aprovado, gerados por qa/ferramentas/montar-marca-inline.js (não editar à mão) */
  /*PALCO:INICIO*/
  var PALCO = "<canvas class=\"it-curvas it-curvas--longe\" data-curvas=\"0 6\"></canvas><canvas class=\"it-curvas it-curvas--perto\" data-curvas=\"6 12\"></canvas><i class=\"it-horizonte\"></i><i class=\"it-luz\"></i><i class=\"it-semente\"></i><div class=\"it-palco\"><div class=\"it-marca\"><svg class=\"it-logo\" viewBox=\"0 0 1373 687\" focusable=\"false\"><defs><radialGradient id=\"it-brilho\"><stop offset=\"0\" stop-color=\"#C9A227\" stop-opacity=\".85\"/><stop offset=\".38\" stop-color=\"#C9A227\" stop-opacity=\".26\"/><stop offset=\"1\" stop-color=\"#C9A227\" stop-opacity=\"0\"/></radialGradient></defs><circle class=\"it-brilho\" style=\"--k:0\" cx=\"112.13\" cy=\"481.5\" r=\"118\" fill=\"url(#it-brilho)\"/><circle class=\"it-brilho\" style=\"--k:1\" cx=\"257.5\" cy=\"527.15\" r=\"118\" fill=\"url(#it-brilho)\"/><circle class=\"it-brilho\" style=\"--k:2\" cx=\"402.87\" cy=\"481.5\" r=\"118\" fill=\"url(#it-brilho)\"/><g fill=\"none\" stroke-linecap=\"butt\" style=\"stroke:var(--lg-ink)\"><path class=\"it-raiz\" style=\"--k:0\" d=\"M257.5 342L130.91 448.6\" stroke-width=\"39\" pathLength=\"1\"/><path class=\"it-raiz\" style=\"--k:1\" d=\"M257.5 342V487\" stroke-width=\"42\" pathLength=\"1\"/><path class=\"it-raiz\" style=\"--k:2\" d=\"M257.5 342L384.09 448.6\" stroke-width=\"39\" pathLength=\"1\"/></g><path class=\"it-cometa\" style=\"--k:0\" d=\"M257.5 342L130.91 448.6\" pathLength=\"1\"/><path class=\"it-cometa\" style=\"--k:1\" d=\"M257.5 342V487\" pathLength=\"1\"/><path class=\"it-cometa\" style=\"--k:2\" d=\"M257.5 342L384.09 448.6\" pathLength=\"1\"/><path class=\"it-haste\" style=\"stroke:var(--lg-ink)\" d=\"M257.5 342V121\" fill=\"none\" stroke-width=\"54\" pathLength=\"1\"/><path class=\"it-cometa it-cometa--haste\" d=\"M257.5 342V121\" pathLength=\"1\"/><path class=\"it-hub\" style=\"fill:var(--lg-ink)\" d=\"M247.5 65.5H267.5A40 40 0 0 1 307.5 105.5V120A30 30 0 0 1 277.5 150H237.5A30 30 0 0 1 207.5 120V105.5A40 40 0 0 1 247.5 65.5Z\"/><g class=\"it-folha it-folha--esq\"><path class=\"it-folha-fill\" d=\"M2.25 1.03C-0.55 2.16 -0.6 4.47 1.89 16.5C11.45 62.61 52.68 108.6 96.83 122.41C113.21 127.54 118.84 128 164.65 128L207.04 128 208.18 130.5C208.91 132.11 210.14 133 211.61 133C213.83 133 213.86 132.9 212.46 129.56C211.67 127.66 210.74 122.38 210.4 117.81C208.21 88.4 220.79 71.38 246.73 68.65C254.49 67.84 257 67.22 257 66.14C257 63.74 241.54 65.32 233.48 68.54C229.84 70 226.72 71.04 226.55 70.85C226.38 70.66 225.09 68.21 223.69 65.42C205.95 30.09 172.66 5.54 136.5 1.11C125.51 -0.24 5.58 -0.31 2.25 1.03M58 39.18C58 41.15 68.78 54.59 74.93 60.27C89.51 73.78 108.37 84.76 124.5 89.15C136.15 92.32 199.72 93.35 198.59 90.34C194.71 79.97 178.39 62.49 165.33 54.7C150.52 45.86 135.34 40.83 118 39.02C103.97 37.56 58 37.68 58 39.18\" fill-rule=\"evenodd\" style=\"fill:var(--lg-ink)\"/><path class=\"it-folha-traco\" pathLength=\"1\" d=\"M207.04 128L164.65 128C118.84 128 113.21 127.54 96.83 122.41C52.68 108.6 11.45 62.61 1.89 16.5C-0.6 4.47 -0.55 2.16 2.25 1.03\"/><path class=\"it-folha-traco\" pathLength=\"1\" d=\"M223.69 65.42C205.95 30.09 172.66 5.54 136.5 1.11C125.51 -0.24 5.58 -0.31 2.25 1.03\"/><path class=\"it-folha-traco\" pathLength=\"1\" d=\"M58 39.18C58 41.15 68.78 54.59 74.93 60.27C89.51 73.78 108.37 84.76 124.5 89.15C136.15 92.32 199.72 93.35 198.59 90.34C194.71 79.97 178.39 62.49 165.33 54.7C150.52 45.86 135.34 40.83 118 39.02C103.97 37.56 58 37.68 58 39.18\"/></g><g class=\"it-folha it-folha--dir\"><path class=\"it-folha-fill\" d=\"M512.75 1.03C515.55 2.16 515.6 4.47 513.11 16.5C503.55 62.61 462.32 108.6 418.17 122.41C401.79 127.54 396.16 128 350.35 128L307.96 128 306.82 130.5C306.09 132.11 304.86 133 303.39 133C301.17 133 301.14 132.9 302.54 129.56C303.33 127.66 304.26 122.38 304.6 117.81C306.79 88.4 294.21 71.38 268.27 68.65C260.51 67.84 258 67.22 258 66.14C258 63.74 273.46 65.32 281.52 68.54C285.16 70 288.28 71.04 288.45 70.85C288.62 70.66 289.91 68.21 291.31 65.42C309.05 30.09 342.34 5.54 378.5 1.11C389.49 -0.24 509.42 -0.31 512.75 1.03M457 39.18C457 41.15 446.22 54.59 440.07 60.27C425.49 73.78 406.63 84.76 390.5 89.15C378.85 92.32 315.28 93.35 316.41 90.34C320.29 79.97 336.61 62.49 349.67 54.7C364.48 45.86 379.66 40.83 397 39.02C411.03 37.56 457 37.68 457 39.18\" fill-rule=\"evenodd\" style=\"fill:var(--lg-ink)\"/><path class=\"it-folha-traco\" pathLength=\"1\" d=\"M307.96 128L350.35 128C396.16 128 401.79 127.54 418.17 122.41C462.32 108.6 503.55 62.61 513.11 16.5C515.6 4.47 515.55 2.16 512.75 1.03\"/><path class=\"it-folha-traco\" pathLength=\"1\" d=\"M291.31 65.42C309.05 30.09 342.34 5.54 378.5 1.11C389.49 -0.24 509.42 -0.31 512.75 1.03\"/><path class=\"it-folha-traco\" pathLength=\"1\" d=\"M457 39.18C457 41.15 446.22 54.59 440.07 60.27C425.49 73.78 406.63 84.76 390.5 89.15C378.85 92.32 315.28 93.35 316.41 90.34C320.29 79.97 336.61 62.49 349.67 54.7C364.48 45.86 379.66 40.83 397 39.02C411.03 37.56 457 37.68 457 39.18\"/></g><g fill=\"none\" style=\"stroke:var(--lg-accent)\"><circle class=\"it-anel\" style=\"--k:0\" cx=\"112.13\" cy=\"481.5\" r=\"34.4\" stroke-width=\"23.2\" pathLength=\"1\"/><circle class=\"it-anel\" style=\"--k:1\" cx=\"257.5\" cy=\"527.15\" r=\"34.4\" stroke-width=\"23.2\" pathLength=\"1\"/><circle class=\"it-anel\" style=\"--k:2\" cx=\"402.87\" cy=\"481.5\" r=\"34.4\" stroke-width=\"23.2\" pathLength=\"1\"/></g><g class=\"it-ca\"><path class=\"it-fill\" style=\"--k:0;fill:var(--lg-ink)\" d=\"M862.23 190.19A214.71 244.37 79.98 1 0 852.23 449.39L784.66 390.7A124.28 139.45 85.68 1 1 786.86 257.31Z\"/><path class=\"it-fill\" style=\"--k:1;fill:var(--lg-ink)\" d=\"M1041.9 108L1148.1 108L1370.5 530L1241.5 530L1201.97 449L988.03 449L948.5 530L819.5 530ZM1095 229.8L1163.18 369.5L1026.82 369.5Z\" fill-rule=\"evenodd\"/><path class=\"it-linha\" pathLength=\"1\" style=\"--k:0\" d=\"M862.23 190.19A214.71 244.37 79.98 1 0 852.23 449.39L784.66 390.7A124.28 139.45 85.68 1 1 786.86 257.31Z\"/><path class=\"it-linha\" pathLength=\"1\" style=\"--k:1\" d=\"M1041.9 108L1148.1 108L1370.5 530L1241.5 530L1201.97 449L988.03 449L948.5 530L819.5 530ZM1095 229.8L1163.18 369.5L1026.82 369.5Z\" fill-rule=\"evenodd\"/></g><g class=\"it-enterprise\" style=\"fill:var(--lg-accent)\"><path class=\"it-l\" style=\"--k:0;--o:-74.12\" d=\"M137.72 685L75 685L75 604L136.21 604L136.21 619.04L93.63 619.04L93.63 636.63L131.24 636.63L131.24 651.21L93.63 651.21L93.63 669.96L137.72 669.96L137.72 685Z\"/><path class=\"it-l\" style=\"--k:1;--o:-56.79\" d=\"M232.09 685L213.58 685L213.58 604L229.08 604L269.35 653.29L269.35 604L287.87 604L287.87 685L272.48 685L232.09 635.71L232.09 685Z\"/><path class=\"it-l\" style=\"--k:2;--o:-39.58\" d=\"M403.53 685L384.79 685L384.79 619.27L358.87 619.27L358.87 604L429.45 604L429.45 619.27L403.53 619.27L403.53 685Z\"/><path class=\"it-l\" style=\"--k:3;--o:-23.06\" d=\"M563.17 685L500.45 685L500.45 604L561.67 604L561.67 619.04L519.08 619.04L519.08 636.63L556.69 636.63L556.69 651.21L519.08 651.21L519.08 669.96L563.17 669.96L563.17 685Z\"/><path class=\"it-l\" style=\"--k:4;--o:-5.89\" d=\"M657.78 685L639.03 685L639.03 604L673.63 604Q690.52 604 699.9 611.87Q709.27 619.74 709.27 633.39L709.27 633.39Q709.27 642.42 704.93 648.95Q700.59 655.49 692.72 658.96L692.72 658.96L710.77 685L690.64 685L675.02 662.44Q674.56 662.44 674.09 662.44L674.09 662.44L657.78 662.44L657.78 685ZM657.78 619.27L657.78 647.51L673.05 647.51Q681.61 647.51 685.95 643.75Q690.29 639.99 690.29 633.39L690.29 633.39Q690.29 626.68 685.95 622.98Q681.61 619.27 673.05 619.27L673.05 619.27L657.78 619.27Z\"/><path class=\"it-l\" style=\"--k:5;--o:11.54\" d=\"M803.76 685L785.02 685L785.02 604L820.08 604Q830.84 604 838.76 607.53Q846.69 611.06 850.97 617.65Q855.25 624.25 855.25 633.39L855.25 633.39Q855.25 642.42 850.97 649.01Q846.69 655.61 838.76 659.14Q830.84 662.67 820.08 662.67L820.08 662.67L803.76 662.67L803.76 685ZM803.76 619.27L803.76 647.39L819.04 647.39Q827.6 647.39 831.94 643.69Q836.28 639.99 836.28 633.39L836.28 633.39Q836.28 626.68 831.94 622.98Q827.6 619.27 819.04 619.27L819.04 619.27L803.76 619.27Z\"/><path class=\"it-l\" style=\"--k:6;--o:29.1\" d=\"M949.4 685L930.65 685L930.65 604L965.25 604Q982.14 604 991.52 611.87Q1000.89 619.74 1000.89 633.39L1000.89 633.39Q1000.89 642.42 996.55 648.95Q992.21 655.49 984.34 658.96L984.34 658.96L1002.39 685L982.26 685L966.64 662.44Q966.18 662.44 965.71 662.44L965.71 662.44L949.4 662.44L949.4 685ZM949.4 619.27L949.4 647.51L964.67 647.51Q973.23 647.51 977.57 643.75Q981.91 639.99 981.91 633.39L981.91 633.39Q981.91 626.68 977.57 622.98Q973.23 619.27 964.67 619.27L964.67 619.27L949.4 619.27Z\"/><path class=\"it-l\" style=\"--k:7;--o:43.44\" d=\"M1095.38 685L1076.64 685L1076.64 604L1095.38 604L1095.38 685Z\"/><path class=\"it-l\" style=\"--k:8;--o:57.46\" d=\"M1202.14 686.39L1202.14 686.39Q1192.42 686.39 1183.51 683.79Q1174.6 681.18 1169.16 677.02L1169.16 677.02L1175.52 662.9Q1180.61 666.6 1187.79 668.97Q1194.96 671.35 1202.25 671.35L1202.25 671.35Q1210.58 671.35 1214.23 668.92Q1217.87 666.49 1217.87 662.67L1217.87 662.67Q1217.87 659.43 1215.33 657.52Q1212.78 655.61 1208.56 654.39Q1204.34 653.18 1199.36 652.08Q1194.38 650.98 1189.35 649.42Q1184.32 647.86 1180.09 645.25Q1175.87 642.65 1173.32 638.42Q1170.78 634.2 1170.78 627.84L1170.78 627.84Q1170.78 620.89 1174.54 615.17Q1178.3 609.44 1185.88 606.03Q1193.46 602.61 1204.91 602.61L1204.91 602.61Q1212.55 602.61 1219.96 604.46Q1227.36 606.31 1233.03 609.79L1233.03 609.79L1227.25 624.02Q1221.58 620.78 1215.85 619.22Q1210.12 617.65 1204.8 617.65L1204.8 617.65Q1196.47 617.65 1192.94 620.37Q1189.41 623.09 1189.41 626.91L1189.41 626.91Q1189.41 630.04 1191.95 631.94Q1194.5 633.85 1198.67 635.07Q1202.83 636.28 1207.87 637.33Q1212.9 638.37 1217.93 639.93Q1222.97 641.49 1227.19 644.04Q1231.41 646.58 1233.96 650.75Q1236.5 654.91 1236.5 661.28L1236.5 661.28Q1236.5 668.11 1232.74 673.78Q1228.98 679.45 1221.35 682.92Q1213.71 686.39 1202.14 686.39Z\"/><path class=\"it-l\" style=\"--k:9;--o:74.12\" d=\"M1373 685L1310.28 685L1310.28 604L1371.5 604L1371.5 619.04L1328.91 619.04L1328.91 636.63L1366.52 636.63L1366.52 651.21L1328.91 651.21L1328.91 669.96L1373 669.96L1373 685Z\"/></g></svg></div></div><i class=\"it-aro\"></i>";
  /*PALCO:FIM*/

  var GROW = 400;                       /* o mapa, o horizonte e a semente abrem sozinhos; o T começa 0,4 s depois */
  var TOTAL = 2400;                     /* do T até o amanhecer (0,4 + 2,4 = 2,8 s; a saída dura 0,6 s) */
  var WAIT = 1200;                     /* tolerância, em cada etapa, para a página terminar de montar */
  var SEGURANCA = 4400;                 /* trava, contada do início da animação (num celular lento a montagem atrasa o começo);
                                           folga de 1 s sobre o roteiro de 3,4 s */
  var done = false, playing = false, pending = null, timers = [];
  /* página montada: vira o fonts.ready depois do DOMContentLoaded (o site.js liga tudo nesse evento) */
  var gate = document.readyState !== "loading" ? fontsNow() : null;
  var intro = null, theme = document.querySelector('meta[name="theme-color"]'), themeWas = theme && theme.content, themeMine = null;
  var mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  var SCROLL_KEYS = { " ":1, PageDown:1, PageUp:1, ArrowDown:1, ArrowUp:1, End:1, Home:1 };

  /* "open" = fim natural · "skip" = saída rápida · "now" = some na hora */
  function finish(mode){
    if(done) return;
    done = true;
    timers.forEach(clearTimeout);
    document.removeEventListener("keydown", onKey, true);
    document.removeEventListener("wheel", onGesture, true);
    document.removeEventListener("touchstart", onGesture, true);
    document.removeEventListener("pointerdown", onGesture, true);
    document.removeEventListener("visibilitychange", onHidden);
    document.removeEventListener("DOMContentLoaded", onBoot);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    if(mq && mq.removeEventListener) mq.removeEventListener("change", onMotion);
    if(theme && theme.content === themeMine) theme.content = themeWas;   /* só devolve se ninguém trocou no meio */
    root.classList.remove("intro-active");                               /* a página (pausada) começa a entrar agora */
    if(!intro || mode === "now"){ if(intro) intro.remove(); return; }
    root.classList.add("intro-leaving");
    intro.classList.add("is-leaving");                                   /* segue capturando cliques até sair do DOM */
    if(mode === "skip") intro.classList.add("is-skipping");
    mede();
    setTimeout(function(){ intro.remove(); }, mode === "skip" ? 400 : 660);
    setTimeout(function(){ root.classList.remove("intro-leaving"); }, 1600);
  }
  /* o amanhecer abre da semente: centro e raio medidos no palco real (o intro.css tem uma conta de reserva) */
  function mede(){
    var m = intro.querySelector(".it-marca"), r = m && m.getBoundingClientRect();
    if(!r || !r.width) return;
    var x = r.left + r.width * 257.5 / 1373, y = r.top + r.height * 342 / 687, w = innerWidth, h = innerHeight;
    intro.style.setProperty("--it-ix", x.toFixed(1) + "px");
    intro.style.setProperty("--it-iy", y.toFixed(1) + "px");
    intro.style.setProperty("--it-raio", Math.ceil(Math.sqrt(Math.pow(Math.max(x, w - x), 2) + Math.pow(Math.max(y, h - y), 2)) + 60) + "px");
  }
  /* curvas de nível do "mapa do drone": 12 níveis (0,1 a 0,925) de um relevo com um morro principal sob a logo,
     três menores nos cantos e uma ondulação suave, por marching squares numa grade que cobre o que qualquer tela
     mostra (1000 unidades = o mapa: a logo, ou 62vh num celular em pé; origem na semente). A cada cinco, uma
     curva mestra, como nas cartas topográficas. Morros (gaussianas) e ondulação (senos) se separam em x e y, então
     cada ponto da grade custa só multiplicações; cada célula só visita os níveis que passam por ela. */
  var X0 = -2000, Y0 = -1100, P = 26, NX = 170, NY = 85, NIVEIS = 12;
  var MORROS = [[280, -30, 620, 400, 1], [1250, 760, 380, 300, .8], [-700, -820, 360, 280, .62], [1700, -760, 320, 260, .5]];
  var CASOS = ["", "32", "21", "31", "01", "3021", "02", "30", "30", "02", "0132", "01", "31", "21", "32"];
  var trechos = null;   /* por nível: x1, y1, x2, y2, x1, y1, … */
  function calculaCurvas(){
    var W1 = NX + 1, h = new Float64Array(W1 * (NY + 1)), gx = [], gy = [], ox = [], oy = [], i, j, m, v, x, y;
    for(i = 0; i < W1; i++){
      x = X0 + i * P; gx.push(MORROS.map(function(o){ var u = (x - o[0]) / o[2]; return Math.exp(-u * u / 2); }));
      ox.push([Math.sin(x / 160 + 1.3), Math.sin(x / 110 + .7), Math.cos(x / 110 + .7)]);
    }
    for(j = 0; j <= NY; j++){
      y = Y0 + j * P; gy.push(MORROS.map(function(o){ var u = (y - o[1]) / o[3]; return o[4] * Math.exp(-u * u / 2); }));
      oy.push([Math.cos(y / 190 - .4), Math.cos(y / 110), Math.sin(y / 110)]);
    }
    for(j = 0; j <= NY; j++) for(i = 0; i < W1; i++){
      /* .045·sen(x/160+1,3)·cos(y/190−0,4) + .03·sen((x−y)/110+0,7), com o seno da diferença aberto */
      v = .045 * ox[i][0] * oy[j][0] + .03 * (ox[i][1] * oy[j][1] - ox[i][2] * oy[j][2]);
      for(m = 0; m < 4; m++) v += gx[i][m] * gy[j][m];
      h[j * W1 + i] = v;
    }
    trechos = [];
    for(m = 0; m < NIVEIS; m++) trechos.push([]);
    var a, b, cc, dd, k, k1, L, c, e, t;
    function borda(n){   /* ponto da curva na aresta n (0 cima, 1 direita, 2 baixo, 3 esquerda) da célula */
      if(n === 0) t.push(x + P * (L - a) / (b - a), y);
      else if(n === 1) t.push(x + P, y + P * (L - b) / (cc - b));
      else if(n === 2) t.push(x + P * (L - dd) / (cc - dd), y + P);
      else t.push(x, y + P * (L - a) / (dd - a));
    }
    for(j = 0; j < NY; j++) for(i = 0; i < NX; i++){
      a = h[j * W1 + i]; b = h[j * W1 + i + 1]; cc = h[(j + 1) * W1 + i + 1]; dd = h[(j + 1) * W1 + i];
      k = Math.max(0, Math.ceil((Math.min(a, b, cc, dd) - .1) / .075));
      k1 = Math.min(NIVEIS - 1, Math.floor((Math.max(a, b, cc, dd) - .1) / .075));
      for(; k <= k1; k++){
        L = .1 + k * .075;
        c = CASOS[(a > L ? 8 : 0) | (b > L ? 4 : 0) | (cc > L ? 2 : 0) | (dd > L ? 1 : 0)];
        if(!c) continue;
        x = X0 + i * P; y = Y0 + j * P; t = trechos[k];
        for(e = 0; e < c.length; e++) borda(+c[e]);
      }
    }
  }
  /* o mapa vira bitmap uma vez (canvas) e só a imagem anima: como SVG, os milhares de trechos eram repintados
     a cada quadro e derrubavam a abertura para 10–30 quadros/s */
  var mapaPronto = false;
  function desenhaMapa(){
    if(!trechos) calculaCurvas();
    mapaPronto = true;
    var m = intro.querySelector(".it-marca"), r = m.getBoundingClientRect(), w = innerWidth, h = innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2), iw = r.width, mapa = Math.max(iw, h * .62), u = mapa / 1000;
    var sx = r.left + iw * 257.5 / 1373, sy = r.top + r.height * 342 / 687;   /* a semente */
    var cor = getComputedStyle(root).getPropertyValue("--folha").trim() || "#7BC47F";
    [].forEach.call(intro.querySelectorAll("canvas[data-curvas]"), function(cv){
      var f = cv.getAttribute("data-curvas").split(" "), ctx = cv.getContext("2d"), longe = f[0] === "0", k, n, t, mestra, g;
      if(!ctx) return;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr * u, 0, 0, dpr * u, sx * dpr, sy * dpr);
      ctx.strokeStyle = cor; ctx.lineCap = "round";
      for(k = +f[0]; k < +f[1]; k++){
        mestra = k % 5 === 4;
        ctx.globalAlpha = longe ? (mestra ? .42 : .24) : (mestra ? .5 : .3);
        ctx.lineWidth = (mestra ? 1.9 : 1.25) / u;           /* 1,25 px de tela (mestra: 1,9 px) */
        ctx.beginPath(); t = trechos[k];
        for(n = 0; n < t.length; n += 4){ ctx.moveTo(t[n], t[n + 1]); ctx.lineTo(t[n + 2], t[n + 3]); }
        ctx.stroke();
      }
      /* abre espaço para a logo: apaga as curvas perto dela, com borda suave */
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "destination-out";
      ctx.setTransform(dpr * iw * .64, 0, 0, dpr * iw * .37, (r.left + iw / 2) * dpr, (r.top + r.height / 2) * dpr);
      g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, "#000"); g.addColorStop(.58, "#000"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(-1, -1, 2, 2);
      ctx.globalCompositeOperation = "source-over";
    });
  }
  function mapa(){ if(!mapaPronto && !done) try{ desenhaMapa(); }catch(e){ mapaPronto = true; } }
  var redesenho = 0;
  function onResize(){ cancelAnimationFrame(redesenho); redesenho = requestAnimationFrame(desenhaMapa); }
  function onKey(e){
    if(e.key === "Tab") finish("now");                                   /* o Tab segue para o "Pular para o conteúdo" */
    else if(e.key === "Escape" || e.key === "Enter") finish("skip");
    else if(SCROLL_KEYS[e.key]){ e.preventDefault(); finish("skip"); }
  }
  function onGesture(e){
    if(e.type === "pointerdown" && e.pointerType === "touch") return;   /* o toque já chega por touchstart */
    if(e.cancelable && e.type !== "pointerdown"){
      e.preventDefault();                                                /* o gesto que pula não rola a página escondida */
      e.stopPropagation();                                               /* nem chega ao Lenis */
    }
    finish("skip");
  }
  function onScroll(){ if((window.pageYOffset || 0) > 0) finish("skip"); } /* barra de rolagem, restauração do histórico */
  function onHidden(){ if(document.hidden) finish("now"); }
  function onMotion(){ if(mq.matches) finish("now"); }
  function fontsNow(){ return (document.fonts && document.fonts.ready) || true; }
  /* o site.js monta a página no DOMContentLoaded, logo depois deste handler; no quadro seguinte o
     fonts.ready já é o que ele usou para quebrar o H1 */
  function onBoot(){ requestAnimationFrame(function(){ gate = fontsNow(); if(pending) pending(); }); }
  /* roda fn com a página montada e pintada (e, com fonts, com a Montserrat carregada): a montagem do site.js
     e o primeiro ScrollTrigger.refresh são tarefas longas que travariam o traço em SVG; se demorar mais que WAIT,
     roda mesmo assim */
  function whenBooted(fn, fonts){
    var called = false;
    function go(){ if(!called && !done){ called = true; pending = null; fn(); } }
    function frames(){ requestAnimationFrame(function(){ requestAnimationFrame(go); }); }
    function settle(){ if(fonts && gate.then) gate.then(frames, frames); else frames(); }
    if(gate) settle(); else pending = settle;
    timers.push(setTimeout(go, WAIT));
  }
  function play(){
    if(done || playing) return;
    playing = true;
    mapa();                                 /* se o rAF não rodou (aba em segundo plano), desenha agora */
    intro.classList.add("is-playing");      /* mapa, horizonte, luz e semente: só compositor, tocam mesmo com o site montando */
    timers.push(setTimeout(function(){ whenBooted(grow, true); }, GROW));
    timers.push(setTimeout(function(){ finish("skip"); }, SEGURANCA));
  }
  function grow(){
    intro.classList.add("is-growing");
    timers.push(setTimeout(function(){ whenBooted(function(){ finish("open"); }); }, TOTAL));
  }

  try{
    if(performance.now() > 3000 || (window.pageYOffset || 0) > 0) throw new Error("tarde");  /* a pessoa já está usando a página */
    try{ sessionStorage.setItem("tca-intro", "1"); }catch(e){}            /* gravado no começo: recarregar no meio não repete */
    intro = document.createElement("div");
    intro.className = "intro";
    intro.id = "intro";
    intro.setAttribute("aria-hidden", "true");
    intro.innerHTML = PALCO;
    var me = document.currentScript;
    if(me && me.parentNode) me.parentNode.insertBefore(intro, me.nextSibling); else document.body.appendChild(intro);
    /* sem o CSS da abertura (folha antiga em cache ou que não carregou), não há abertura */
    if(!PALCO || getComputedStyle(intro).position !== "fixed"){ finish("now"); return; }
    window.addEventListener("resize", onResize);
    /* a barra do navegador acompanha o fundo durante a abertura */
    if(theme) themeMine = theme.content = getComputedStyle(root).getPropertyValue("--floresta-funda").trim() || "#0A2A20";
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("wheel", onGesture, { capture:true, passive:false });
    document.addEventListener("touchstart", onGesture, { capture:true, passive:false });
    document.addEventListener("pointerdown", onGesture, true);
    document.addEventListener("visibilitychange", onHidden);
    document.addEventListener("DOMContentLoaded", onBoot);
    window.addEventListener("scroll", onScroll, { passive:true });
    if(mq && mq.addEventListener) mq.addEventListener("change", onMotion);
    /* duas pinturas antes de animar; o timer cobre abas em que o rAF não roda */
    /* o mapa (cenário: se o canvas falhar, a abertura segue sem ele) é desenhado entre as duas pinturas, sem atrasar
       a primeira; o canvas nasce transparente e só aparece a partir de 0,1 s */
    requestAnimationFrame(function(){ mapa(); requestAnimationFrame(play); });
    timers.push(setTimeout(play, 250));
  }catch(err){
    finish("now");
  }
})();
