/*
 * Servidor estático mínimo para testar a landing localmente (sem dependências; esta máquina não tem Python).
 * Uso: node qa/ferramentas/servidor.js [porta]   → http://127.0.0.1:4410/
 * Serve a pasta landing-page/ (dois níveis acima deste arquivo). Responde 404 de verdade para o QA contar.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..', '..');
const PORTA = Number(process.argv[2]) || 4410;
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8', '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let rota = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rota.endsWith('/')) rota += 'index.html';
  const arquivo = path.join(RAIZ, path.normalize(rota));
  if (!arquivo.startsWith(RAIZ)) { res.writeHead(403); res.end(); return; }
  fs.readFile(arquivo, (erro, dados) => {
    if (erro) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404'); console.log('404', rota); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(dados);
  });
}).listen(PORTA, '127.0.0.1', () => console.log('servindo ' + RAIZ + ' em http://127.0.0.1:' + PORTA + '/'));
