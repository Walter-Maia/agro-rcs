/*
 * Compara duas imagens do mesmo tamanho pixel a pixel (RGB, via ffmpeg rawvideo, sem dependências).
 * Uso: node qa/ferramentas/comparar-png.js a.png b.png  → JSON com a maior diferença por canal e quantos pixels passam de 32 e de 96
 */
const { execFileSync } = require('child_process');
function rgb(arq) {
  const info = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', arq]).toString().trim().split(',').map(Number);
  return { w: info[0], h: info[1], px: execFileSync('ffmpeg', ['-v', 'error', '-i', arq, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 }) };
}
function comparar(a, b) {
  const A = rgb(a), B = rgb(b);
  if (A.w !== B.w || A.h !== B.h) throw new Error('tamanhos diferentes');
  let maior = 0, acima32 = 0, acima96 = 0, soma = 0;
  const n = A.w * A.h;
  for (let i = 0; i < n; i++) {
    const d = Math.max(Math.abs(A.px[i * 3] - B.px[i * 3]), Math.abs(A.px[i * 3 + 1] - B.px[i * 3 + 1]), Math.abs(A.px[i * 3 + 2] - B.px[i * 3 + 2]));
    soma += d; if (d > maior) maior = d; if (d > 32) acima32++; if (d > 96) acima96++;
  }
  return { pixels: n, maiorDiferenca: maior, mediaDiferenca: +(soma / n).toFixed(3), acimaDe32: acima32, acimaDe32Pct: +(acima32 / n * 100).toFixed(3), acimaDe96: acima96 };
}
if (require.main === module) console.log(JSON.stringify(comparar(process.argv[2], process.argv[3])));
module.exports = { comparar };
