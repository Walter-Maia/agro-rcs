/* ------------------------------------------------------------
   TcaEnterprise — broto.js v0.5.0
   O hero: o broto da marca modelado em 3D (WebGL puro, sem biblioteca) num palco preso à tela.
   A rolagem é a linha do tempo, em três quadros (como no "Lycoris Specimen", adaptado):
     0 capa ....... texto à esquerda, o broto à direita, balançando devagar (arrastar com o mouse gira)
     1 de cima .... a câmera sobe: as folhas viram hélice de drone sobre as curvas de nível
     2 entrega .... o fundo clareia para o Algodão e o broto encolhe até o lugar da logo do cabeçalho,
                    que reaparece; o palco se solta e o site segue
   O broto nasce na ordem em que uma planta nasce: curvas do chão, raízes, anéis, caule de baixo para
   cima, o nó e, com o caule firme, as duas folhas se abrindo com mola. Depois, só balança de leve.
   Geometria: as proporções do símbolo (assets/marca), com as três raízes abertas em 3D a 120°;
   de frente, a raiz que vem para a câmera é a raiz do meio do logo.
   Sem WebGL: a logo negativa em <img>. Movimento reduzido (html.rm): o broto pronto e parado, e o
   hero vira uma tela só, sem rolagem presa.
------------------------------------------------------------ */
(function () {
  'use strict';
  var secao = document.querySelector('[data-broto]');
  if (!secao) return;
  var root = document.documentElement;
  var palco = secao.querySelector('.broto__palco');
  var tela = secao.querySelector('.broto__tela');
  var luz = secao.querySelector('.broto__luz');
  var topo = document.querySelector('.topo');
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

  /* ---------- geometria ----------
     Unidades: 1 ≈ 180 unidades do viewBox do logo. A junção das raízes fica na origem; o nó, em y 1,30.
     Vértice: posição 3, normal 3, aux 4 (s ao longo da peça, tipo, início e duração do crescimento), lado 1.
     Tipos: 0 caule e raízes · 1 folha · 2 anel · 3 nó · 4 curva do chão. */
  var NO_Y = 1.3, CORACAO = [0, 0.62, 0];
  var PASSO = 11;
  var dados = [], indices = [], nv = 0;
  function vertice(p, n, s, tipo, ini, dur, lado) {
    dados.push(p[0], p[1], p[2], n[0], n[1], n[2], s, tipo, ini, dur, lado);
    return nv++;
  }
  /* tubo sobre um referencial de transporte paralelo (não torce); fechado = anel */
  function tubo(pts, raio, lados, tipo, ini, dur, fechado) {
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
        vertice(soma(pts[j], esc(nr, r)), nr, s, tipo, ini, dur, 0);
      }
    }
    for (i = 0; i < aneis.length - 1; i++) {
      for (k = 0; k < lados; k++) {
        var p = aneis[i] + k, q = aneis[i + 1] + k;
        indices.push(p, p + 1, q, p + 1, q + 1, q);
      }
    }
  }
  /* folha: uma lâmina com nervura (três faixas: borda, nervura levemente erguida, borda), que torce
     ao longo do comprimento como uma pá de hélice */
  function folha(lado) {
    var P0 = [lado * 0.12, 1.33, 0], P1 = [lado * 0.92, 1.26, 0], P2 = [lado * 1.46, 1.98, 0];
    var n = 40, linhas = [], i, k;
    for (i = 0; i <= n; i++) {
      var s = i / n, u = 1 - s;
      var p = soma(soma(esc(P0, u * u), esc(P1, 2 * u * s)), esc(P2, s * s));
      var T = uni(soma(esc(dif(P1, P0), 2 * u), esc(dif(P2, P1), 2 * s)));
      var W = uni(vet(T, [0, 0, 1]));            /* largura, no plano do logo */
      var N = vet(W, T);
      var giro = (0.15 + 0.5 * s) * lado;        /* passo de hélice */
      var W2 = soma(esc(W, Math.cos(giro)), esc(N, Math.sin(giro)));
      N = uni(vet(W2, T)); W = W2;
      var meia = 0.25 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + s * 0.97)), 0.85);
      var nervura = soma(p, esc(N, 0.035 * Math.sin(Math.PI * s)));
      linhas.push(nv);
      vertice(soma(p, esc(W, meia)), N, s, 1, 0.52, 0.3, lado);
      vertice(nervura, N, s, 1, 0.52, 0.3, lado);
      vertice(dif(p, esc(W, meia)), N, s, 1, 0.52, 0.3, lado);
    }
    for (i = 0; i < n; i++) {
      for (k = 0; k < 2; k++) {
        var a = linhas[i] + k, b = linhas[i + 1] + k;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  function reta(a, b, m) { var pts = []; for (var i = 0; i <= m; i++) pts.push(soma(a, esc(dif(b, a), i / m))); return pts; }

  /* caule: do chão até o nó */
  tubo(reta([0, 0, 0], [0, 1.2, 0], 24), function () { return 0.085; }, PASSO, 0, 0.18, 0.3, false);
  /* nó: uma cápsula no topo do caule */
  tubo(reta([0, 1.15, 0], [0, 1.47, 0], 16), function (s) { return 0.165 * Math.pow(Math.sin(Math.PI * s), 0.5) + 0.002; }, PASSO, 3, 0.46, 0.08, false);
  /* raízes e anéis: três raízes a 120° descem da junção para dentro da terra e terminam em anéis Trigo
     deitados, como contatos de circuito no solo. De frente, lembram o pé do logo; de cima, fecham um
     desenho simétrico com as curvas de nível. Cada anel começa a se desenhar onde a raiz chega. */
  [0, 1, 2].forEach(function (i) {
    var th = Math.PI / 2 + (i * 2 * Math.PI) / 3, radial = [Math.cos(th), 0, Math.sin(th)];
    var fim = [radial[0] * 0.56, -0.64, radial[2] * 0.56];
    tubo(reta([0, 0, 0], fim, 12), function () { return 0.058; }, PASSO, 0, 0.02 + i * 0.03, 0.26, false);
    var R = 0.17, c = [radial[0] * (0.56 + R), -0.64, radial[2] * (0.56 + R)], pts = [];
    for (var k = 0; k < 48; k++) {
      var a = th + Math.PI + (k / 48) * Math.PI * 2;
      pts.push([c[0] + R * Math.cos(a), c[1], c[2] + R * Math.sin(a)]);
    }
    tubo(pts, function () { return 0.045; }, 10, 2, 0.25 + i * 0.03, 0.22, true);
  });
  folha(-1);
  folha(1);
  /* curvas de nível no chão, levemente onduladas, como num mapa */
  [0.62, 1.02, 1.42].forEach(function (R, i) {
    var pts = [];
    for (var k = 0; k < 120; k++) {
      var a = (k / 120) * Math.PI * 2;
      var r = R * (1 + 0.06 * Math.sin(3 * a + i) + 0.035 * Math.sin(5 * a + 2 * i));
      pts.push([r * Math.cos(a), -0.02, r * Math.sin(a)]);
    }
    tubo(pts, function () { return 0.007; }, 5, 4, i * 0.05, 0.45, true);
  });
  var malha = { dados: new Float32Array(dados), indices: new Uint16Array(indices) };
  var raioBroto = 0;
  for (var i = 0; i < dados.length; i += 11) {
    if (dados[i + 7] > 3.5) continue;
    raioBroto = Math.max(raioBroto, Math.hypot(dados[i] - CORACAO[0], dados[i + 1] - CORACAO[1], dados[i + 2] - CORACAO[2]));
  }

  /* ---------- câmera por quadro ----------
     giro: volta do broto no próprio eixo · alt: altura da câmera em graus (+90 = de cima)
     tam: raio do broto em fração do menor lado do palco · ox, oy: onde o centro cai, em clip space */
  var QUADROS = [
    { giro: 0.35, alt: 16, tam: 0.72, ox: 0.42, oy: 0.02 },
    { giro: 2.1, alt: 52, tam: 0.6, ox: 0, oy: 0.14 },
    { giro: 3.7, alt: 12, tam: 0.06, ox: 0, oy: 0.9 }
  ];
  var QUADROS_ALTO = [{ tam: 0.66, ox: 0, oy: 0.46 }, { tam: 0.66, oy: 0.16 }, {}];
  var N_QUADROS = QUADROS.length, PAUSA = 0.32;
  function quadro(c, alto, dockY) {
    var i = Math.max(0, Math.min(N_QUADROS - 1, Math.floor(c))), j = Math.min(N_QUADROS - 1, i + 1), f = c - i;
    function q(k) {
      var o = {}, base = QUADROS[k], extra = alto ? QUADROS_ALTO[k] : {};
      for (var p in base) o[p] = p in extra ? extra[p] : base[p];
      if (k === N_QUADROS - 1) o.oy = dockY;
      return o;
    }
    var a = q(i), b = q(j), o = {};
    for (var p in a) o[p] = a[p] + (b[p] - a[p]) * f;
    return o;
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
    'attribute vec3 a_pos; attribute vec3 a_nrm; attribute vec4 a_aux; attribute float a_lado;',
    'uniform mat4 u_vp; uniform mat4 u_model; uniform vec2 u_offset; uniform float u_cresce; uniform float u_tempo; uniform float u_vivo;',
    'varying vec3 v_n; varying vec3 v_w; varying float v_s; varying float v_g; varying float v_tipo;',
    'vec3 girarZ(vec3 p, vec3 c, float a) { vec3 q = p - c; float cs = cos(a), sn = sin(a); return c + vec3(q.x * cs - q.y * sn, q.x * sn + q.y * cs, q.z); }',
    'void main() {',
    '  vec3 p = a_pos; vec3 n = a_nrm; float tipo = a_aux.y;',
    '  float g = clamp((u_cresce - a_aux.z) / a_aux.w, 0.0, 1.0);',
    '  g = 1.0 - pow(1.0 - g, 3.0);',
    '  if (tipo > 0.5 && tipo < 1.5) {',
    /* a folha sai dobrada para cima, rente ao caule, e abre a partir do nó com uma mola (back.out) */
    '    float x = clamp((u_cresce - a_aux.z) / (a_aux.w * 1.5), 0.0, 1.0);',
    '    float k = x - 1.0; float abre = 1.0 + 2.70158 * k * k * k + 1.70158 * k * k;',
    '    float ang = (1.0 - abre) * a_lado * 1.05 + u_vivo * a_lado * 0.04 * sin(u_tempo * 1.2 + a_lado * 0.8);',
    '    p = girarZ(p, vec3(0.0, ' + NO_Y.toFixed(2) + ', 0.0), ang); n = girarZ(n, vec3(0.0), ang);',
    '  }',
    '  vec4 w = u_model * vec4(p, 1.0);',
    '  v_w = w.xyz; v_n = (u_model * vec4(n, 0.0)).xyz; v_s = a_aux.x; v_g = g; v_tipo = tipo;',
    '  gl_Position = u_vp * w; gl_Position.xy += u_offset * gl_Position.w;',
    '}'
  ].join('\n');
  /* acetinado Algodão para o broto, Trigo metálico para os anéis, verde baixo para o chão;
     luz principal de cima à esquerda, borda Trigo por trás (o "acender" da abertura) */
  var FRAG = [
    'precision highp float;',
    'uniform vec3 u_olho; uniform float u_alfa;',
    'varying vec3 v_n; varying vec3 v_w; varying float v_s; varying float v_g; varying float v_tipo;',
    'void main() {',
    '  if (v_s > v_g + 0.0005) discard;',
    '  vec3 n = normalize(v_n); vec3 v = normalize(u_olho - v_w);',
    '  if (dot(n, v) < 0.0) n = -n;',
    '  vec3 L = normalize(vec3(-0.5, 0.9, 0.65));',
    '  float envolve = max((dot(n, L) + 0.35) / 1.35, 0.0);',
    '  vec3 h = normalize(L + v);',
    '  float borda = pow(1.0 - max(dot(n, v), 0.0), 3.0);',
    '  vec3 algodao = vec3(0.905, 0.88, 0.807); vec3 trigo = vec3(0.584, 0.361, 0.02); vec3 mata = vec3(0.012, 0.06, 0.04);',
    '  vec3 cor;',
    '  if (v_tipo > 3.5) {',
    '    cor = vec3(0.07, 0.16, 0.115) * (0.7 + 0.3 * envolve);',
    '  } else if (v_tipo > 1.5 && v_tipo < 2.5) {',
    '    vec3 r = reflect(-v, n);',
    '    float amb = 0.25 + 0.75 * smoothstep(-0.3, 0.9, r.y);',
    '    float brilho = pow(max(dot(n, h), 0.0), 48.0);',
    '    cor = trigo * (0.3 + 1.1 * envolve) * amb + vec3(1.0, 0.86, 0.55) * brilho * 1.3 + trigo * borda * 0.9;',
    '  } else {',
    '    float brilho = pow(max(dot(n, h), 0.0), 26.0);',
    '    cor = algodao * (0.12 + 0.88 * envolve) + mata + vec3(1.0) * brilho * 0.22 + trigo * borda * 0.6;',
    '  }',
    '  cor = cor / (1.0 + cor * 0.22);',
    '  cor = pow(cor, vec3(1.0 / 2.2));',
    '  gl_FragColor = vec4(cor * u_alfa, u_alfa);',
    '}'
  ].join('\n');

  /* ---------- WebGL ---------- */
  var gl = null, prog = null, loc = {};
  function iniciarGL() {
    gl = tela.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl) return false;
    function compilar(tipo, src) {
      var sh = gl.createShader(tipo); gl.shaderSource(sh, src); gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    }
    var vs = compilar(gl.VERTEX_SHADER, VERT), fs = compilar(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, malha.dados, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, malha.indices, gl.STATIC_DRAW);
    [['a_pos', 3, 0], ['a_nrm', 3, 3], ['a_aux', 4, 6], ['a_lado', 1, 10]].forEach(function (a) {
      var l = gl.getAttribLocation(prog, a[0]);
      if (l < 0) return;
      gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, a[1], gl.FLOAT, false, 11 * 4, a[2] * 4);
    });
    ['u_vp', 'u_model', 'u_offset', 'u_cresce', 'u_tempo', 'u_vivo', 'u_olho', 'u_alfa'].forEach(function (u) { loc[u] = gl.getUniformLocation(prog, u); });
    gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
    return true;
  }
  if (!iniciarGL()) { gl = null; secao.classList.add('sem-3d'); }
  tela.addEventListener('webglcontextlost', function (e) { e.preventDefault(); gl = null; });
  tela.addEventListener('webglcontextrestored', function () { if (!iniciarGL()) gl = null; });

  /* ---------- medidas ---------- */
  var W = 1, H = 1, dpr = 1;
  function medir() {
    var r = palco.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = Math.round(W * dpr), ch = Math.round(H * dpr);
    if (tela.width !== cw || tela.height !== ch) { tela.width = cw; tela.height = ch; }
    pedirQuadro();
  }
  new ResizeObserver(medir).observe(palco);

  /* ---------- texto dos quadros ---------- */
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
      if (parado || it.fx === 'fade') { s.transform = ''; s.filter = ''; return; }
      s.transform = 'translate3d(0,' + ((1 - q) * 28 * dir).toFixed(1) + 'px,0)';
      s.filter = q > 0.99 ? '' : 'blur(' + ((1 - q) * 6).toFixed(1) + 'px)';
    });
  }

  /* ---------- entrada: o broto nasce depois da abertura (se ela tocar) ---------- */
  var nasceu = -1;
  function nascer() { if (nasceu < 0) nasceu = performance.now() + 250; pedirQuadro(); }
  if (root.classList.contains('intro-active')) {
    var mo = new MutationObserver(function () { if (!root.classList.contains('intro-active')) { mo.disconnect(); nascer(); } });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    setTimeout(function () { mo.disconnect(); nascer(); }, 7000);   /* failsafe, como o da abertura */
  } else nascer();

  /* ---------- ponteiro: inclinação leve e giro arrastando ---------- */
  var ponteiro = { x: 0, y: 0, tx: 0, ty: 0 }, giroLivre = 0, giroVel = 0, arrasto = null;
  palco.addEventListener('pointermove', function (e) {
    var r = palco.getBoundingClientRect();
    ponteiro.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    ponteiro.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (arrasto !== null) { giroVel += (e.clientX - arrasto) * 0.002; arrasto = e.clientX; }
  });
  palco.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('a, button')) return;
    arrasto = e.clientX; palco.classList.add('is-arrastando');
  });
  addEventListener('pointerup', function () { arrasto = null; palco.classList.remove('is-arrastando'); });

  /* ---------- laço ---------- */
  var raf = 0, rodando = false, visivel = true, ultimo = performance.now(), tempo = 0, prog01 = -1;
  var corEscura = [10, 42, 32], corClara = [244, 241, 232], escuroAntes = null, marcaAntes = null;
  function pedirQuadro() { if (!raf) raf = requestAnimationFrame(desenhar); }
  function desenhar(agora) {
    raf = 0;
    var dt = Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    var parado = reduzido(), vivo = !parado;
    if (vivo) tempo += dt;

    /* rolagem → quadro (suavizada; com movimento reduzido, sem rolagem presa: fica na capa) */
    var r = secao.getBoundingClientRect(), curso = r.height - H;
    var p = parado || curso <= 0 ? 0 : limitar(-r.top / curso);
    prog01 = prog01 < 0 || parado ? p : prog01 + (p - prog01) * (1 - Math.exp(-dt * 10));
    var c = coordenada(prog01);
    var alto = H > W * 1.05;
    var dockY = 1 - (topo ? topo.offsetHeight : 76) / H;
    var k = quadro(c, alto, dockY);

    /* fundo: Floresta funda → Algodão na entrega; o cabeçalho acompanha */
    var claro = suave(1.1, 1.7, c);
    palco.style.backgroundColor = 'rgb(' + corEscura.map(function (v, i) { return Math.round(v + (corClara[i] - v) * claro); }).join(',') + ')';
    var escuro = claro < 0.5;
    if (escuro !== escuroAntes) {
      escuroAntes = escuro;
      secao.classList.toggle('tema-escuro', escuro);
      if (window.TCA && TCA.topo) TCA.topo();
    }
    /* a logo do cabeçalho some enquanto o broto ocupa o palco e volta quando ele chega ao lugar dela */
    var semMarca = !parado && c < 1.88 && r.bottom > 0;
    if (semMarca !== marcaAntes) { marcaAntes = semMarca; if (topo) topo.classList.toggle('topo--sem-marca', semMarca); }

    /* câmera */
    ponteiro.x += (ponteiro.tx - ponteiro.x) * (1 - Math.exp(-dt * 4));
    ponteiro.y += (ponteiro.ty - ponteiro.y) * (1 - Math.exp(-dt * 4));
    /* parado, o broto balança devagar (±29°) em vez de dar voltas: a silhueta do símbolo fica sempre legível */
    if (vivo) { giroLivre += giroVel; giroVel *= Math.exp(-dt * 3); } else { giroVel = 0; }
    var balanco = vivo ? 0.5 * Math.sin(tempo * 0.32) : 0;
    var px = vivo ? ponteiro.x : 0, py = vivo ? ponteiro.y : 0;
    var fov = (30 * Math.PI) / 180, menor = Math.min(W, H);
    var dist = (raioBroto * H) / (k.tam * menor * Math.tan(fov / 2));
    var alt = Math.max(-88, Math.min(88, k.alt + py * 6)) * (Math.PI / 180);
    var olho = [CORACAO[0], CORACAO[1] + Math.sin(alt) * dist, CORACAO[2] + Math.cos(alt) * dist];
    var vp = vezes(perspectiva(fov, W / H, Math.max(0.05, dist - 5), dist + 6), olharPara(olho, CORACAO));
    var modelo = vezes(girarY(k.giro + giroLivre + balanco + px * 0.3), girarX(py * 0.04));
    var cresce = parado ? 1 : nasceu < 0 ? 0 : limitar((agora - nasceu) / 3400);
    var alfa = 1 - suave(1.84, 1.97, c);

    /* a luz Trigo atrás do broto segue o centro dele na tela */
    var gx = (0.5 + k.ox / 2) * W, gy = (0.5 - k.oy / 2) * H, gr = k.tam * menor * 1.2;
    luz.style.transform = 'translate3d(' + (gx - gr).toFixed(1) + 'px,' + (gy - gr).toFixed(1) + 'px,0)';
    luz.style.width = luz.style.height = (gr * 2).toFixed(1) + 'px';
    luz.style.opacity = String(cresce * (1 - claro));

    if (gl && prog) {
      gl.viewport(0, 0, tela.width, tela.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(loc.u_vp, false, vp);
      gl.uniformMatrix4fv(loc.u_model, false, modelo);
      gl.uniform2f(loc.u_offset, k.ox, k.oy);
      gl.uniform1f(loc.u_cresce, cresce);
      gl.uniform1f(loc.u_tempo, tempo);
      gl.uniform1f(loc.u_vivo, vivo ? 1 : 0);
      gl.uniform3f(loc.u_olho, olho[0], olho[1], olho[2]);
      gl.uniform1f(loc.u_alfa, alfa);
      gl.drawElements(gl.TRIANGLES, malha.indices.length, gl.UNSIGNED_SHORT, 0);
    }
    escreverTexto(c, parado);

    /* parado e já crescido, não precisa de laço: redesenha só quando algo mudar */
    if (rodando && (vivo || cresce < 1)) pedirQuadro();
  }
  function comecar() { if (rodando || !visivel || document.hidden) return; rodando = true; ultimo = performance.now(); pedirQuadro(); }
  function parar() { rodando = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  new IntersectionObserver(function (es) {
    visivel = es[0].isIntersecting;
    if (visivel) comecar(); else { parar(); if (topo) { topo.classList.remove('topo--sem-marca'); marcaAntes = false; } }
  }).observe(secao);
  document.addEventListener('visibilitychange', function () { if (document.hidden) parar(); else comecar(); });
  addEventListener('scroll', pedirQuadro, { passive: true });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function () { prog01 = -1; pedirQuadro(); });
  medir();
  comecar();

  window.TCA_BROTO = { estado: function () { return { cresce: nasceu < 0 ? 0 : limitar((performance.now() - nasceu) / 3400), gl: !!gl, vertices: nv, triangulos: indices.length / 3, prog: prog01 }; } };
})();
