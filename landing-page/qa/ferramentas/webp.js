/*
 * Converte uma imagem (PNG ou JPEG) em WebP, em várias larguras, com o codificador do próprio Edge headless
 * (esta máquina não tem cwebp, ImageMagick nem sharp). Opcionalmente aplica um filtro CSS de canvas antes de
 * codificar: é assim que as fotos do Higgsfield são puxadas para a paleta (laranja → Trigo, verde → Floresta).
 * Não precisa do servidor: a imagem entra como data URL numa aba about:blank.
 *
 * Uso: node qa/ferramentas/webp.js <entrada> <saida-sem-extensao> <larguras> [qualidade=0.8] [filtro-css]
 *   ex.: node qa/ferramentas/webp.js foto.png assets/img/hero-campo 960,1600,2400 0.78 "hue-rotate(9deg) saturate(.85)"
 *   gera assets/img/hero-campo-960.webp, -1600.webp e -2400.webp (nunca maior que a original)
 */
const fs = require('fs');
const path = require('path');
const { session } = require('./cdp');

const [entrada, saida, larguras, qualidade, filtro] = process.argv.slice(2);
if (!entrada || !saida || !larguras) { console.error('uso: node qa/ferramentas/webp.js <entrada> <saida> <larguras> [qualidade] [filtro]'); process.exit(1); }
const tipo = /\.png$/i.test(entrada) ? 'image/png' : 'image/jpeg';
const dados = fs.readFileSync(entrada).toString('base64');
const ws = larguras.split(',').map(Number);
const q = Number(qualidade) || 0.8;

session('webp', { W: 400, H: 300, out: path.join(process.env.TEMP || '.', 'tca-webp') }, async (h) => {
  await h.go('about:blank');
  const r = await h.ev(`
    const bin = await (await fetch('data:${tipo};base64,${dados}')).blob();
    const original = await createImageBitmap(bin);
    const saidas = [];
    for (const w of ${JSON.stringify(ws)}) {
      const larg = Math.min(w, original.width), alt = Math.round(original.height * larg / original.width);
      const bmp = await createImageBitmap(bin, { resizeWidth: larg, resizeHeight: alt, resizeQuality: 'high' });
      const tela = new OffscreenCanvas(larg, alt), ctx = tela.getContext('2d');
      ctx.filter = ${JSON.stringify(filtro || 'none')};
      ctx.drawImage(bmp, 0, 0);
      const blob = await tela.convertToBlob({ type: 'image/webp', quality: ${q} });
      const buf = new Uint8Array(await blob.arrayBuffer());
      let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      saidas.push({ w: larg, h: alt, b64: btoa(s) });
    }
    return saidas;`);
  r.forEach((o) => {
    const f = `${saida}-${o.w}.webp`;
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, Buffer.from(o.b64, 'base64'));
    console.log(f, o.w + '×' + o.h, Math.round(fs.statSync(f).size / 1024) + ' KB');
  });
}).then((res) => { if (res.erro) process.exitCode = 1; });
