/*
 * Confere a copy provisória e a acentuação em pt-BR.
 * 1. O bloco "COPY PROVISÓRIA" do topo do index.html e os elementos com data-copy têm o mesmo texto.
 * 2. Todo data-copy tem o comentário <!-- COPY PROVISÓRIA --> logo antes (ou no grupo).
 * 3. Nenhuma palavra visível (nem aria-label, title ou meta) aparece sem acento numa forma conhecida.
 * Uso (com o servidor rodando): node qa/ferramentas/copy.js  → qa/fase2/copy.json
 */
const fs = require('fs');
const path = require('path');
const { session } = require('./cdp');

const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
const bloco = html.slice(html.indexOf('COPY PROVISÓRIA — todos'), html.indexOf('-->', html.indexOf('COPY PROVISÓRIA — todos')));
const deck = {};
bloco.split('\n').forEach((l) => {
  const m = l.match(/^\s+([a-z0-9.]+) \.+ (.+?)\s*(\[A CONFIRMAR\])?\s*$/);
  if (m) deck[m[1]] = m[2].trim();
});
/* cada data-copy precisa de um "COPY PROVISÓRIA" nas 300 posições anteriores do código */
const semMarca = [...html.matchAll(/data-copy="([^"]+)"/g)].filter((m) => !html.slice(Math.max(0, m.index - 300), m.index).includes('COPY PROVISÓRIA')).map((m) => m[1]);

/* formas sem acento que costumam escapar (palavra inteira, sem diferenciar maiúsculas) */
const SEM_ACENTO = ['solucao', 'solucoes', 'irrigacao', 'producao', 'voce', 'nao', 'agronegocio', 'gestao', 'atuacao', 'endereco', 'conteudo', 'inicio', 'rodape', 'previa', 'sera', 'tambem', 'area', 'areas', 'pratica', 'hidrico', 'aereas', 'aerea', 'calendario', 'proprio', 'maquinas', 'previsao', 'tecnologica', 'informacao', 'informacoes', 'navegacao', 'reservado', 'leituras', 'precisao', 'decisao', 'inovacao', 'missao', 'regiao', 'colheita', 'servico', 'servicos', 'numero', 'agua', 'possivel', 'unico', 'lavoura', 'chao', 'confirmacao', 'pivo', 'equipe', 'conheca', 'negocio', 'comeca', 'analise', 'indicadores', 'faceis', 'facil', 'intervir', 'video', 'midia', 'pecuaria', 'equilibrio', 'graos', 'periodo', 'cafe', 'feijao', 'galpao'];
const ACENTUADAS_OK = new Set(['reservado', 'leituras', 'colheita', 'lavoura', 'equipe', 'indicadores', 'intervir']);

session('copy', { W: 1440, H: 900, out: path.join(__dirname, '..', 'fase2') }, async (h) => {
  await h.go(h.base); await h.sleep(1200);
  const pagina = await h.ev(`
    const el = {}; document.querySelectorAll('[data-copy]').forEach(e => {
      const k = e.getAttribute('data-copy');
      el[k] = e.tagName === 'META' ? e.content : e.hasAttribute('data-texto') ? e.getAttribute('data-texto') : e.textContent.replace(/\\s+/g, ' ').trim();
    });
    const extras = [...document.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label')).concat([document.title, document.querySelector('meta[name=description]').content]);
    return { el, visivel: document.body.innerText + '\\n' + extras.join('\\n') }`);
  const diferencas = [];
  Object.keys(deck).forEach((k) => { if (!(k in pagina.el)) diferencas.push({ chave: k, problema: 'está no bloco do topo e não na página' }); else if (pagina.el[k] !== deck[k]) diferencas.push({ chave: k, bloco: deck[k], pagina: pagina.el[k] }); });
  Object.keys(pagina.el).forEach((k) => { if (!(k in deck)) diferencas.push({ chave: k, problema: 'está na página e não no bloco do topo' }); });
  const palavras = pagina.visivel.toLowerCase().match(/[a-zà-ú]+/g) || [];
  const suspeitas = [...new Set(palavras.filter((p) => SEM_ACENTO.includes(p) && !ACENTUADAS_OK.has(p)))];
  const acentuadas = [...new Set(palavras.filter((p) => /[à-ú]/.test(p)))].sort();
  h.result.chaves = Object.keys(deck).length;
  h.result.diferencas = diferencas;
  h.result.semComentario = semMarca;
  h.result.semAcentoSuspeitas = suspeitas;
  h.result.palavrasAcentuadas = acentuadas;
}).then((r) => {
  fs.writeFileSync(path.join(__dirname, '..', 'fase2', 'copy.json'), JSON.stringify(r, null, 1));
  console.log(JSON.stringify({ chaves: r.chaves, diferencas: r.diferencas, semComentario: r.semComentario, semAcentoSuspeitas: r.semAcentoSuspeitas, palavrasAcentuadas: r.palavrasAcentuadas, erro: r.erro, problemas: r.problemas }, null, 1));
});
