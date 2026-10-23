/*
 * Contraste WCAG 2.x de todos os pares de cor usados na página (texto e elementos de interface).
 * Cores com transparência são compostas sobre o fundo real antes do cálculo.
 * Uso: node qa/ferramentas/contraste.js   → imprime a tabela e grava qa/fase2/contraste.json
 */
const fs = require('fs');
const path = require('path');

const C = { floresta: '#0F3D2E', trigo: '#C9A227', algodao: '#F4F1E8', grafite: '#1C1F1E', folha: '#7BC47F', florestaFunda: '#0A2A20' };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mistura = (frente, alfa, fundo) => { const a = hex(frente), b = hex(fundo); return '#' + a.map((v, i) => Math.round(v * alfa + b[i] * (1 - alfa)).toString(16).padStart(2, '0')).join(''); };
const lum = (h) => { const [r, g, b] = hex(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const razao = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

const claroSuaveFloresta = mistura(C.algodao, 0.8, C.floresta);
const claroSuaveFunda = mistura(C.algodao, 0.8, C.florestaFunda);
const topoSobreEscuro = mistura(C.algodao, 0.88, C.floresta);
const primarioHover = mistura(C.algodao, 0.1, C.floresta);
const trigoHover = mistura(C.algodao, 0.1, C.trigo);   /* o hover do botão Trigo clareia (site.css) */
const contornoHover = mistura(C.floresta, 0.1, C.algodao);

/* [uso, cor, fundo, tipo] — tipo "texto" exige 4,5 (AA); "grande" 3 (≥ 24 px ou ≥ 18,66 px negrito); "ui" 3 (1.4.11) */
const PARES = [
  ['Títulos, eyebrow, menu e botão de contorno (Floresta sobre Algodão)', C.floresta, C.algodao, 'texto'],
  ['Texto corrido (Grafite sobre Algodão)', C.grafite, C.algodao, 'texto'],
  ['Títulos, faixa, rótulo das fotos e botão primário (Algodão sobre Floresta)', C.algodao, C.floresta, 'texto'],
  ['Eyebrow escuro e rótulos dos contatos (Trigo sobre Floresta)', C.trigo, C.floresta, 'texto'],
  ['Números das etapas e [A CONFIRMAR] (Folha sobre Floresta)', C.folha, C.floresta, 'texto'],
  ['Botão do CTA final (Floresta sobre Trigo)', C.floresta, C.trigo, 'texto'],
  ['Texto das etapas e aviso do CTA (Algodão 80 % sobre Floresta)', claroSuaveFloresta, C.floresta, 'texto'],
  ['Links do rodapé (Algodão sobre Floresta funda)', C.algodao, C.florestaFunda, 'texto'],
  ['© do rodapé (Algodão 80 % sobre Floresta funda)', claroSuaveFunda, C.florestaFunda, 'texto'],
  ['Menu sobre o cabeçalho translúcido em seção Floresta (pior caso, sem blur)', C.floresta, topoSobreEscuro, 'texto'],
  ['Botão primário em hover', C.algodao, primarioHover, 'texto'],
  ['Botão Trigo em hover', C.floresta, trigoHover, 'texto'],
  ['Botão de contorno em hover', C.floresta, contornoHover, 'texto'],
  ['Anel de foco Floresta sobre Algodão', C.floresta, C.algodao, 'ui'],
  ['Anel de foco Trigo sobre Floresta', C.trigo, C.floresta, 'ui'],
  ['Borda do botão de contorno', C.floresta, C.algodao, 'ui'],
  ['Ícone do botão de pausa (Algodão sobre Floresta)', C.algodao, C.floresta, 'ui'],
  ['Só grafismo: Trigo sobre Algodão (sublinhado do menu em hover, filete do "Sobre", logo)', C.trigo, C.algodao, 'grafismo'],
  ['Só grafismo: Folha sobre Floresta (curvas dos espaços de foto, 32 %)', mistura(C.folha, 0.32, C.floresta), C.floresta, 'grafismo']
];
const MINIMO = { texto: 4.5, grande: 3, ui: 3, grafismo: 0 };
const linhas = PARES.map(([uso, cor, fundo, tipo]) => {
  const r = razao(cor, fundo);
  return { uso, cor, fundo, tipo, razao: +r.toFixed(2), minimo: MINIMO[tipo], passa: tipo === 'grafismo' ? 'n/a (não é texto)' : r >= MINIMO[tipo] ? 'sim' : 'NÃO' };
});
linhas.forEach((l) => console.log(`${l.razao.toFixed(2).padStart(5)} : 1  ${l.passa.padEnd(18)} ${l.uso}  (${l.cor} / ${l.fundo})`));
const out = path.join(__dirname, '..', 'fase2', 'contraste.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ gerado: new Date().toISOString(), pares: linhas }, null, 1));
