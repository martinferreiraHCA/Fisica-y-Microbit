// Sensores de la extensión FisicaBit de MakeCode (pxt-fisicabit-usb).
//
// La extensión trae, para el simulador de MakeCode, el dibujo de cada sensor (parts/*.svg) y cómo se
// conecta (pxtparts.json). Este módulo lee esos mismos archivos para que el editor de circuitos y el
// panel de MakeCode del sitio muestren el sensor igual que el simulador: mismo dibujo, mismas patas,
// misma conexión y los mismos bloques. Un sensor nuevo en la extensión aparece solo en el sitio.
//
//   digerir(fuentes)  → { firma, partes: [parte] }      (puro: sirve en el navegador y en Node)
//   cargarPartes(avisar) → Promise<{ partes }>           (copia del sitio → última leída → GitHub)
//
//   parte = { id, titulo, svg, w, h, paso, pines: [{ n, x, y, rol, destino, param }], bloques: [{ fn, id, texto }],
//             programa, conexion }
//     pines    en el orden en que están en el módulo (de izquierda a derecha). rol: 'vcc' | 'gnd' | 'io' | 'pas'
//              destino: a qué pin de la micro:bit lo lleva MakeCode ('3V', 'GND', 'P8'…; null = queda libre)
//     programa código de ejemplo (TypeScript de MakeCode) que lee el sensor y lo envía a fisicabit.com
export const REPO = 'martinferreiraHCA/pxt-fisicabit-usb', RAMA = 'main';
const RAW = 'https://raw.githubusercontent.com/' + REPO + '/' + RAMA + '/';
const CLAVE = 'fisicabit_partes_makecode';
// Cada cuánto conviene enviar cuando el programa de ejemplo lee el sensor con un bloque que devuelve un número
const INTERVALO = { ds18b20: 1000 }, INTERVALO_COMUN = 100;

/* ---------- Lectura de los fuentes de la extensión ---------- */
// Funciones con bloque de un archivo .ts: { ns, nombre, fqn, bloque, id, partes, defl: { param: valor }, params: [nombre], devuelve }
export function funciones(ts) {
  const out = []; let ns = '', notas = [];
  for (const cruda of String(ts || '').split('\n')) {
    const l = cruda.trim();
    const n = /^(?:export\s+)?namespace\s+([A-Za-z_]\w*)/.exec(l); if (n) { ns = n[1]; notas = []; continue; }
    if (l.startsWith('//%')) { notas.push(l.slice(3).trim()); continue; }
    const f = /^export\s+function\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?::\s*([A-Za-z_][\w.]*))?/.exec(l);
    if (f && notas.length) {
      const t = notas.join('\n'), uno = (re) => { const m = re.exec(t); return m ? m[1] : ''; }, defl = {};
      t.replace(/([A-Za-z_]\w*)\.defl=(\S+)/g, (_, k, v) => { defl[k] = v; return _; });
      out.push({ ns, nombre: f[1], fqn: ns + '.' + f[1], bloque: uno(/(?:^|\s)block="([^"]*)"/), id: uno(/(?:^|\s)blockId=(\S+)/), partes: uno(/(?:^|\s)parts="([^"]*)"/).split(/[\s,]+/).filter(Boolean), defl,
        params: f[2].split(',').map((p) => p.split(':')[0].trim()).filter(Boolean), devuelve: f[3] || 'void' });
    }
    if (l && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*')) notas = [];
  }
  return out;
}
const num = (v) => { const x = parseFloat(v); return isFinite(x) ? x : 0; };
const atr = (tag, k) => { const m = new RegExp('\\s' + k + '="([^"]*)"').exec(tag); return m ? m[1] : ''; };
const sinEntidades = (s) => s.replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d)).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
// Textos del dibujo: los rótulos de las patas están girados; el nombre del sensor es el texto derecho más grande
function textos(svg) {
  const out = [];
  String(svg).replace(/<text\b([^>]*)>([^<]*)<\/text>/g, (_, a, t) => { out.push({ x: num(atr(' ' + a, 'x')), tam: num(atr(' ' + a, 'font-size')), girado: /rotate\(/.test(a), t: sinEntidades(t) }); return _; });
  return out;
}
const PIN = (v) => { const m = /P(\d+)$/.exec(String(v || '')); return m ? 'P' + m[1] : ''; };

// fuentes = { partes: objeto de pxtparts.json, svgs: { 'parts/x.svg': texto }, ts: [texto de cada .ts], textos: objeto de strings (es) }
export function digerir(fuentes) {
  const fs = (fuentes.ts || []).flatMap(funciones), tx = fuentes.textos || {}, partes = [];
  for (const [id, p] of Object.entries(fuentes.partes || {})) {
    const v = p.visual || {}, svg = (fuentes.svgs || {})[v.image]; if (!svg || !(v.pinLocations || []).length) continue;
    const ts = textos(svg), rot = ts.filter((t) => t.girado && t.t).sort((a, b) => a.x - b.x), y = v.pinLocations[0].y;
    const titulo = (ts.filter((t) => !t.girado && t.t.length > 2).sort((a, b) => b.tam - a.tam)[0] || { t: id.toUpperCase() }).t;
    const usan = fs.filter((f) => f.partes.includes(id)), roles = (p.instantiations || []).flatMap((i) => i.argumentRoles || []);
    const predeterminado = (param) => { for (const f of usan) if (PIN(f.defl[param])) return PIN(f.defl[param]); return ''; };
    // de cada pata con conexión: a dónde va
    const con = v.pinLocations.map((loc, j) => { const t = (p.pinDefinitions || [])[j] && p.pinDefinitions[j].target;
      if (t === 'threeVolt') return { x: loc.x, rol: 'vcc', destino: '3V' }; if (t === 'ground') return { x: loc.x, rol: 'gnd', destino: 'GND' };
      const r = t && typeof t === 'object' ? roles.find((q) => q.pinInstantiationIdx === t.pinInstantiationIdx) : null, param = r ? r.partParameter : '';
      return { x: loc.x, rol: 'io', destino: predeterminado(param) || null, param }; });
    const nombreDe = (c) => (c.rol === 'vcc' ? 'VCC' : c.rol === 'gnd' ? 'GND' : (c.param || 'S').replace(/pin$/i, '').toUpperCase() || 'DAT');
    const pines = (rot.length >= con.length ? rot.map((t) => ({ n: t.t, x: t.x })) : con.map((c) => ({ n: nombreDe(c), x: c.x })))
      .map((q) => { const c = con.find((k) => Math.abs(k.x - q.x) < 1.5); return { n: q.n, x: q.x, y, rol: c ? c.rol : 'pas', destino: c ? c.destino : null, param: c ? c.param || '' : '' }; });
    // texto del bloque en español, con cada casillero mostrando su valor inicial cuando es un pin o un número
    const casilleros = (t, f) => t.replace(/%([A-Za-z_]\w*)/g, (_, k) => '[' + (PIN(f.defl[k]) || (/^-?[\d.]+$/.test(f.defl[k] || '') ? f.defl[k] : '…')) + ']');
    const bloques = usan.filter((f) => f.bloque).map((f) => ({ fn: f.fqn, id: f.id, texto: casilleros(tx[f.fqn + '|block'] || f.bloque, f) }));
    // programa de ejemplo: el bloque «enviar …» del sensor si lo tiene; si no, el que devuelve la medida, dentro de «enviar a fisicabit.com»
    const completa = (f) => f.params.every((k) => f.defl[k] != null), llamada = (f) => f.fqn + '(' + f.params.map((k) => f.defl[k]).join(', ') + ')';
    const envia = usan.find((f) => /^send/i.test(f.nombre) && f.devuelve === 'void' && completa(f)), mide = usan.find((f) => f.devuelve === 'number' && completa(f));
    const programa = envia ? 'basic.forever(function () {\n    ' + llamada(envia) + '\n})\n'
      : mide ? 'basic.forever(function () {\n    fisicabitSerial.send1(' + llamada(mide) + ', ' + (INTERVALO[id] || INTERVALO_COMUN) + ')\n})\n' : '';
    partes.push({ id, titulo, svg, w: num(v.width), h: num(v.height), paso: num(v.pinDistance) || 20, pines, bloques, programa,
      conexion: pines.filter((q) => q.destino).map((q) => q.n + ' → ' + q.destino).join(' · ') });
  }
  return { firma: JSON.stringify(partes).length + ':' + partes.map((p) => p.id + p.svg.length).join(','), partes };
}

/* ---------- Carga ---------- */
// Lee la extensión tal como está hoy en GitHub. leer(ruta) → Promise<texto>
export async function deGitHub(leer) {
  const pxt = JSON.parse(await leer('pxt.json')), archivos = pxt.files || [];
  const partes = JSON.parse(await leer('pxtparts.json'));
  const imgs = [...new Set(Object.values(partes).map((p) => p.visual && p.visual.image).filter(Boolean))];
  const tsN = archivos.filter((f) => /\.ts$/.test(f) && !/\.d\.ts$/.test(f));
  const es = archivos.find((f) => /_locales\/es\/.*-strings\.json$/.test(f) && !/jsdoc/.test(f));
  const [svgsL, ts, textos] = await Promise.all([Promise.all(imgs.map(leer)), Promise.all(tsN.map(leer)), es ? leer(es).then(JSON.parse).catch(() => ({})) : {}]);
  return digerir({ partes, svgs: Object.fromEntries(imgs.map((k, i) => [k, svgsL[i]])), ts, textos });
}
const conPlazo = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('sin respuesta')), ms))]);
let cargaP = null, actual = { firma: '', partes: [] };
export const partes = () => actual.partes;
export const parte = (id) => actual.partes.find((p) => p.id === id) || null;
// Deja lista la mejor versión disponible y avisa cada vez que cambia: primero la copia que viene con el sitio
// (o la última leída, guardada en este navegador) y después, si hay red, la de GitHub.
export function cargarPartes(avisar) {
  const poner = (d) => { if (d && Array.isArray(d.partes) && d.partes.length && d.firma !== actual.firma) { actual = d; if (avisar) try { avisar(d); } catch (e) { console.error(e); } } };
  if (!cargaP) cargaP = (async () => {
    try { const g = JSON.parse(localStorage.getItem(CLAVE) || 'null'); if (g) poner(g); } catch (e) {}
    if (!actual.partes.length) try { poner(await (await fetch(new URL('./partes/partes.json', import.meta.url))).json()); } catch (e) { console.warn('Sensores de MakeCode: no se pudo leer la copia del sitio.', e.message); }
    try {
      const d = await conPlazo(deGitHub((ruta) => fetch(RAW + ruta, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(ruta + ' ' + r.status); return r.text(); })), 12000);
      if (d.partes.length) { poner(d); try { localStorage.setItem(CLAVE, JSON.stringify(d)); } catch (e) {} }
    } catch (e) { /* sin red o sin GitHub: queda la copia */ }
    return actual;
  })();
  else if (avisar && actual.partes.length) avisar(actual);
  return cargaP;
}

/* ---------- Dibujo ---------- */
// El SVG del sensor como elemento anidado, con sus ids propios (para poder repetirlo en un mismo dibujo)
export function svgAnidado(p, attrs = '') {
  let dentro = p.svg.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, ''); const pre = 'fbp-' + p.id + '-';
  [...new Set((dentro.match(/\sid="([^"]+)"/g) || []).map((s) => s.slice(5, -1)))].forEach((id) => {
    const q = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    dentro = dentro.replace(new RegExp('(\\sid=")' + q + '"', 'g'), '$1' + pre + id + '"').replace(new RegExp('(url\\(#|href="#)' + q + '(?=[)"])', 'g'), '$1' + pre + id);
  });
  return '<svg ' + attrs + ' viewBox="0 0 ' + p.w + ' ' + p.h + '" overflow="visible">' + dentro + '</svg>';
}
// Código → enlace que abre el editor de MakeCode del sitio con ese programa (mismo formato que «Abrir en el editor»)
export const enlaceMakeCode = (base, nombre, codigo) => base + '#makecode=' + encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify({ nombre, codigo })))));
