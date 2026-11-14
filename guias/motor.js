// Motor de la herramienta de guías: OpenSCAD en un worker, lectura de STL,
// separación de piezas, catálogo del sitio y parámetros de los diseños.
const OPENSCAD_URL = new URL('../lib/openscad.js', import.meta.url).href;
const LIB_CARTON_URL = new URL('../lib/fisicabit-carton.scad', import.meta.url).href;
const API = 'https://api.github.com/repos/martinferreiraHCA/Fisica-y-Microbit/contents/';
export const CARPETAS = { '3d': 'diseños 3d', carton: 'diseños carton' };
const SEPARAR = 0.05;   // mm que se achica cada placa de cartón para separar las piezas del armado

/* ---------- OpenSCAD (worker) ---------- */
function workerSource() {
  return `
self.addEventListener('error', function (e) { e.preventDefault(); });
async function renderOnce(mod, job, logs, manifold) {
  var scad = await mod.createOpenSCAD({ print: function (t) { logs.push(t); }, printErr: function (t) { logs.push(t); } });
  var inst = scad.getInstance();
  var files = job.files || {};
  for (var k in files) if (Object.prototype.hasOwnProperty.call(files, k)) inst.FS.writeFile(k, files[k]);
  inst.FS.writeFile('/input.scad', job.code);
  var out = '/output.' + (job.out || 'stl');
  var args = ['/input.scad', '-o', out];
  (job.defs || []).forEach(function (d) { args.push('-D', d); });
  if (manifold) args.push('--backend=Manifold');
  inst.callMain(args);
  return inst.FS.readFile(out, { encoding: 'utf8' });
}
self.onmessage = async function (e) {
  var id = e.data.id, logs = [];
  try {
    var mod = await import(e.data.url);
    var txt;
    try { txt = await renderOnce(mod, e.data, logs, true); }
    catch (err1) {
      if (logs.some(function (l) { return /error/i.test(l); })) throw err1;
      txt = await renderOnce(mod, e.data, logs, false);
    }
    self.postMessage({ id: id, ok: true, text: txt, logs: logs });
  } catch (err) {
    var msg = err && err.message ? String(err.message) : String(err);
    if (msg === '[object Object]') msg = 'el código no generó ninguna pieza';
    self.postMessage({ id: id, ok: false, error: msg, logs: logs });
  }
};`;
}
let worker = null, seq = 0;
const pend = new Map();
function getWorker() {
  if (worker) return worker;
  worker = new Worker(URL.createObjectURL(new Blob([workerSource()], { type: 'text/javascript' })), { type: 'module' });
  worker.onmessage = (e) => {
    const p = pend.get(e.data.id); if (!p) return;
    pend.delete(e.data.id); clearTimeout(p.to);
    if (e.data.ok) p.res({ text: e.data.text, logs: e.data.logs });
    else { const er = new Error(mensajeError(e.data)); er.logs = e.data.logs; p.rej(er); }
  };
  worker.onerror = (ev) => { if (ev && ev.preventDefault) ev.preventDefault(); matarWorker('el motor OpenSCAD se detuvo'); };
  return worker;
}
function mensajeError(d) {
  const errs = (d.logs || []).filter((l) => /error/i.test(l));
  return (errs[errs.length - 1] || d.error || 'fallo del motor OpenSCAD').replace(/ in file .*$/, '');
}
function matarWorker(msg) {
  if (worker) { try { worker.terminate(); } catch (e) {} worker = null; }
  pend.forEach((p) => { clearTimeout(p.to); p.rej(new Error(msg)); });
  pend.clear();
}
// job: { code, files?, out?: 'stl'|'svg', defs?: ['var=valor'] } → { text, logs }
export function scad(job) {
  return new Promise((res, rej) => {
    const id = ++seq;
    const to = setTimeout(() => matarWorker('el render tardó demasiado'), 300000);
    pend.set(id, { res, rej, to });
    getWorker().postMessage(Object.assign({ id, url: OPENSCAD_URL }, job));
  });
}

/* ---------- STL ---------- */
export function stlAscii(text) {
  const out = []; const re = /vertex\s+(\S+)\s+(\S+)\s+(\S+)/g; let m;
  while ((m = re.exec(text))) out.push(+m[1], +m[2], +m[3]);
  return new Float32Array(out);
}
export function stlBuffer(buf) {
  const bytes = new Uint8Array(buf); let head = '';
  for (let i = 0; i < Math.min(bytes.length, 400); i++) head += String.fromCharCode(bytes[i]);
  if (/^\s*solid/.test(head) && /facet/.test(head)) return stlAscii(new TextDecoder().decode(bytes));
  if (bytes.length < 84) return new Float32Array(0);
  const dv = new DataView(buf);
  const n = Math.min(dv.getUint32(80, true), Math.floor((bytes.length - 84) / 50));
  const pos = new Float32Array(n * 9); let off = 84;
  for (let t = 0; t < n; t++) { off += 12; for (let k = 0; k < 9; k++) { pos[t * 9 + k] = dv.getFloat32(off, true); off += 4; } off += 2; }
  return pos;
}
// Separa una malla en sus cuerpos sueltos (triángulos conectados por vértices)
export function separar(pos) {
  const n = pos.length / 9; const parent = new Int32Array(n);
  for (let i = 0; i < n; i++) parent[i] = i;
  const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
  const mapa = new Map();
  for (let t = 0; t < n; t++) for (let k = 0; k < 3; k++) {
    const o = t * 9 + k * 3;
    const key = Math.round(pos[o] * 1000) + ',' + Math.round(pos[o + 1] * 1000) + ',' + Math.round(pos[o + 2] * 1000);
    const prev = mapa.get(key);
    if (prev === undefined) mapa.set(key, t); else { const a = find(t), b = find(prev); if (a !== b) parent[a] = b; }
  }
  const grupos = new Map();
  for (let t = 0; t < n; t++) { const r = find(t); if (!grupos.has(r)) grupos.set(r, []); grupos.get(r).push(t); }
  const res = [];
  grupos.forEach((tris) => {
    const p = new Float32Array(tris.length * 9);
    tris.forEach((t, i) => p.set(pos.subarray(t * 9, t * 9 + 9), i * 9));
    res.push(p);
  });
  return res.filter((p) => p.length >= 36);
}
export function volumen(pos) {
  let v = 0;
  for (let i = 0; i < pos.length; i += 9) {
    const ax = pos[i], ay = pos[i + 1], az = pos[i + 2], bx = pos[i + 3], by = pos[i + 4], bz = pos[i + 5], cx = pos[i + 6], cy = pos[i + 7], cz = pos[i + 8];
    v += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
  }
  return Math.abs(v) / 6;
}
export function caja(pos) {
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { const v = pos[i + k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; }
  return { min: mn, max: mx, centro: [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2] };
}
// Lleva el origen de la malla al centro de su caja; devuelve ese centro
export function centrar(pos) {
  const c = caja(pos).centro;
  for (let i = 0; i < pos.length; i += 3) { pos[i] -= c[0]; pos[i + 1] -= c[1]; pos[i + 2] -= c[2]; }
  return c;
}

/* ---------- Catálogo del sitio ---------- */
const bonito = (f) => f.replace(/\.(scad|stl)$/i, '').replace(/[-_]+/g, ' ');
export async function listar(modo) {
  const r = await fetch(API + encodeURIComponent(CARPETAS[modo]) + '?ref=main', { headers: { Accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error('no se pudo leer el catálogo (' + r.status + ')');
  const items = await r.json();
  return items.filter((it) => it.type === 'file' && /\.(scad|stl)$/i.test(it.name))
    .map((it) => ({ nombre: bonito(it.name), archivo: it.name, url: it.download_url, modo, stl: /\.stl$/i.test(it.name) }));
}

/* ---------- Parámetros de un diseño (.scad) ---------- */
export function parametros(code) {
  const res = []; let grupo = '', desc = '';
  const lineas = code.split('\n');
  for (const l of lineas) {
    const g = /^\s*\/\*\s*\[(.+?)\]\s*\*\/\s*$/.exec(l);
    if (g) { grupo = g[1].trim(); if (/^hidden$/i.test(grupo)) break; desc = ''; continue; }
    const c = /^\s*\/\/\s?(.*)$/.exec(l);
    if (c) { desc = c[1].trim(); continue; }
    const m = /^([A-Za-z_]\w*)\s*=\s*(-?\d+(?:\.\d+)?|true|false|"[^"]*")\s*;\s*(?:\/\/\s*(.*))?$/.exec(l.trim());
    if (m && grupo) {
      const p = { nombre: m[1], grupo, desc };
      const v = m[2], com = (m[3] || '').trim();
      if (v === 'true' || v === 'false') { p.tipo = 'bool'; p.valor = v === 'true'; }
      else if (v[0] === '"') {
        p.tipo = 'txt'; p.valor = v.slice(1, -1);
        const o = /^\[([^\]:]+)\]/.exec(com); if (o) p.opciones = o[1].split(',').map((x) => x.trim()).filter(Boolean);
      } else {
        p.tipo = 'num'; p.valor = +v;
        const r = /^\[\s*(-?[\d.]+)\s*:\s*(-?[\d.]+)\s*(?::\s*(-?[\d.]+)\s*)?\]/.exec(com);
        if (r) { p.min = +r[1]; if (r[3] !== undefined) { p.paso = +r[2]; p.max = +r[3]; } else p.max = +r[2]; }
        const o = /^\[([^\]:]+,[^\]:]*)\]/.exec(com); if (o) p.opciones = o[1].split(',').map((x) => +x.trim());
      }
      p.inicial = p.valor; res.push(p);
    }
    if (l.trim()) desc = c ? desc : '';
  }
  return res;
}
// Definiciones -D solo para los parámetros que el usuario cambió
export function definiciones(params) {
  return params.filter((p) => p.valor !== p.inicial).map((p) => p.nombre + '=' + (p.tipo === 'txt' ? '"' + String(p.valor).replace(/"/g, '') + '"' : String(p.valor)));
}

/* ---------- Importar diseños ---------- */
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// Diseño de impresión 3D → una malla
export async function importar3d(code, defs) {
  const r = await scad({ code, out: 'stl', defs });
  const pos = stlAscii(r.text);
  if (!pos.length) throw new Error('el diseño no generó ninguna pieza');
  return pos;
}
// Diseño de cartón → una malla por pieza, ya ubicada como en el armado, con su nombre
let libCarton = null;
export async function importarCarton(code, defs, aviso) {
  if (!libCarton) libCarton = await (await fetch(LIB_CARTON_URL)).text();
  const full = code + '\ninclude <fisicabit-carton.scad>\n';
  const files = { '/fisicabit-carton.scad': libCarton };
  const sep = '$fb_separar=' + SEPARAR;
  aviso && aviso('Armando el diseño…');
  const arm = await scad({ code: full, files, out: 'stl', defs: defs.concat(['vista="armado"', sep]) });
  const piezas = separar(stlAscii(arm.text)).map((pos) => ({ pos, vol: volumen(pos), nombre: null }));
  if (!piezas.length) throw new Error('el diseño no generó ninguna pieza');
  // Nombres: se dibuja el plano de cada pieza con nombre y se empareja por volumen
  try {
    aviso && aviso('Identificando las piezas…');
    const todo = await scad({ code: full, files, out: 'stl', defs: defs.concat(['vista="plano_3d"', sep, '$pieza_listar=true']) });
    const nombres = [];
    todo.logs.forEach((l) => { const m = /PIEZA:(.*?)"?\s*$/.exec(String(l)); if (m) { const n = m[1].replace(/^"/, '').trim(); if (n && !nombres.includes(n)) nombres.push(n); } });
    const cand = [];
    for (const n of nombres) {
      const r = await scad({ code: full, files, out: 'stl', defs: defs.concat(['vista="plano_3d"', sep, '$pieza_sel="' + n.replace(/"/g, '') + '"']) });
      separar(stlAscii(r.text)).forEach((pos) => cand.push({ nombre: n, vol: volumen(pos), usado: false }));
    }
    piezas.forEach((p) => {
      let best = null;
      cand.forEach((c) => { if (c.usado) return; const d = Math.abs(c.vol - p.vol) / Math.max(p.vol, 1e-6); if (d < 0.012 && (!best || d < best.d)) best = { c, d }; });
      if (best) { best.c.usado = true; p.nombre = capital(best.c.nombre.replace(/\s+\d+$/, '')); }
    });
  } catch (e) { /* sin nombres: quedan numeradas */ }
  let k = 0;
  piezas.forEach((p) => { if (!p.nombre) p.nombre = 'Pieza ' + (++k); });
  return piezas;
}
