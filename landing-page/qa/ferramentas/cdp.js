/*
 * Cliente CDP mínimo: um Chrome (ou Edge) headless por sessão, perfil próprio e descartável.
 * Adaptado de "landing page siteflux/qa/auditoria-qa-2026-09-22/ferramentas/confirm/lib.js" (mesma ideia de
 * session(nome, opts, fn)), trocando o WebSocket manual pelo WebSocket nativo do Node ≥ 22 e registrando
 * erros de console, exceções e respostas ≥ 400 de cada sessão.
 * Requer Node ≥ 22 (aqui: %LOCALAPPDATA%\nvm\v24.6.0\node.exe) e o servidor de qa/ferramentas/servidor.js.
 */
const { spawn, execFileSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

/* 28/10: o Chrome headless vem antes do Edge quando está instalado. O Edge headless põe a aba em "hidden" 10 a 14 s
   depois de abrir (rAF a zero, roda do mouse sem resposta e, minutos depois, o JS parado), até numa página em
   branco e mesmo com os flags de oclusão abaixo; o Chrome segue a 240 quadros/s. BROWSER escolhe outro. */
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const EDGE = process.env.BROWSER || (fs.existsSync(CHROME) ? CHROME : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
const BASE = process.env.BASE || 'http://127.0.0.1:4410/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJson(url) {
  return new Promise((ok, falha) => http.get(url, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => { try { ok(JSON.parse(b)); } catch (e) { falha(e); } }); }).on('error', falha));
}

function conectar(wsUrl) {
  return new Promise((ok, falha) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pendentes = new Map(), ouvintes = new Map();
    ws.onopen = () => ok({
      send(method, params) {
        const meu = ++id;
        ws.send(JSON.stringify({ id: meu, method, params: params || {} }));
        return new Promise((res, rej) => pendentes.set(meu, { res, rej }));
      },
      on(method, cb) { if (!ouvintes.has(method)) ouvintes.set(method, []); ouvintes.get(method).push(cb); },
      close() { try { ws.close(); } catch (e) { /* */ } }
    });
    ws.onerror = (e) => falha(e);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id) { const p = pendentes.get(msg.id); if (p) { pendentes.delete(msg.id); msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result); } }
      else (ouvintes.get(msg.method) || []).forEach((cb) => { try { cb(msg.params); } catch (e) { console.error(e); } });
    };
  });
}

/* Browser.close no alvo do navegador (não da aba): encerra o Edge e todos os processos filhos */
async function fecharNavegador(PORT) {
  try {
    const v = await getJson(`http://127.0.0.1:${PORT}/json/version`);
    await new Promise((ok) => {
      const ws = new WebSocket(v.webSocketDebuggerUrl);
      const fim = setTimeout(ok, 3000);
      ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      ws.onclose = () => { clearTimeout(fim); ok(); };
      ws.onerror = () => { clearTimeout(fim); ok(); };
    });
  } catch (e) { /* o navegador já não responde */ }
}

/*
 * opts: { W, H, dpr=1, mobile=false, touch=false, rm=false, cpu=1, js=true, intro=false, out }
 *   intro=false: a sessão já nasce "vista" (sessionStorage tca-intro=1), então a página carrega sem a abertura;
 *   os testes da abertura passam intro: true.
 * fn(h): h = { cdp, ev, key, mouse, tap, shot, go, setVp, rolarAte, problemas, result, base }
 */
async function session(nome, opts, fn) {
  const o = Object.assign({ W: 1440, H: 900, dpr: 1, mobile: false, touch: false, rm: false, cpu: 1, js: true, intro: false }, opts);
  const OUT = o.out || path.join(__dirname, '..', 'fase2');
  const SHOTS = path.join(OUT, 'capturas');
  fs.mkdirSync(SHOTS, { recursive: true });
  const PORT = 9600 + Math.floor(Math.random() * 300);
  const perfil = path.join(process.env.TEMP || '.', 'tca-qa-' + PORT);
  /* sem oclusão nem segundo plano: a janela headless é invisível, e nada dela pode ser tratado como aba de fundo */
  const proc = spawn(EDGE, ['--headless=new', '--mute-audio', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
    '--disable-features=CalculateNativeWinOcclusion', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-background-timer-throttling',
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${perfil}`, `--window-size=${o.W},${o.H}`, 'about:blank'], { stdio: 'ignore' });
  /* no JSON, a pasta de saída vai relativa ao projeto (sem caminho da máquina) */
  const result = { nome, opts: Object.assign({}, o, { out: path.relative(path.join(__dirname, '..', '..'), OUT).replace(/\\/g, '/') }), inicio: new Date().toISOString() };
  const problemas = { console: [], excecoes: [], respostas: [], falhas: [] };
  let cdp;
  try {
    let alvos;
    for (let i = 0; i < 80; i++) { await sleep(250); try { alvos = await getJson(`http://127.0.0.1:${PORT}/json`); if (alvos && alvos.find((t) => t.type === 'page')) break; } catch (e) { /* subindo */ } }
    if (!alvos || !alvos.find((t) => t.type === 'page')) throw new Error('o Edge não abriu a porta ' + PORT + ' em 20 s');
    cdp = await conectar(alvos.find((t) => t.type === 'page').webSocketDebuggerUrl);
    cdp.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error' || p.type === 'warning') problemas.console.push(p.type + ': ' + p.args.map((a) => a.value || a.description).join(' ')); });
    cdp.on('Runtime.exceptionThrown', (p) => problemas.excecoes.push(p.exceptionDetails.exception ? p.exceptionDetails.exception.description : p.exceptionDetails.text));
    cdp.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') problemas.console.push('log: ' + p.entry.text + (p.entry.url ? ' ' + p.entry.url : '')); });
    cdp.on('Network.responseReceived', (p) => { if (p.response.status >= 400) problemas.respostas.push(p.response.status + ' ' + p.response.url); });
    cdp.on('Network.loadingFailed', (p) => { if (!p.canceled) problemas.falhas.push(p.errorText + ' ' + (p.type || '')); });
    await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Network.enable'); await cdp.send('Log.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    if (!o.intro) await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: "try{sessionStorage.setItem('tca-intro','1')}catch(e){}" });
    const setVp = async (w, h, extra) => {
      const e = Object.assign({ dpr: o.dpr, mobile: o.mobile }, extra || {});
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: e.dpr, mobile: e.mobile, screenWidth: w, screenHeight: h });
    };
    await setVp(o.W, o.H);
    if (o.touch) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: o.rm ? 'reduce' : 'no-preference' }] });
    if (o.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: o.cpu });
    if (!o.js) await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
    const ev = async (expr) => {
      const r = await cdp.send('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception ? (r.exceptionDetails.exception.description || r.exceptionDetails.exception.value) : r.exceptionDetails.text));
      return r.result.value;
    };
    const shot = async (rotulo, full) => {
      const p = { format: 'jpeg', quality: 82 };
      if (full) { const m = await cdp.send('Page.getLayoutMetrics'); p.captureBeyondViewport = true; p.clip = { x: 0, y: 0, width: m.cssContentSize.width, height: m.cssContentSize.height, scale: 1 }; }
      const r = await cdp.send('Page.captureScreenshot', p);
      const f = path.join(SHOTS, `${nome}-${rotulo}.jpg`);
      fs.writeFileSync(f, Buffer.from(r.data, 'base64'));
      return path.relative(path.join(__dirname, '..', '..'), f).replace(/\\/g, '/');
    };
    const codes = { Tab: 9, Escape: 27, Enter: 13, ArrowDown: 40, ArrowUp: 38, Space: 32, End: 35, Home: 36 };
    const key = async (k, mods) => {
      const p = { key: k === 'Space' ? ' ' : k, code: k, windowsVirtualKeyCode: codes[k], nativeVirtualKeyCode: codes[k], modifiers: mods || 0 };
      if (k === 'Enter') p.text = '\r';
      await cdp.send('Input.dispatchKeyEvent', Object.assign({ type: 'rawKeyDown' }, p));
      if (p.text) await cdp.send('Input.dispatchKeyEvent', Object.assign({ type: 'char' }, p));
      await cdp.send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, p));
      await sleep(60);
    };
    const mouse = (type, x, y, extra) => cdp.send('Input.dispatchMouseEvent', Object.assign({ type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', buttons: 0, clickCount: type === 'mouseMoved' ? 0 : 1, pointerType: 'mouse' }, extra || {}));
    const tap = async (x, y) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] }); await sleep(40); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
    const go = async (url) => { await cdp.send('Page.navigate', { url: url || BASE }); await sleep(250); for (let i = 0; i < 60; i++) { if (await ev('return document.readyState').catch(() => '') === 'complete') break; await sleep(100); } };
    /* rola pela roda do mouse (passa pelo Lenis como uma pessoa) até a posição y, em passos */
    const rodar = async (dy, x, y) => cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: x || o.W / 2, y: y || o.H / 2, deltaX: 0, deltaY: dy });
    const h = { cdp, ev, key, mouse, tap, shot, go, setVp, rodar, sleep, problemas, result, base: BASE, opts: o };
    await fn(h);
  } catch (e) {
    result.erro = String(e && e.stack || e);
    console.error(nome, e);
  } finally {
    try { cdp && cdp.close(); } catch (e) { /* */ }
    /* no Windows o processo do spawn é só um lançador que sai na hora: o navegador de verdade fica órfão e o
       proc.kill() não o alcança (em 26/10 sobravam 164 processos e 3,9 GB de perfis no TEMP). Fecha pelo próprio
       CDP (Browser.close derruba a árvore inteira) e, se ainda houver perfil travado, mata pelo caminho dele. */
    await fecharNavegador(PORT);
    try { proc.kill(); } catch (e) { /* já saiu */ }
    for (let i = 0; i < 12; i++) { await sleep(250); try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) { /* ainda travado */ } if (!fs.existsSync(perfil)) break; }
    if (fs.existsSync(perfil) && process.platform === 'win32') {
      try { execFileSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='${path.basename(EDGE)}'" | Where-Object { $_.CommandLine -like '*tca-qa-${PORT}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`], { stdio: 'ignore' }); } catch (e) { /* */ }
      await sleep(500);
      try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) { console.error('perfil ficou no TEMP:', perfil); }
    }
  }
  result.problemas = problemas;
  result.fim = new Date().toISOString();
  return result;
}

module.exports = { session, sleep, BASE };
