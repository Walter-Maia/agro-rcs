/* ------------------------------------------------------------
   TcaEnterprise — broto.js v0.6.2
   O hero: o broto da marca modelado em 3D (WebGL puro, sem biblioteca) sobre a foto do campo ao anoitecer,
   num palco preso à tela. A rolagem é a linha do tempo, em três quadros:
     0 capa ....... texto à esquerda (em pé: embaixo), o broto no espaço que o texto deixa livre, balançando
                    devagar (arrastar com o mouse gira); ao fundo, o campo em curvas de nível
     1 de cima .... a câmera sobe: as folhas viram hélice sobre as curvas de nível e a foto passa para o campo
                    visto de cima
     2 entrega .... o broto volta de frente e encolhe até o T da logo do cabeçalho, que reaparece no lugar dele;
                    junto, a faixa de solo e os serviços sobem por cima do palco, como uma folha ("cortina")
   O lugar e o tamanho do broto em cada quadro saem do layout (medirLugares): o espaço livre ao lado do texto
   (em pé: acima dele), o espaço acima da frase do quadro 1 e a posição real da logo do cabeçalho. Assim ele
   cabe em qualquer largura e altura de tela, sem números mágicos por resolução.
   Estilo (v0.6.1, "porcelana e ouro"): uma pequena escultura de pé sobre o mapa de curvas de nível. Caule de
   porcelana Algodão que afina para cima, botão em gota, folhas em concha com fio de ouro na borda, nervura de
   ouro e veias gravadas, raízes curvas que viram ouro até os anéis (um fio fino) e uma semente de ouro na junção.
   O esmalte e o ouro refletem o mesmo ambiente da foto (chão verde, horizonte dourado, céu escuro).
   O broto nasce na ordem em que uma planta nasce: a semente, o brilho e as curvas do chão, raízes, anéis, caule
   de baixo para cima, o botão e, com o caule firme, as duas folhas se abrindo. Depois, só respira de leve, e a
   cada 7 s um pulso de luz sobe dos anéis às folhas (a história da abertura: a tecnologia está na raiz).
   Com o menu aberto (evento tca:menu do site.js), o laço para: o véu cobre o palco.
   Sem WebGL: a logo negativa em <img>. Movimento reduzido (html.rm): o broto pronto e parado, e o hero vira
   uma tela só, sem rolagem presa e sem cortina.
------------------------------------------------------------ */
(function () {
  'use strict';
  var secao = document.querySelector('[data-broto]');
  if (!secao) return;
  var root = document.documentElement;
  var palco = secao.querySelector('.broto__palco');
  var tela = secao.querySelector('.broto__tela');
  var luz = secao.querySelector('.broto__luz');
  var fundo = secao.querySelector('.broto__fundo');
  var fotoCima = secao.querySelector('.broto__foto--cima');
  var veu = secao.querySelector('.broto__veu');
  /* o sol: o halo (livre) e o corpo (disco e raios, recortados pelas colinas) descem juntos */
  var ceu = secao.querySelector('.broto__ceu'), solHalo = secao.querySelector('.sol--halo'), solCorpo = secao.querySelector('.sol--corpo'), descidaSol = 0;
  var texto = secao.querySelector('.broto__texto');
  var blocoCima = secao.querySelector('.broto__cima');
  var cortina = secao.nextElementSibling;
  var topo = document.querySelector('.topo');
  var barra = topo && topo.querySelector('.topo__barra');
  var marca = topo && topo.querySelector('.marca');
  /* o mesmo corte do site.css: em pé (retrato, ou tela estreita), o broto vai para cima do texto */
  var mqEmPe = matchMedia('(orientation: portrait), (max-width: 639.98px)');
  var mqFino = matchMedia('(hover: hover) and (pointer: fine)');
  function reduzido() { return root.classList.contains('rm'); }
  function limitar(x) { return x <= 0 ? 0 : x >= 1 ? 1 : x; }
  function suave(a, b, x) { var t = limitar((x - a) / (b - a)); return t * t * (3 - 2 * t); }
  function vaivem(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ---------- vetores ---------- */
  function soma(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function dif(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function esc(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
  function pe(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function vet(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function uni(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

  /* ---------- geometria: "porcelana e ouro" (v0.6.1) ----------
     O broto é uma pequena escultura de pé sobre o mapa: caule de porcelana que afina para cima, botão em
     gota, duas folhas em concha (com fio de ouro na borda, nervura e veias gravadas), três raízes curvas que
     viram ouro até os anéis (um fio fino, deitado no chão) e uma semente de ouro na junção. O chão (brilho e
     curvas de nível) fica na altura dos anéis.
     Unidades: 1 ≈ 182 unidades do viewBox do logo. A junção das raízes fica na origem; o botão, em y ~1,28.
     Vértice: posição 3, normal 3, aux 4 (s ao longo da peça, tipo, início e duração do crescimento), lado 1, extra 1.
     Tipos: 0 caule · 1 folha · 2 anel · 3 botão · 4 curva do chão · 5 brilho do chão · 6 raiz · 7 semente.
     extra: na folha, a posição na largura (−1 a 1, 0 na nervura); na curva do chão, a opacidade; no brilho,
     a distância ao centro (0 a 1). */
  var NO_Y = 1.28, CORACAO = [0, 0.62, 0], ESCALA_LOGO = 182, CHAO_Y = -0.655;
  var dados = [], indices = [], nv = 0;
  function vertice(p, n, s, tipo, ini, dur, lado, extra) {
    dados.push(p[0], p[1], p[2], n[0], n[1], n[2], s, tipo, ini, dur, lado, extra || 0);
    return nv++;
  }
  /* tubo sobre um referencial de transporte paralelo (não torce); fechado = anel */
  function tubo(pts, raio, lados, tipo, ini, dur, fechado, extra) {
    var n = pts.length, N = null, aneis = [], i, k;
    function tangente(i) {
      var a = pts[fechado ? (i - 1 + n) % n : Math.max(i - 1, 0)], b = pts[fechado ? (i + 1) % n : Math.min(i + 1, n - 1)];
      return uni(dif(b, a));
    }
    for (i = 0; i <= (fechado ? n : n - 1); i++) {
      var j = i % n, s = i / (fechado ? n : n - 1), T = tangente(j);
      if (!N) N = uni(vet(T, Math.abs(T[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]));
      N = uni(dif(N, esc(T, pe(N, T))));
      var B = vet(T, N), r = raio(s);
      aneis.push(nv);
      for (k = 0; k <= lados; k++) {
        var a = (k / lados) * Math.PI * 2, nr = soma(esc(N, Math.cos(a)), esc(B, Math.sin(a)));
        vertice(soma(pts[j], esc(nr, r)), nr, s, tipo, ini, dur, 0, extra);
      }
    }
    for (i = 0; i < aneis.length - 1; i++) {
      for (k = 0; k < lados; k++) {
        var p = aneis[i] + k, q = aneis[i + 1] + k;
        indices.push(p, p + 1, q, p + 1, q + 1, q);
      }
    }
  }
  function bez(P0, P1, P2, P3, t) {
    var u = 1 - t;
    return soma(soma(esc(P0, u * u * u), esc(P1, 3 * u * u * t)), soma(esc(P2, 3 * u * t * t), esc(P3, t * t * t)));
  }
  function curva(P0, P1, P2, P3, m) { var pts = []; for (var i = 0; i <= m; i++) pts.push(bez(P0, P1, P2, P3, i / m)); return pts; }
  function reta(a, b, m) { var pts = []; for (var i = 0; i <= m; i++) pts.push(soma(a, esc(dif(b, a), i / m))); return pts; }
  /* esfera (ou gota) como um tubo vertical de raio variável */
  function gota(c, alt, raio, lados, tipo, ini, dur) {
    tubo(reta(soma(c, [0, -alt / 2, 0]), soma(c, [0, alt / 2, 0]), 20), raio, lados, tipo, ini, dur, false);
  }
  /* folha: uma superfície em grade (48 × 12) com a forma do logo (sai do botão na horizontal e sobe na ponta),
     em concha (as bordas sobem para a frente), torcida como uma pá de hélice; as normais vêm da própria grade */
  function folha(lado) {
    var P0 = [lado * 0.07, 1.3, 0], P1 = [lado * 0.52, 1.18, 0.03], P2 = [lado * 1.04, 1.34, 0.05], P3 = [lado * 1.4, 1.9, 0];
    var n = 48, m = 12, grade = [], i, j;
    for (i = 0; i <= n; i++) {
      var s = i / n, p = bez(P0, P1, P2, P3, s);
      var T = uni(dif(bez(P0, P1, P2, P3, Math.min(1, s + 0.01)), bez(P0, P1, P2, P3, Math.max(0, s - 0.01))));
      var W = uni(vet(T, [0, 0, 1])), N = vet(W, T);
      var giro = (0.1 + 0.42 * s) * lado;          /* passo de hélice */
      var W2 = soma(esc(W, Math.cos(giro)), esc(N, Math.sin(giro)));
      N = uni(vet(W2, T)); W = W2;
      /* mais larga perto de 40 % do comprimento, ponta fina */
      var larg = 0.3 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.72)), 0.85) + 0.01;
      var linha = [];
      for (j = 0; j <= m; j++) {
        var u = (j / m) * 2 - 1;
        var concha = 0.085 * (larg / 0.3) * u * u - 0.015 * Math.sin(Math.PI * s);
        linha.push(soma(soma(p, esc(W, u * larg)), esc(N, concha)));
      }
      grade.push(linha);
    }
    var base = nv;
    for (i = 0; i <= n; i++) {
      for (j = 0; j <= m; j++) {
        var a = grade[Math.max(0, i - 1)][j], b = grade[Math.min(n, i + 1)][j];
        var c = grade[i][Math.max(0, j - 1)], d = grade[i][Math.min(m, j + 1)];
        vertice(grade[i][j], uni(vet(dif(d, c), dif(b, a))), i / n, 1, 0.52, 0.3, lado, (j / m) * 2 - 1);
      }
    }
    for (i = 0; i < n; i++) {
      for (j = 0; j < m; j++) {
        var q = base + i * (m + 1) + j;
        indices.push(q, q + 1, q + m + 1, q + 1, q + m + 2, q + m + 1);
      }
    }
  }

  /* o chão vem primeiro no buffer: é desenhado num passe próprio, translúcido e sem escrever profundidade */
  /* brilho do chão: um disco em leque, Trigo no centro, que some para fora (a luz que vem das raízes) */
  (function () {
    var centro = vertice([0, CHAO_Y, 0], [0, 1, 0], 0, 5, 0, 0.5, 0, 0), m = 64, R = 1.55;
    for (var k = 0; k <= m; k++) {
      var a = (k / m) * Math.PI * 2;
      vertice([R * Math.cos(a), CHAO_Y, R * Math.sin(a)], [0, 1, 0], 0, 5, 0, 0.5, 0, 1);
      if (k) indices.push(centro, centro + k, centro + k + 1);
    }
  })();
  /* curvas de nível no chão, levemente onduladas, como num mapa; cada uma mais fraca que a de dentro */
  [[0.5, 0.36], [0.98, 0.26], [1.42, 0.16], [1.86, 0.07]].forEach(function (c, i) {
    var R = c[0], pts = [];
    for (var k = 0; k < 140; k++) {
      var a = (k / 140) * Math.PI * 2;
      var r = R * (1 + 0.06 * Math.sin(3 * a + i) + 0.035 * Math.sin(5 * a + 2 * i));
      pts.push([r * Math.cos(a), CHAO_Y - 0.005, r * Math.sin(a)]);
    }
    tubo(pts, function () { return 0.006; }, 5, 4, i * 0.05, 0.45, true, c[1]);
  });
  var nChao = indices.length;

  /* semente: uma conta de ouro na junção, a primeira coisa a aparecer (como na abertura) */
  gota([0, 0, 0], 0.2, function (s) { return 0.1 * Math.sqrt(Math.sin(Math.PI * s)) + 0.001; }, 22, 7, 0, 0.06);
  /* raízes: três a 120°, curvas, afinando; descem da junção até o chão e viram ouro antes do anel.
     De frente, a raiz que vem para a câmera é a do meio do logo */
  [0, 1, 2].forEach(function (i) {
    var th = Math.PI / 2 + (i * 2 * Math.PI) / 3, rad = [Math.cos(th), 0, Math.sin(th)];
    var R = 0.13, alcance = 0.6, y = CHAO_Y + 0.03;
    var P3 = soma(esc(rad, alcance), [0, y, 0]);
    tubo(curva([0, 0, 0], soma(esc(rad, 0.05), [0, -0.3, 0]), soma(esc(rad, 0.36), [0, y + 0.04, 0]), P3, 30),
      function (s) { return 0.044 - 0.02 * s; }, 14, 6, 0.04 + i * 0.03, 0.26, false);
    /* anel: um fio de ouro deitado no chão, que começa onde a raiz chega */
    var c = soma(esc(rad, alcance + R), [0, y, 0]), pts = [];
    for (var k = 0; k < 72; k++) {
      var a = th + Math.PI + (k / 72) * Math.PI * 2;
      pts.push([c[0] + R * Math.cos(a), c[1], c[2] + R * Math.sin(a)]);
    }
    tubo(pts, function () { return 0.024; }, 12, 2, 0.27 + i * 0.03, 0.22, true);
  });
  /* caule: afina para cima, alarga um pouco ao sair da semente e tem uma curva quase imperceptível */
  tubo(curva([0, 0.02, 0], [0, 0.42, 0], [0.025, 0.84, 0], [0, 1.16, 0], 40),
    function (s) { return 0.052 - 0.014 * s + 0.016 * Math.pow(1 - s, 8); }, 18, 0, 0.18, 0.3, false);
  /* botão: uma gota onde as folhas nascem */
  gota([0, NO_Y, 0], 0.32, function (s) { return 0.105 * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * s)), 0.7) + 0.002; }, 20, 3, 0.46, 0.08);
  folha(-1);
  folha(1);
  var malha = { dados: new Float32Array(dados), indices: new Uint16Array(indices) };
  var raioBroto = 0;
  for (var i = 0; i < dados.length; i += 12) {
    if (dados[i + 7] > 3.5 && dados[i + 7] < 5.5) continue;   /* o chão não conta */
    raioBroto = Math.max(raioBroto, Math.hypot(dados[i] - CORACAO[0], dados[i + 1] - CORACAO[1], dados[i + 2] - CORACAO[2]));
  }

  /* ---------- quadros ----------
     giro: volta do broto no próprio eixo · alt: altura da câmera em graus (+90 = de cima).
     O lugar (centro e raio em px no palco) de cada quadro vem de medirLugares(). */
  var QUADROS = [{ giro: 0.35, alt: 16 }, { giro: 2.1, alt: 52 }, { giro: 3.7, alt: 12 }];
  var N_QUADROS = QUADROS.length, PAUSA = 0.32;
  var lugares = [{ x: 0, y: 0, r: 1 }, { x: 0, y: 0, r: 1 }, { x: 0, y: 0, r: 1 }];
  function quadro(c) {
    var i = Math.max(0, Math.min(N_QUADROS - 1, Math.floor(c))), j = Math.min(N_QUADROS - 1, i + 1), f = c - i;
    var a = QUADROS[i], b = QUADROS[j], la = lugares[i], lb = lugares[j];
    return {
      giro: a.giro + (b.giro - a.giro) * f, alt: a.alt + (b.alt - a.alt) * f,
      x: la.x + (lb.x - la.x) * f, y: la.y + (lb.y - la.y) * f,
      /* o raio interpola em escala logarítmica: encolher até a logo fica uniforme, sem "despencar" no fim */
      r: la.r * Math.pow(lb.r / la.r, f)
    };
  }
  /* progresso da rolagem → coordenada de quadro 0..2, com pausa em cada um para ler */
  function coordenada(p) {
    var t = limitar(p) * (N_QUADROS - 1), i = Math.min(Math.floor(t), N_QUADROS - 2), h = PAUSA / 2;
    return i + vaivem(limitar((t - i - h) / (1 - 2 * h)));
  }
  /* presença de um elemento do quadro `cena` na coordenada c; `atraso` escalona a entrada e a saída */
  function presenca(c, cena, atraso) {
    var d = c - cena, lag = d < 0 ? atraso : 1 - atraso;
    return limitar((0.6 - Math.abs(d) - lag * 0.2) / 0.25);
  }

  /* ---------- matrizes (coluna maior) ---------- */
  function perspectiva(fov, asp, perto, longe) {
    var f = 1 / Math.tan(fov / 2), m = new Float32Array(16);
    m[0] = f / asp; m[5] = f; m[10] = (longe + perto) / (perto - longe); m[11] = -1; m[14] = (2 * longe * perto) / (perto - longe);
    return m;
  }
  function olharPara(olho, alvo) {
    var z = uni(dif(olho, alvo)), x = uni(vet([0, 1, 0], z)), y = vet(z, x), m = new Float32Array(16);
    m[0] = x[0]; m[4] = x[1]; m[8] = x[2]; m[1] = y[0]; m[5] = y[1]; m[9] = y[2]; m[2] = z[0]; m[6] = z[1]; m[10] = z[2];
    m[12] = -pe(x, olho); m[13] = -pe(y, olho); m[14] = -pe(z, olho); m[15] = 1;
    return m;
  }
  function vezes(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }
  function girarY(t) { var c = Math.cos(t), s = Math.sin(t); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); }
  function girarX(t) { var c = Math.cos(t), s = Math.sin(t); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); }

  /* ---------- shaders ---------- */
  var VERT = [
    'attribute vec3 a_pos; attribute vec3 a_nrm; attribute vec4 a_aux; attribute float a_lado; attribute float a_extra;',
    'uniform mat4 u_vp; uniform mat4 u_model; uniform vec2 u_offset; uniform float u_cresce; uniform float u_tempo; uniform float u_vivo;',
    'varying vec3 v_n; varying vec3 v_w; varying float v_s; varying float v_g; varying float v_tipo; varying float v_extra;',
    'vec3 girarZ(vec3 p, vec3 c, float a) { vec3 q = p - c; float cs = cos(a), sn = sin(a); return c + vec3(q.x * cs - q.y * sn, q.x * sn + q.y * cs, q.z); }',
    'void main() {',
    '  vec3 p = a_pos; vec3 n = a_nrm; float tipo = a_aux.y;',
    '  float g = clamp((u_cresce - a_aux.z) / a_aux.w, 0.0, 1.0);',
    '  g = 1.0 - pow(1.0 - g, 3.0);',
    '  if (tipo > 0.5 && tipo < 1.5) {',
    /* a folha sai dobrada para cima, rente ao caule, e abre a partir do botão com uma mola curta; depois só
       respira (as duas fora de fase) */
    '    float x = clamp((u_cresce - a_aux.z) / (a_aux.w * 1.5), 0.0, 1.0);',
    '    float k = x - 1.0; float abre = 1.0 + 2.2 * k * k * k + 1.2 * k * k;',
    '    float ang = (1.0 - abre) * a_lado * 1.05 + u_vivo * a_lado * 0.035 * sin(u_tempo * 1.1 + a_lado * 0.9);',
    '    p = girarZ(p, vec3(0.0, ' + NO_Y.toFixed(2) + ', 0.0), ang); n = girarZ(n, vec3(0.0), ang);',
    '  }',
    /* o brilho do chão abre do centro para fora */
    '  if (tipo > 4.5 && tipo < 5.5) p.xz *= 0.5 + 0.5 * g;',
    '  vec4 w = u_model * vec4(p, 1.0);',
    '  v_w = w.xyz; v_n = (u_model * vec4(n, 0.0)).xyz; v_s = a_aux.x; v_g = g; v_tipo = tipo; v_extra = a_extra;',
    '  gl_Position = u_vp * w; gl_Position.xy += u_offset * gl_Position.w;',
    '}'
  ].join('\n');
  /* porcelana e ouro. A porcelana é Algodão com esmalte (reflete o ambiente: chão verde, horizonte dourado,
     céu escuro, o mesmo da foto), luz de lua pela frente e contraluz Trigo por trás, que vaza pelas folhas.
     O ouro reflete o mesmo ambiente com Fresnel. Nas folhas, o ouro é o fio da borda e a nervura; as veias são
     um entalhe leve. A cada 7 s um pulso de luz sobe: anéis → raízes → semente → caule → botão → folhas.
     Saída pré-multiplicada (o canvas compõe por cima da foto); tom ACES. */
  var FRAG = [
    'precision highp float;',
    'uniform vec3 u_olho; uniform float u_alfa; uniform float u_tempo; uniform float u_aceso; uniform float u_sol;',
    'varying vec3 v_n; varying vec3 v_w; varying float v_s; varying float v_g; varying float v_tipo; varying float v_extra;',
    'const vec3 ALGODAO = vec3(0.905, 0.879, 0.807);',
    'const vec3 TRIGO = vec3(0.584, 0.361, 0.02);',
    'const vec3 LUZ = vec3(1.0, 0.76, 0.34);',
    'vec3 ambiente(vec3 r) {',
    '  vec3 c = mix(vec3(0.014, 0.04, 0.028), vec3(0.025, 0.06, 0.055), smoothstep(-0.25, 0.35, r.y));',
    '  float faixa = exp(-pow((r.y - 0.05) / 0.14, 2.0));',
    '  float lh = length(r.xz); float sol = lh > 0.0001 ? 0.5 + 0.5 * dot(r.xz / lh, vec2(0.57, -0.82)) : 0.5;',
    '  return c + LUZ * faixa * (0.22 + 1.15 * sol * sol) * u_sol + vec3(0.07, 0.1, 0.09) * smoothstep(0.45, 1.0, r.y);',
    '}',
    'float pulso(float x, float c, float w) { float d = (x - c) / w; return exp(-d * d); }',
    'float fino(float x) {',
    '#ifdef DERIV',
    '  return fwidth(x);',
    '#else',
    '  return 0.015;',
    '#endif',
    '}',
    'void main() {',
    '  if (v_s > v_g + 0.0005) discard;',
    '  if (v_tipo > 4.5 && v_tipo < 5.5) {',
    /* brilho do chão: só soma luz (alfa 0) e respira devagar */
    '    float q = 1.0 - v_extra; float a = q * q * (0.13 + 0.03 * sin(u_tempo * 0.9)) * v_g * u_alfa;',
    '    gl_FragColor = vec4(LUZ * a, 0.0); return;',
    '  }',
    '  if (v_tipo > 3.5 && v_tipo < 4.5) {',
    '    float a = v_extra * u_alfa;',
    '    gl_FragColor = vec4(vec3(0.9, 0.78, 0.46) * a, a); return;',
    '  }',
    '  vec3 n = normalize(v_n); vec3 v = normalize(u_olho - v_w);',
    '  float costas = dot(n, v) < 0.0 ? 1.0 : 0.0;',
    '  n = mix(n, -n, costas);',
    '  float nv = max(dot(n, v), 0.0); vec3 r = reflect(-v, n); float fres = pow(1.0 - nv, 5.0);',
    '  vec3 L = normalize(vec3(-0.45, 0.85, 0.55));',     /* lua: de cima, à esquerda, pela frente */
    '  vec3 Lq = normalize(vec3(0.55, 0.25, -0.8));',     /* contraluz: o horizonte dourado atrás */
    '  float dif = max((dot(n, L) + 0.25) / 1.25, 0.0);',
    '  vec3 amb = mix(vec3(0.03, 0.065, 0.05), vec3(0.1, 0.14, 0.13), 0.5 + 0.5 * n.y);',
    '  float ao = mix(0.55, 1.0, smoothstep(' + (CHAO_Y).toFixed(2) + ', 0.7, v_w.y));',
    '  vec3 porc = ALGODAO * (amb + dif * 0.9) * ao;',
    '  porc += ambiente(r) * (0.03 + 0.42 * fres);',
    '  porc += TRIGO * pow(1.0 - nv, 2.5) * max(dot(n, Lq) + 0.35, 0.0) * 0.85 * u_sol;',
    '  vec3 F0 = vec3(0.98, 0.72, 0.3); vec3 F = F0 + (1.0 - F0) * fres;',
    '  float esp = pow(max(dot(n, normalize(L + v)), 0.0), 90.0);',
    '  vec3 ouro = ambiente(r) * F * 1.55 + F0 * (0.05 + 0.12 * dif) + vec3(1.0, 0.93, 0.78) * esp * 0.9;',
    '  float ciclo = mod(u_tempo, 7.0), m = 0.0, luz = 0.0;',
    '  if (v_tipo > 6.5) { m = 1.0; luz = pulso(ciclo, 1.2, 0.22); }',                                       /* semente */
    '  else if (v_tipo > 5.5) { m = smoothstep(0.55, 0.98, v_s); luz = pulso(v_s, 1.0 - ciclo / 1.1, 0.08) * step(ciclo, 1.35); }', /* raiz */
    '  else if (v_tipo > 1.5 && v_tipo < 2.5) { m = 1.0; luz = pulso(ciclo, 0.1, 0.25); }',                  /* anel */
    '  else if (v_tipo > 2.5) { luz = pulso(ciclo, 2.35, 0.22) * 0.5; }',                                    /* botão */
    '  else if (v_tipo < 0.5) { luz = pulso(v_s, (ciclo - 1.25) / 1.05, 0.07) * step(1.1, ciclo) * step(ciclo, 2.5); }', /* caule */
    '  else {',
    /* folha: fio de ouro na borda, nervura de ouro que afina, veias laterais como entalhe; a base mais funda
       e a luz do horizonte vazando por trás */
    '    float u = abs(v_extra), fu = fino(u);',
    '    float borda = smoothstep(0.9 - fu, 0.955, u);',
    '    float nerv = (1.0 - smoothstep(0.012, 0.012 + 1.5 * fu, u)) * (1.0 - 0.8 * v_s) * smoothstep(0.04, 0.16, v_s);',
    '    float x = v_s * 7.0 - u * 1.5 + 0.2, fx = fino(x), lat = abs(fract(x) - 0.5);',
    '    float veia = smoothstep(0.5 - 0.035 - fx, 0.5 - 0.035 + fx * 0.5, lat) * smoothstep(0.1, 0.22, u) * (1.0 - smoothstep(0.72, 0.86, u)) * smoothstep(0.1, 0.22, v_s) * (1.0 - smoothstep(0.82, 0.95, v_s));',
    '    porc *= (0.74 + 0.26 * smoothstep(0.0, 0.5, v_s)) * (0.9 + 0.1 * u) * (1.0 - 0.24 * veia);',
    '    porc += TRIGO * 1.1 * pow(max(dot(-v, Lq), 0.0), 3.0) * (0.3 + 0.7 * costas) * u_sol;',
    '    m = max(borda, nerv * 0.55);',
    '    luz = pulso(v_s, (ciclo - 2.4) / 1.1, 0.1) * (borda + nerv + veia * 0.6) * step(2.2, ciclo);',
    '  }',
    '  vec3 cor = mix(porc, ouro, m) + LUZ * luz * u_aceso * 1.3;',
    '  cor = (cor * (2.51 * cor + 0.03)) / (cor * (2.43 * cor + 0.59) + 0.14);',
    '  cor = pow(clamp(cor, 0.0, 1.0), vec3(1.0 / 2.2));',
    '  gl_FragColor = vec4(cor * u_alfa, u_alfa);',
    '}'
  ].join('\n');

  /* ---------- WebGL ---------- */
  var gl = null, prog = null, loc = {};
  function iniciarGL() {
    gl = tela.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'low-power' });
    if (!gl) return false;
    function compilar(tipo, src) {
      var sh = gl.createShader(tipo); gl.shaderSource(sh, src); gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    }
    /* as derivadas (fwidth) deixam os fios de ouro e as veias das folhas sem serrilhado em qualquer tamanho */
    var deriv = gl.getExtension('OES_standard_derivatives');
    var vs = compilar(gl.VERTEX_SHADER, VERT);
    var fs = compilar(gl.FRAGMENT_SHADER, (deriv ? '#extension GL_OES_standard_derivatives : enable\n#define DERIV 1\n' : '') + FRAG);
    if (!vs || !fs) return false;
    prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, malha.dados, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, malha.indices, gl.STATIC_DRAW);
    [['a_pos', 3, 0], ['a_nrm', 3, 3], ['a_aux', 4, 6], ['a_lado', 1, 10], ['a_extra', 1, 11]].forEach(function (a) {
      var l = gl.getAttribLocation(prog, a[0]);
      if (l < 0) return;
      gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, a[1], gl.FLOAT, false, 12 * 4, a[2] * 4);
    });
    ['u_vp', 'u_model', 'u_offset', 'u_cresce', 'u_tempo', 'u_vivo', 'u_olho', 'u_alfa', 'u_aceso', 'u_sol'].forEach(function (u) { loc[u] = gl.getUniformLocation(prog, u); });
    gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    return true;
  }
  if (!iniciarGL()) { gl = null; secao.classList.add('sem-3d'); }
  tela.addEventListener('webglcontextlost', function (e) { e.preventDefault(); gl = null; });
  tela.addEventListener('webglcontextrestored', function () { if (!iniciarGL()) gl = null; pedirQuadro(); });

  /* ---------- medidas ---------- */
  var W = 1, H = 1, dpr = 1, topoH = 76, emPe = false, topoSecao = 0, altSecao = 1, topoCortina0 = Infinity;
  function medir() {
    W = Math.max(1, palco.clientWidth); H = Math.max(1, palco.clientHeight);
    /* onde a seção e a cortina estão na página (só mudam com o tamanho da tela): o laço só desconta a rolagem.
       Ler o retângulo a cada quadro, depois de o GSAP escrever estilos, custava um recálculo de estilo a mais */
    var y = window.scrollY || 0;
    topoSecao = secao.getBoundingClientRect().top + y; altSecao = secao.offsetHeight;
    topoCortina0 = cortina ? cortina.getBoundingClientRect().top + y : Infinity;
    emPe = mqEmPe.matches;
    topoH = topo ? topo.offsetHeight : 76;
    /* nitidez até 2× e no máximo ~5 milhões de pixels: telas enormes não pagam o preço de uma 4K a 2× */
    dpr = Math.max(0.75, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(5e6 / (W * H))));
    var cw = Math.round(W * dpr), ch = Math.round(H * dpr);
    if (tela.width !== cw || tela.height !== ch) { tela.width = cw; tela.height = ch; }
    medirLugares();
    /* quanto o sol desce até sumir atrás das colinas: --sol-desce, em % da altura da imagem */
    descidaSol = ceu ? ceu.offsetHeight * (parseFloat(getComputedStyle(ceu).getPropertyValue('--sol-desce')) || 7) / 100 : 0;
    pedirQuadro();
  }
  /* o lugar do broto em cada quadro, lido do layout (offset*, que ignora os transforms das entradas) */
  function medirLugares() {
    var menor = Math.min(W, H), capa = texto.offsetParent || palco;
    var gut = parseFloat(getComputedStyle(capa).paddingLeft) || 20;
    var tx = capa.offsetLeft + texto.offsetLeft, ty = capa.offsetTop + texto.offsetTop;
    var x0, x1, y0, y1;
    if (emPe) {
      /* em pé: a faixa entre o cabeçalho e o começo do texto */
      y0 = topoH + 4; y1 = Math.max(y0 + menor * 0.3, ty - 8);
      lugares[0] = { x: W / 2, y: (y0 + y1) / 2, r: Math.max(Math.min(W * 0.5, (y1 - y0) * 0.56), menor * 0.24) };
    } else {
      /* deitado: do fim do texto até a borda, passando um pouco da coluna do conteúdo nas telas largas */
      var direita = capa.offsetLeft + capa.offsetWidth - gut;
      x0 = tx + texto.offsetWidth + Math.max(24, W * 0.02); x1 = Math.min(W - 8, (direita + W) / 2);
      y0 = topoH; y1 = H - Math.max(16, H * 0.04);
      lugares[0] = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 + H * 0.03, r: Math.max(Math.min((x1 - x0) * 0.52, (y1 - y0) * 0.52), menor * 0.2) };
    }
    /* de cima: centrado no espaço acima da frase */
    y0 = topoH; y1 = blocoCima ? blocoCima.offsetTop - 12 : H * 0.7;
    lugares[1] = { x: W / 2, y: (y0 + y1) / 2, r: Math.max(Math.min(W * 0.4, (y1 - y0) * 0.5), menor * 0.2) };
    /* entrega: o T da logo do cabeçalho. O coração do broto (y 0,62) cai em (257,5; 229) do viewBox 1373 × 687 */
    if (barra && marca) {
      var b = barra.getBoundingClientRect(), mw = marca.offsetWidth || 112, mh = marca.offsetHeight || 56;
      lugares[2] = { x: b.left + marca.offsetLeft + mw * 257.5 / 1373, y: b.top + marca.offsetTop + mh * 229 / 687, r: raioBroto * mw * ESCALA_LOGO / 1373 };
    } else {
      lugares[2] = { x: W / 2, y: topoH / 2, r: menor * 0.03 };
    }
  }
  /* a seção também: com movimento reduzido (ao vivo) ela troca de altura, e a cortina vem junto */
  var ro = new ResizeObserver(medir);
  ro.observe(palco); ro.observe(secao);
  mqEmPe.addEventListener('change', medir);
  /* o texto muda de altura quando a Montserrat chega */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);

  /* ---------- texto dos quadros: só opacidade e translação (o desfoque repintava o texto a cada quadro) ---------- */
  var itens = Array.prototype.map.call(secao.querySelectorAll('[data-sc]'), function (el) {
    return { el: el, cena: +el.getAttribute('data-sc'), fx: el.getAttribute('data-fx') || 'rise', atraso: +el.getAttribute('data-d') || 0, ultimo: -1 };
  });
  function escreverTexto(c, parado) {
    itens.forEach(function (it) {
      var q = Math.round(presenca(c, it.cena, it.atraso) * 400) / 400;
      if (q === it.ultimo) return;
      it.ultimo = q;
      var s = it.el.style, dir = c < it.cena ? 1 : -1;
      s.visibility = q <= 0 ? 'hidden' : 'visible';
      s.opacity = String(q);
      if (parado || it.fx === 'fade') { s.transform = ''; return; }
      var e = 1 - q;
      s.transform = q >= 1 ? '' : 'translate3d(0,' + (e * e * 24 * dir).toFixed(1) + 'px,0)';
    });
  }

  /* ---------- a foto de cima (quadro 1) só carrega depois da página, ou na primeira rolagem ---------- */
  var imgCima = fotoCima && fotoCima.querySelector('img[data-srcset]');
  function carregarCima() {
    if (!imgCima) return;
    imgCima.srcset = imgCima.getAttribute('data-srcset');
    imgCima.removeAttribute('data-srcset');
    imgCima = null;
    removeEventListener('scroll', carregarCima);
  }
  if (imgCima) {
    addEventListener('scroll', carregarCima, { passive: true });
    if (document.readyState === 'complete') setTimeout(carregarCima, 600);
    else addEventListener('load', function () { setTimeout(carregarCima, 600); });
  }

  /* o estado do laço (mais abaixo) é declarado antes da entrada: sem abertura, nascer() já pede o primeiro quadro
     aqui. Declarado depois (até a v0.6.3), o "var raf = 0" apagava esse pedido ainda pendente, o medir() pedia outro e
     o broto passava a ser desenhado duas vezes por quadro, para sempre (duas cadeias de rAF, cada uma zerando a trava) */
  var raf = 0, rodando = false, visivel = true, ultimo = performance.now(), tempo = 0, prog01 = -1;
  var escuroAntes = null, marcaAntes = null, estilos = { sol: '', halo: '', haloO: '', fundo: '', fundoO: '', cima: '', veu: '', luz: '', luzO: '' };

  /* ---------- entrada: o broto nasce depois da abertura (se ela tocar) ---------- */
  var nasceu = -1;
  function nascer() { if (nasceu < 0) nasceu = performance.now() + 350; pedirQuadro(); }
  if (root.classList.contains('intro-active')) {
    var mo = new MutationObserver(function () { if (!root.classList.contains('intro-active')) { mo.disconnect(); nascer(); } });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    setTimeout(function () { mo.disconnect(); nascer(); }, 7000);   /* failsafe, como o da abertura */
  } else nascer();

  /* ---------- ponteiro: inclinação leve, paralaxe da foto e giro arrastando ---------- */
  var ponteiro = { x: 0, y: 0, tx: 0, ty: 0 }, giroLivre = 0, giroVel = 0, arrasto = null;
  palco.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    ponteiro.tx = (e.clientX / W) * 2 - 1;
    ponteiro.ty = (e.clientY / H) * 2 - 1;
    if (arrasto !== null) { giroVel += (e.clientX - arrasto) * 0.002; arrasto = e.clientX; }
    pedirQuadro();
  });
  palco.addEventListener('pointerleave', function () { ponteiro.tx = ponteiro.ty = 0; });
  palco.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('a, button')) return;
    arrasto = e.clientX; palco.classList.add('is-arrastando');
  });
  addEventListener('pointerup', function () { arrasto = null; palco.classList.remove('is-arrastando'); });

  /* ---------- laço (o estado fica antes da entrada, acima) ---------- */
  function pedirQuadro() { if (!raf) raf = requestAnimationFrame(desenhar); }
  /* só escreve no DOM quando o valor muda: um estilo igual ainda custaria um recálculo */
  function escrever(chave, el, prop, valor) { if (estilos[chave] !== valor) { estilos[chave] = valor; el.style[prop] = valor; } }
  function desenhar(agora) {
    raf = 0;
    var dt = Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    var parado = reduzido(), vivo = !parado;
    if (vivo) tempo += dt;

    /* rolagem → quadro (suavizada; com movimento reduzido, sem rolagem presa: fica na capa) */
    var rolagem = window.scrollY || 0, topoR = topoSecao - rolagem, curso = altSecao - H;
    var p = parado || curso <= 0 ? 0 : limitar(-topoR / curso);
    prog01 = prog01 < 0 || parado ? p : prog01 + (p - prog01) * (1 - Math.exp(-dt * 10));
    if (Math.abs(prog01 - p) < 0.0005) prog01 = p;
    var c = coordenada(prog01);
    var k = quadro(c);

    /* a cortina (faixa de solo + serviços) sobe por cima do palco: quanto ela cobre, de 0 a 1 */
    var topoCortina = topoCortina0 - rolagem;
    var cobre = limitar((H - topoCortina) / H);
    /* o cabeçalho fica no tema escuro enquanto é o palco que passa por baixo dele */
    var escuro = topoCortina > topoH;
    if (escuro !== escuroAntes) {
      escuroAntes = escuro;
      secao.classList.toggle('tema-escuro', escuro);
      /* sobre o palco, o cabeçalho fica sem fundo: o véu da foto já dá contraste e o broto chega à logo à vista */
      if (topo) topo.classList.toggle('topo--palco', escuro && !parado);
      if (window.TCA && TCA.topo) TCA.topo();
    }
    /* a logo do cabeçalho some enquanto o broto ocupa o palco e volta quando ele chega ao lugar dela */
    var semMarca = !parado && !!gl && c < 1.9 && topoR + altSecao > 0;
    if (semMarca !== marcaAntes) { marcaAntes = semMarca; if (topo) topo.classList.toggle('topo--sem-marca', semMarca); }

    /* ponteiro (só mouse) */
    var fino = vivo && mqFino.matches;
    ponteiro.x += ((fino ? ponteiro.tx : 0) - ponteiro.x) * (1 - Math.exp(-dt * 3));
    ponteiro.y += ((fino ? ponteiro.ty : 0) - ponteiro.y) * (1 - Math.exp(-dt * 3));

    /* fundo: a foto se aproxima quando a câmera sobe, troca para o campo visto de cima, acompanha o mouse
       de leve e, sob a cortina, sobe um pouco e escurece (profundidade) */
    var aprox = 1.035 + 0.05 * suave(0, 1, c) + 0.03 * suave(1, 2, c);
    escrever('fundo', fundo, 'transform', 'translate3d(' + (-ponteiro.x * 10).toFixed(1) + 'px,' + (-ponteiro.y * 6 - cobre * H * 0.08).toFixed(1) + 'px,0) scale(' + aprox.toFixed(4) + ')');
    escrever('fundoO', fundo, 'opacity', (1 - 0.6 * cobre).toFixed(3));
    if (fotoCima) escrever('cima', fotoCima, 'opacity', suave(0.25, 0.85, c).toFixed(3));
    if (veu) escrever('veu', veu, 'opacity', (1 - suave(0.1, 0.7, c) * 0.75).toFixed(3));
    /* o sol se põe com a rolagem: desce atrás das colinas antes de a câmera chegar ao alto; acompanha o mouse um
       pouco mais que a foto (está mais longe) e o halo apaga junto */
    var poe = parado ? 0 : suave(0.02, 0.78, c);
    if (solCorpo) {
      var sol = 'translate3d(' + (-ponteiro.x * 5).toFixed(1) + 'px,' + (poe * descidaSol - ponteiro.y * 3).toFixed(1) + 'px,0)';
      escrever('sol', solCorpo, 'transform', sol);
      escrever('halo', solHalo, 'transform', sol);
      escrever('haloO', solHalo, 'opacity', (1 - 0.85 * poe).toFixed(3));
    }

    /* câmera */
    if (vivo) { giroLivre += giroVel; giroVel *= Math.exp(-dt * 3); } else { giroVel = 0; }
    /* parado, o broto balança devagar (±29°) em vez de dar voltas: a silhueta do símbolo fica sempre legível */
    var balanco = vivo ? 0.5 * Math.sin(tempo * 0.32) : 0;
    var px = ponteiro.x, py = ponteiro.y;
    var fov = (30 * Math.PI) / 180, tg = Math.tan(fov / 2);
    var dist = (raioBroto * H) / (2 * k.r * tg);
    var alt = Math.max(-88, Math.min(88, k.alt + py * 6)) * (Math.PI / 180);
    var olho = [CORACAO[0], CORACAO[1] + Math.sin(alt) * dist, CORACAO[2] + Math.cos(alt) * dist];
    var vp = vezes(perspectiva(fov, W / H, Math.max(0.05, dist - 5), dist + 6), olharPara(olho, CORACAO));
    var modelo = vezes(girarY(k.giro + giroLivre + balanco + px * 0.3), girarX(py * 0.04));
    var cresce = parado ? 1 : nasceu < 0 ? 0 : limitar((agora - nasceu) / 3400);
    var alfa = 1 - suave(1.86, 1.98, c);

    /* a luz Trigo atrás do broto: um disco fixo de 200 px, levado e escalado só por transform */
    var gr = k.r * 1.5;
    escrever('luz', luz, 'transform', 'translate3d(' + (k.x - 100).toFixed(1) + 'px,' + (k.y - 100).toFixed(1) + 'px,0) scale(' + (gr / 100).toFixed(3) + ')');
    escrever('luzO', luz, 'opacity', (cresce * alfa * (1 - cobre)).toFixed(3));

    if (gl && prog && cobre < 1) {
      gl.viewport(0, 0, tela.width, tela.height);
      gl.depthMask(true);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(loc.u_vp, false, vp);
      gl.uniformMatrix4fv(loc.u_model, false, modelo);
      gl.uniform2f(loc.u_offset, (k.x / W) * 2 - 1, 1 - (k.y / H) * 2);
      gl.uniform1f(loc.u_cresce, cresce);
      gl.uniform1f(loc.u_tempo, tempo);
      gl.uniform1f(loc.u_vivo, vivo ? 1 : 0);
      gl.uniform3f(loc.u_olho, olho[0], olho[1], olho[2]);
      gl.uniform1f(loc.u_alfa, alfa);
      /* o pulso de luz só começa depois que o broto terminou de nascer, e entra devagar */
      /* a contraluz do broto é o sol: apaga quando ele se põe */
      gl.uniform1f(loc.u_sol, 1 - 0.6 * poe);
      gl.uniform1f(loc.u_aceso, vivo && nasceu >= 0 ? limitar((agora - nasceu - 3600) / 2000) : 0);
      /* 1º passe: o chão, translúcido, sem escrever profundidade; 2º: o broto */
      gl.depthMask(false);
      gl.drawElements(gl.TRIANGLES, nChao, gl.UNSIGNED_SHORT, 0);
      gl.depthMask(true);
      gl.drawElements(gl.TRIANGLES, malha.indices.length - nChao, gl.UNSIGNED_SHORT, nChao * 2);
    }
    escreverTexto(c, parado);

    /* o laço só continua enquanto há o que animar e o palco está à vista (não coberto pela cortina);
       parado e já crescido, redesenha só quando a rolagem ou o tamanho mudarem */
    if (rodando && cobre < 1 && (vivo || cresce < 1 || prog01 !== p)) pedirQuadro();
  }
  var menuAberto = false;
  function comecar() { if (rodando || !visivel || menuAberto || document.hidden) return; rodando = true; ultimo = performance.now(); pedirQuadro(); }
  function parar() { rodando = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  /* fora da tela ou sob o menu, as animações em CSS do hero (sol e convite para rolar) também param (site.css, .is-fora) */
  function marcarFora() { secao.classList.toggle('is-fora', !visivel || menuAberto); }
  /* com o menu aberto, o palco fica coberto pelo véu: o broto para e deixa a GPU para a animação do menu */
  document.addEventListener('tca:menu', function (e) { menuAberto = !!e.detail; marcarFora(); if (menuAberto) parar(); else comecar(); });
  new IntersectionObserver(function (es) {
    visivel = es[0].isIntersecting;
    marcarFora();
    if (visivel) comecar(); else { parar(); if (topo) { topo.classList.remove('topo--sem-marca'); marcaAntes = false; } }
  }).observe(secao);
  document.addEventListener('visibilitychange', function () { if (document.hidden) parar(); else comecar(); });
  addEventListener('scroll', function () { if (visivel && !menuAberto) pedirQuadro(); }, { passive: true });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function () { prog01 = -1; pedirQuadro(); });
  medir();
  comecar();

  window.TCA_BROTO = {
    estado: function () {
      return { cresce: nasceu < 0 ? 0 : limitar((performance.now() - nasceu) / 3400), gl: !!gl, vertices: nv, triangulos: indices.length / 3, prog: prog01, dpr: +dpr.toFixed(2), lugares: lugares.map(function (l) { return { x: Math.round(l.x), y: Math.round(l.y), r: Math.round(l.r) }; }) };
    }
  };
})();
