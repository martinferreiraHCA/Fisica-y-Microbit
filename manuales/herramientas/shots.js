const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const CDN = path.join(__dirname, 'cdn');
const fontmap = {};
fs.readFileSync(path.join(CDN, 'fontmap.txt'), 'utf8').trim().split('\n').forEach(l => {
  const [f, u] = l.split(' '); fontmap[u] = f;
});

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'es-ES' });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { localStorage.setItem('microbit-language', 'es'); } catch (e) {} });

  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith('http://localhost:8765')) return route.continue();
    if (url.includes('googletagmanager') || url.includes('plot.ly') || url.includes('mathjs')) return route.abort();
    if (url.includes('cdn.jsdelivr.net')) {
      const p = path.join(CDN, url.split('/').pop());
      return fs.existsSync(p) ? route.fulfill({ path: p, contentType: 'application/javascript' }) : route.abort();
    }
    if (url.includes('fonts.googleapis.com/css2'))
      return route.fulfill({ path: path.join(CDN, url.includes('ital') ? 'mont1.css' : 'mont2.css'), contentType: 'text/css' });
    if (url.includes('fonts.gstatic.com')) {
      const f = fontmap[url];
      return f ? route.fulfill({ path: path.join(CDN, f), contentType: 'font/woff2' }) : route.abort();
    }
    return route.abort();
  });

  page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0, 160)));
  await page.goto('http://localhost:8765/index.html', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);

  const shot = (name, opts = {}) => page.screenshot({ path: `shots/${name}.png`, ...opts });
  const clipOf = async (sel, pad = 0) => {
    const box = await page.locator(sel).first().boundingBox();
    return { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad),
             width: Math.min(1440 - Math.max(0, box.x - pad), box.width + 2 * pad),
             height: Math.min(900 - Math.max(0, box.y - pad), box.height + 2 * pad) };
  };
  // expand the panel-section that contains a given element id, collapse others
  const openSection = (id) => page.evaluate((id) => {
    document.querySelectorAll('.panel-section').forEach(sec => {
      const header = sec.querySelector('.section-header');
      const content = sec.querySelector('.section-content');
      if (!header || !content) return;
      const has = !!sec.querySelector('#' + id);
      const collapsed = content.classList.contains('collapsed');
      if (has && collapsed) header.click();
      if (!has && !collapsed && !sec.querySelector('#dataTable')) header.click();
    });
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ block: 'center' });
  }, id);

  // ---- 01 pantalla principal
  await shot('01_pantalla_principal');
  // ---- 02 toolbar
  await shot('02_toolbar', { clip: await clipOf('.toolbar', 0) });

  // ---- 03 panel VARIABLES
  await openSection('applyVarConfigBtn');
  await page.evaluate(() => {
    const d = document.getElementById('microbitCodeHelp'); if (d) d.open = true;
    const sec = document.getElementById('applyVarConfigBtn').closest('.panel-section');
    sec.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(500);
  {
    const box = await page.evaluate(() => {
      const sec = document.getElementById('applyVarConfigBtn').closest('.panel-section');
      const r = sec.getBoundingClientRect();
      return { x: r.x, y: Math.max(0, r.y), w: r.width, h: r.height };
    });
    await shot('03_config_variables', { clip: { x: box.x, y: box.y, width: Math.min(box.w, 1440 - box.x), height: Math.min(box.h, 900 - box.y) } });
  }

  // ---- 04 modal guía Bluetooth (render directo: headless no tiene Web Bluetooth)
  await page.evaluate(() => {
    const d = document.getElementById('inf-dialog'); if (d) d.classList.remove('open');
    renderBtPairingModal();
    document.getElementById('btPairingModal').classList.add('active');
  });
  await page.waitForTimeout(800);
  const btVisible = await page.evaluate(() => {
    const m = document.getElementById('btPairingModal');
    return m && getComputedStyle(m).display !== 'none' && m.classList.contains('active');
  });
  console.log('bt modal visible:', btVisible);
  await shot('04_bluetooth_modal');
  await page.evaluate(() => {
    const m = document.getElementById('btPairingModal'); if (m) m.classList.remove('active');
    const d = document.getElementById('inf-dialog'); if (d) d.classList.remove('open');
  });
  await page.waitForTimeout(400);

  // ---- 05 estado CONECTADO (simulado)
  await page.evaluate(() => {
    state.isConnected = true; state.isBluetooth = true;
    document.getElementById('connectBtn').style.display = 'none';
    document.getElementById('connectBluetoothBtn').style.display = 'none';
    document.getElementById('collectBtn').style.display = 'inline-block';
    document.getElementById('statusText').textContent = 'CONECTADO — Presiona CAPTURAR';
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await shot('05_conectado', { clip: await clipOf('.toolbar', 0) });

  // ---- 06 CAPTURANDO con datos llegando
  await page.click('#collectBtn');
  await page.waitForTimeout(300);
  // inyectar señal: oscilación amortiguada (acelerómetro X de un péndulo), 10 Hz
  const inject = (from, to) => page.evaluate(([from, to]) => {
    const t0 = state.timeZeroOffset;
    let seed = 42;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 - 0.5; };
    for (let i = 0; i < from; i++) { rnd(); } // advance seed deterministically
    for (let i = from; i < to; i++) {
      const ts = i * 100; // ms desde inicio de captura (timestamp del micro:bit)
      const tsec = ts / 1000;
      const v = Math.round(920 * Math.exp(-tsec / 9) * Math.cos(2 * Math.PI * 0.55 * tsec) + rnd() * 16);
      const dp = { time: t0 + ts, wallTime: t0 + ts, values: [v], id: 'd' + (++_dataPointCounter) };
      state.rawData.push(dp); pendingChartPoints.push(dp); sampleTimestamps.push(t0 + ts);
    }
  }, [from, to]);
  await inject(0, 130);
  await page.waitForTimeout(1200);
  await shot('06_capturando');

  // ---- 07 captura finalizada (30 s de datos)
  await inject(130, 300);
  await page.waitForTimeout(1200);
  await page.click('#stopBtn');
  await page.waitForTimeout(1200);
  await shot('07_captura_finalizada');


  // clip de la sección DATOS (tabla) en vista CONFIG
  const openDataSection = async () => {
    await page.evaluate(() => {
      setViewMode('config');
      document.querySelectorAll('.panel-section').forEach(sec => {
        const header = sec.querySelector('.section-header');
        const content = sec.querySelector('.section-content');
        if (!header || !content) return;
        const isData = !!sec.querySelector('#dataTableBody');
        if (isData && content.classList.contains('collapsed')) header.click();
        if (!isData && !content.classList.contains('collapsed')) header.click();
      });
      const sec = document.getElementById('dataTableBody').closest('.panel-section');
      sec.scrollIntoView({ block: 'start' });
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(800);
  };
  const dataSectionClip = () => page.evaluate(() => {
    const sec = document.getElementById('dataTableBody').closest('.panel-section');
    const r = sec.getBoundingClientRect();
    return { x: r.x, y: Math.max(140, r.y), width: r.width, height: Math.min(r.height, 760) };
  });

  // ---- 08 tabla de datos (vista CONFIG, sección DATOS)
  await openDataSection();
  await shot('08_tabla_datos', { clip: await dataSectionClip() });

  // ---- 09 seleccionar el punto nº 21 en la tabla
  await page.evaluate(() => {
    const rows = document.querySelectorAll('#dataTableBody tr');
    if (rows[20]) rows[20].click();
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const rows = document.querySelectorAll('#dataTableBody tr');
    if (rows[20]) rows[20].scrollIntoView({ block: 'center' });
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  await shot('09_fila_seleccionada', { clip: await dataSectionClip() });

  // punto seleccionado visto en la gráfica
  await page.evaluate(() => { setViewMode('graph'); window.scrollTo(0, 0); });
  await page.waitForTimeout(900);
  await shot('09_punto_seleccionado');

  // ---- 10 ESTABLECER T=0 (vista CONFIG)
  await page.evaluate(() => setViewMode('config'));
  await page.waitForTimeout(800);
  await openSection('setZeroBtn');
  await page.waitForTimeout(500);
  const zeroEnabled = await page.evaluate(() => !document.getElementById('setZeroBtn').disabled);
  console.log('setZeroBtn enabled:', zeroEnabled);
  {
    await page.evaluate(() => document.getElementById('setZeroBtn').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(400);
    const b2 = await page.evaluate(() => {
      const r = document.getElementById('setZeroBtn').getBoundingClientRect();
      return { x: r.x, y: r.y };
    });
    const y0 = Math.max(140, b2.y - 320);
    await shot('10_establecer_t0', { clip: { x: 0, y: y0, width: 1440, height: Math.min(520, 900 - y0) } });
  }

  // ---- 11 T=0 aplicado
  await page.evaluate(() => document.getElementById('setZeroBtn').click());
  await page.waitForTimeout(800);
  await page.evaluate(() => { setViewMode('graph'); window.scrollTo(0, 0); });
  await page.waitForTimeout(1000);
  await shot('11_t0_aplicado');
  await openDataSection();
  await shot('11_tabla_t0', { clip: await dataSectionClip() });

  // ---- 12 depuración de datos
  await openSection('deleteRangeBtn');
  await page.fill('#deleteRangeFrom', '1');
  await page.fill('#deleteRangeTo', '10');
  await page.evaluate(() => { const e = new Event('input', {bubbles:true}); document.getElementById('deleteRangeTo').dispatchEvent(e); document.getElementById('deleteRangeFrom').dispatchEvent(e); });
  await page.waitForTimeout(500);
  await shot('12_depuracion', { clip: await clipOf('.side-panel') });

  // ---- 12 exportar CSV
  const dl = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
  await page.click('#exportBtn');
  const d = await dl;
  if (d) { await d.saveAs('shots/datos_exportados.csv'); console.log('csv saved:', d.suggestedFilename()); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await shot('13_exportar', { clip: await clipOf('.toolbar', 0) });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
