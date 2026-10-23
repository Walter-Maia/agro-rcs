/*
 * Copia os paths OFICIAIS do sprite (assets/marca/tca-logo.svg, aprovado) para os dois lugares que precisam
 * deles inline, porque o CSS não alcança peças dentro de um <use>:
 *   1. o palco da abertura   → assets/js/intro.js, entre /*PALCO:INICIO*\/ e /*PALCO:FIM*\/
 *   2. a logo do cabeçalho   → index.html, entre <!-- LOGO-INLINE:INICIO --> e <!-- LOGO-INLINE:FIM -->
 * Nada é redesenhado. Única derivação: o contorno externo de cada folha-hélice é cortado, no ponto em que
 * encosta no hub, em duas metades que partem do hub (para o traço "se desenhar do hub para fora"); as metades
 * usam os mesmos segmentos do path oficial, só com o sentido invertido quando preciso.
 * Rode de novo se o vetor mudar:  node qa/ferramentas/montar-marca-inline.js
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..', '..');
const sprite = fs.readFileSync(path.join(RAIZ, 'assets/marca/tca-logo.svg'), 'utf8');
const simbolo = sprite.slice(sprite.indexOf('<symbol id="tca-logo"'), sprite.indexOf('</symbol>', sprite.indexOf('<symbol id="tca-logo"')));

function peca(classe) {
  const re = new RegExp('<(path|circle)[^>]*class="[^"]*\\b' + classe + '\\b[^"]*"[^>]*/>', 'g');
  const achados = simbolo.match(re);
  if (!achados) throw new Error('peça não encontrada no sprite: ' + classe);
  return achados;
}
const attr = (tag, nome) => { const m = tag.match(new RegExp('\\s' + nome + '="([^"]*)"')); return m ? m[1] : null; };

/* ---------- folhas: contorno externo cortado em duas metades a partir do hub ---------- */
function segmentos(d) {
  const tokens = d.match(/[MCLZ]|-?\d*\.?\d+(?:e-?\d+)?/gi);
  const subs = []; let atual = null, cmd = null, i = 0, ponto = null;
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    if (/[MCLZ]/i.test(tokens[i])) cmd = tokens[i++].toUpperCase();
    if (cmd === 'M') { ponto = [num(), num()]; atual = { inicio: ponto, segs: [] }; subs.push(atual); cmd = 'L'; continue; }
    if (cmd === 'Z') { continue; }
    if (cmd === 'C') { const c1 = [num(), num()], c2 = [num(), num()], p = [num(), num()]; atual.segs.push({ t: 'C', de: ponto, c1, c2, p }); ponto = p; }
    else if (cmd === 'L') { const p = [num(), num()]; atual.segs.push({ t: 'L', de: ponto, p }); ponto = p; }
  }
  return subs;
}
const f = (v) => +v.toFixed(2);
const pt = (p) => f(p[0]) + ' ' + f(p[1]);
function caminho(inicio, segs) { return 'M' + pt(inicio) + segs.map((s) => s.t === 'C' ? 'C' + pt(s.c1) + ' ' + pt(s.c2) + ' ' + pt(s.p) : 'L' + pt(s.p)).join(''); }
function inverso(segs) { return segs.slice().reverse().map((s) => s.t === 'C' ? { t: 'C', de: s.p, c1: s.c2, c2: s.c1, p: s.de } : { t: 'L', de: s.p, p: s.de }); }
const perto = (a, b) => Math.abs(a[0] - b[0]) < 0.02 && Math.abs(a[1] - b[1]) < 0.02;
function metadesDaFolha(d, encostoBaixo, encostoCima) {
  const [externo, furo] = segmentos(d);
  const iBaixo = externo.segs.findIndex((s) => perto(s.p, encostoBaixo));
  const iCima = externo.segs.findIndex((s) => perto(s.p, encostoCima));
  if (iBaixo < 0 || iCima < 0) throw new Error('não achei o encosto da folha no hub');
  const baixo = inverso(externo.segs.slice(0, iBaixo + 1));            /* hub → borda de baixo → ponta */
  const cima = externo.segs.slice(iCima + 1);                           /* hub → borda de cima → ponta */
  return [caminho(encostoBaixo, baixo), caminho(encostoCima, cima), caminho(furo.inicio, furo.segs)];
}

const [raiz1, raiz2, raiz3] = peca('lg-raiz');
const [haste] = peca('lg-haste');
const [hub] = peca('lg-hub');
const [folhaEsq] = peca('lg-folha-esq');
const [folhaDir] = peca('lg-folha-dir');
const aneis = peca('lg-anel');
const [letraC] = peca('lg-c');
const [letraA] = peca('lg-a');
const letras = peca('lg-l');

const metadesEsq = metadesDaFolha(attr(folhaEsq, 'd'), [207.04, 128], [223.69, 65.42]);
const metadesDir = metadesDaFolha(attr(folhaDir, 'd'), [307.96, 128], [291.31, 65.42]);

/* ---------- ENTERPRISE: deslocamento inicial de cada letra, proporcional à distância ao centro ---------- */
const centroX = (d) => { const xs = d.match(/-?\d*\.?\d+/g).map(Number).filter((_, i) => i % 2 === 0); return (Math.min(...xs) + Math.max(...xs)) / 2; };
const centros = letras.map((l) => centroX(attr(l, 'd')));
const meio = (Math.min(...centros) + Math.max(...centros)) / 2;

/* ---------- 1. palco da abertura ---------- */
const CURVA_FUNDO = 'M0 118C180 96 330 92 480 104S760 136 940 120S1260 84 1440 98';    /* as mesmas da hero */
const CURVA_FRENTE = 'M0 132C160 128 300 112 470 118S780 150 960 138S1270 108 1440 120';
/* tira classe, data-ch e style do sprite; o estilo de cada peça no palco vem explícito */
const limpa = (tag) => tag.replace(/\sclass="[^"]*"/, '').replace(/\sdata-ch="[^"]*"/, '').replace(/\sstyle="[^"]*"/, '');
const comClasse = (tag, classe, estilo) => limpa(tag).replace(/^<(path|circle)/, '<$1 class="' + classe + '"' + (estilo ? ' style="' + estilo + '"' : ''));
const folhaPalco = (lado, metades, oficial) =>
  '<g class="it-folha it-folha--' + lado + '">' +
    '<path class="it-folha-fill" d="' + attr(oficial, 'd') + '" fill-rule="evenodd" style="fill:var(--lg-ink)"/>' +
    metades.map((d) => '<path class="it-folha-traco" pathLength="1" d="' + d + '"/>').join('') +
  '</g>';
const palco =
  '<div class="it-palco"><div class="it-marca">' +
    '<div class="it-halo-caixa"><i class="it-halo"></i></div>' +
    '<div class="it-campos">' +
      '<div class="it-campo it-campo--fundo"><div><svg viewBox="0 0 1440 160" preserveAspectRatio="none" focusable="false"><path d="' + CURVA_FUNDO + '"/></svg></div></div>' +
      '<div class="it-campo it-campo--frente"><div><svg viewBox="0 0 1440 160" preserveAspectRatio="none" focusable="false"><path d="' + CURVA_FRENTE + '"/></svg></div></div>' +
    '</div>' +
    '<svg class="it-logo" viewBox="0 0 1373 687" focusable="false">' +
      '<g class="it-t">' +
        '<g fill="none" stroke-linecap="butt" style="stroke:var(--lg-ink)">' +
          [raiz1, raiz2, raiz3].map((r, k) => comClasse(r, 'it-raiz', '--k:' + k)).join('') +
        '</g>' +
        comClasse(haste, 'it-haste', 'stroke:var(--lg-ink)') +
        comClasse(hub, 'it-hub', 'fill:var(--lg-ink)') +
        folhaPalco('esq', metadesEsq, folhaEsq) +
        folhaPalco('dir', metadesDir, folhaDir) +
        '<g fill="none" style="stroke:var(--lg-accent)">' + aneis.map((a, k) => comClasse(a, 'it-anel', '--k:' + k)).join('') + '</g>' +
      '</g>' +
      '<g class="it-ca">' +
        comClasse(letraC, 'it-fill', '--k:0;fill:var(--lg-ink)') + comClasse(letraA, 'it-fill', '--k:1;fill:var(--lg-ink)') +
        comClasse(letraC, 'it-linha', '--k:0') + comClasse(letraA, 'it-linha', '--k:1') +
      '</g>' +
      '<g class="it-enterprise" style="fill:var(--lg-accent)">' +
        letras.map((l, k) => comClasse(l, 'it-l', '--k:' + k + ';--o:' + f((centros[k] - meio) * 0.12))).join('') +
      '</g>' +
    '</svg>' +
  '</div></div>';
/* as linhas de contorno do C e do A precisam de pathLength="1" (o sprite só o põe nos traços) */
const palcoFinal = palco.replace(/<path class="it-linha"/g, '<path class="it-linha" pathLength="1"');

const introArq = path.join(RAIZ, 'assets/js/intro.js');
let intro = fs.readFileSync(introArq, 'utf8');
const ini = intro.indexOf('/*PALCO:INICIO*/'), fim = intro.indexOf('/*PALCO:FIM*/');
if (ini < 0 || fim < 0) throw new Error('marcadores do palco não encontrados em intro.js');
intro = intro.slice(0, ini) + '/*PALCO:INICIO*/\n  var PALCO = ' + JSON.stringify(palcoFinal) + ';\n  ' + intro.slice(fim);
fs.writeFileSync(introArq, intro);

/* ---------- 2. logo do cabeçalho (grupos para a entrada em partes) ---------- */
const logo =
  '<svg class="marca__svg" viewBox="0 0 1373 687" aria-hidden="true" focusable="false">' +
    '<g class="lg-t">' + simbolo.match(/<g class="lg-raizes"[\s\S]*?<\/g>/)[0].replace(/\s*\n\s*/g, '') + haste + hub + folhaEsq + folhaDir + '</g>' +
    '<g class="lg-aneis" fill="none" style="stroke:var(--lg-accent,#C9A227)">' + aneis.join('') + '</g>' +
    '<g class="lg-ca">' + letraC + letraA + '</g>' +
    '<g class="lg-enterprise" style="fill:var(--lg-accent,#C9A227)">' + letras.join('') + '</g>' +
  '</svg>';
const htmlArq = path.join(RAIZ, 'index.html');
let html = fs.readFileSync(htmlArq, 'utf8');
const a = html.indexOf('<!-- LOGO-INLINE:INICIO -->'), b = html.indexOf('<!-- LOGO-INLINE:FIM -->');
if (a < 0 || b < 0) throw new Error('marcadores da logo não encontrados em index.html');
html = html.slice(0, a) + '<!-- LOGO-INLINE:INICIO -->\n      ' + logo + '\n      ' + html.slice(b);
fs.writeFileSync(htmlArq, html);

console.log('palco:', palcoFinal.length, 'caracteres · logo do cabeçalho:', logo.length, 'caracteres · ENTERPRISE --o:', centros.map((c) => f((c - meio) * 0.12)).join(' '));
