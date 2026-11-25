// Dibujos realistas de la protoboard (estilo «Realista»): la placa, la micro:bit, los cables y las piezas.
// Dos fuentes de arte:
//   · Wokwi Elements (MIT, © Uri Shaked; ../lib/wokwi-elements.bundle.min.js): se instancia cada elemento una sola
//     vez fuera de pantalla, se copia su SVG ya resuelto a un <symbol> y en el lienzo va como <use>. No queda ningún
//     componente web en el dibujo: el SVG y el PNG exportados son autocontenidos.
//   · Dibujos propios (colores planos, al estilo de Tinkercad) para lo que Wokwi no trae.
// Las posiciones de los terminales no cambian: las da la forma de siempre (app.js) y el arte se acomoda a ellas.
import { EXTENSOR, caps } from './microbit.js';

const G = 20;
const N = (n) => Math.round(n * 100) / 100;
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cabe = (s, ancho, max) => Math.min(max, ancho / Math.max(1, String(s).length * 0.7));
function T(s, x, y, o = {}) {   // texto; o = { t, w, a, c, deg (giro del grupo, para dejarlo derecho), halo (color del borde) }
  const t = o.t || 11, giro = o.deg ? ` transform="rotate(${N(-o.deg)} ${N(x)} ${N(y)})"` : '';
  return `<text x="${N(x)}" y="${N(y + t * 0.36)}" font-family="Montserrat, Arial, sans-serif" font-size="${N(t)}" font-weight="${o.w || 700}" fill="${o.c || '#fff'}" text-anchor="${o.a || 'middle'}"${o.halo ? ` stroke="${o.halo}" stroke-width="3" stroke-linejoin="round" paint-order="stroke"` : ''}${giro}>${esc(s)}</text>`;
}
const R = (x, y, w, h, rx, fill, extra = '') => `<rect x="${N(x)}" y="${N(y)}" width="${N(w)}" height="${N(h)}"${rx ? ` rx="${rx}"` : ''} fill="${fill}"${extra ? ' ' + extra : ''}/>`;
const C = (x, y, r, fill, extra = '') => `<circle cx="${N(x)}" cy="${N(y)}" r="${r}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
const P = (d, extra) => `<path d="${d}" ${extra}/>`;

/* ---------- Paleta ---------- */
const METAL = '#c3c8ce', METAL_O = '#8a9199', ORO = '#dcae2f', ORO_O = '#a57c14', NEGRO = '#25272a', CREMA = '#f4f0e3';
const CABLES = { negro: '#2b2b2b', rojo: '#e03131', azul: '#2f6fde', verde: '#2f9e44', amarillo: '#f5c518', naranja: '#f08c00', gris: '#909499' };
const oscuro = (hex, k = 0.72) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
const PCB = { azul: '#1f5fa8', verde: '#1f7a4d', rojo: '#b3261e', violeta: '#5b3a9e', negro: '#26282b' };
const PCB_DE = { bmp280: 'violeta', vl53l0x: 'violeta', mlx90614: 'violeta', tcs34725: 'violeta', ina219: 'violeta', ads1115: 'azul', adxl335: 'rojo', tactil: 'rojo', laser: 'rojo', microfono: 'rojo',
  'rele-modulo': 'azul', 'matriz-led': 'verde', 'paso-a-paso': 'verde', 'puente-rectificador': 'negro', tb6612: 'rojo', acs712: 'azul', max6675: 'azul', bh1750: 'azul', barrera: 'negro', 'barrera-optica': 'negro', tcrt5000: 'azul', 'sensor-tension': 'azul' };
const pcbDe = (comp) => PCB[PCB_DE[comp.id] || (comp.cat === 'salidas' ? 'verde' : comp.cat === 'entradas' ? 'rojo' : 'azul')];

/* ---------- Protoboard ---------- */
export function placaReal(cols, geo) {   // geo = { colX, FILAS, RIELES, enRiel }: la misma geometría que el dibujo en línea
  const { colX, FILAS, RIELES, enRiel } = geo, w = colX(cols) + 40, ys = Object.values(FILAS); let ag = '';
  for (let c = 1; c <= cols; c++) { ys.forEach((y) => { ag += `M${colX(c) - 2.8},${y - 2.8}h5.6v5.6h-5.6Z`; }); if (enRiel(c)) RIELES.forEach((y) => { ag += `M${colX(c) - 2.8},${y - 2.8}h5.6v5.6h-5.6Z`; }); }
  let s = R(2, -7, w, 400, 11, '#000', 'opacity=".10"') + R(0, -10, w, 400, 10, CREMA, 'stroke="#cdc6b2" stroke-width="1.5"');
  s += R(0, 176, w, 28, 0, '#e6e0cf') + R(8, 183, w - 16, 14, 7, '#d3ccb8') + P(`M0,176 H${w} M0,204 H${w}`, 'fill="none" stroke="#cfc8b4" stroke-width="1"');
  [[8, 52], [328, 372]].forEach(([y1, y2]) => { s += P(`M52,${y1} H${w - 32}`, 'fill="none" stroke="#e03131" stroke-width="2.2" stroke-linecap="round"') + P(`M52,${y2} H${w - 32}`, 'fill="none" stroke="#2f6fde" stroke-width="2.2" stroke-linecap="round"'); });
  RIELES.forEach((y, k) => { const sg = k % 2 ? '−' : '+', c = k % 2 ? '#2f6fde' : '#e03131'; s += T(sg, 22, y, { t: 14, w: 800, c }) + T(sg, w - 22, y, { t: 14, w: 800, c }); });
  Object.entries(FILAS).forEach(([l, y]) => { s += T(l, 22, y, { t: 9, w: 600, c: '#9c9684' }) + T(l, w - 22, y, { t: 9, w: 600, c: '#9c9684' }); });
  for (let c = 1; c <= cols; c++) if (c === 1 || c % 5 === 0) s += T(c, colX(c), 66, { t: 8, w: 600, c: '#9c9684' }) + T(c, colX(c), 314, { t: 8, w: 600, c: '#9c9684' });
  s += `<path d="${ag}" fill="#3d3f43" stroke="#fff" stroke-opacity=".9" stroke-width="1.1" stroke-linejoin="round" paint-order="stroke"/>`;
  return `<g pointer-events="none">${s}</g>`;
}

/* ---------- Cables ---------- */
export function cableReal(L, color) {
  const c = CABLES[color] || CABLES.negro, o = oscuro(c, 0.62), d = `M0,0 H${N(L)}`;
  return `<path d="${d}" stroke="${o}" stroke-width="6" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="4.2" stroke-linecap="round"/><path d="M1,-1 H${N(L - 1)}" stroke="#fff" stroke-opacity=".38" stroke-width="1.1" stroke-linecap="round"/>` + C(0, 0, 3.6, o) + C(L, 0, 3.6, o) + C(0, 0, 1.6, '#e9ecef') + C(L, 0, 1.6, '#e9ecef');
}

/* ---------- Piezas de dos patas (dibujo propio) ----------
   Cada cuerpo se dibuja centrado en el origen, a lo largo del eje x (la pata A queda a la izquierda). */
const pata2 = (L) => `<path d="M0,0 H${N(L)}" stroke="${METAL_O}" stroke-width="2.6" stroke-linecap="round"/><path d="M0.5,-0.6 H${N(L - 0.5)}" stroke="#eef0f2" stroke-width="0.9" stroke-linecap="round"/>` + C(0, 0, 2.3, '#6d747c') + C(L, 0, 2.3, '#6d747c');
const brillo = (x1, x2, y, sw = 1.8) => P(`M${x1},${y} H${x2}`, `stroke="#fff" stroke-opacity=".4" stroke-width="${sw}" stroke-linecap="round"`);
const CUERPOS = {
  resistencia: { alto: 10, d: (el, x) => {
    const b = x.bandas(el);
    return P('M-22,-5 Q-22,-7.6 -19,-7.6 H-14 Q-11.5,-6 -9,-6 H9 Q11.5,-6 14,-7.6 H19 Q22,-7.6 22,-5 V5 Q22,7.6 19,7.6 H14 Q11.5,6 9,6 H-9 Q-11.5,6 -14,7.6 H-19 Q-22,7.6 -22,5 Z', 'fill="#e4cb97" stroke="#b79a5f" stroke-width=".9" stroke-linejoin="round"') +
      R(-18.5, -7.2, 4.2, 14.4, 0, b[0]) + R(-9.5, -5.6, 4, 11.2, 0, b[1]) + R(-2.5, -5.6, 4, 11.2, 0, b[2]) + R(13.8, -7.2, 4.2, 14.4, 0, b[3]) + brillo(-19, 19, -3.6) + P('M-19,4.6 H19', 'stroke="#000" stroke-opacity=".12" stroke-width="2" stroke-linecap="round"');
  } },
  capacitor: { alto: 14, d: () => C(0, 0, 12, '#24457f', 'stroke="#172f5c" stroke-width=".8"') + P('M9.19,-7.71 A12,12 0 0 1 9.19,7.71 L6.5,5.45 A8.5,8.5 0 0 0 6.5,-5.45 Z', 'fill="#dfe4ea"') + P('M9,0 h2.2', 'stroke="#24457f" stroke-width="1.3"') +
    C(0, 0, 8.5, '#c9ced5', 'stroke="#9aa1a9" stroke-width=".7"') + P('M-4.5,-4.5 L4.5,4.5 M-4.5,4.5 L4.5,-4.5', 'stroke="#9aa1a9" stroke-width=".9" stroke-linecap="round"') + P('M-6,-4 A7.2,7.2 0 0 1 2,-6.9', 'fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" stroke-linecap="round"') },
  diodo: { alto: 8, d: () => R(-13, -5, 26, 10, 2.5, NEGRO) + R(6.5, -5, 3.8, 10, 0, '#cfd3d8') + brillo(-11, 11, -2.6, 1.4) },
  ldr: { alto: 13, d: () => C(0, 0, 10.5, '#efe2c2', 'stroke="#c2ad80" stroke-width=".9"') + P('M-6,-5 H6 V-1.7 H-6 V1.7 H6 V5 H-6', 'fill="none" stroke="#c9412f" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"') },
  ceramico: { alto: 10, d: (el, x, deg) => `<ellipse rx="9.5" ry="7.5" fill="#e59a26" stroke="#b57216" stroke-width=".9"/>` + P('M-6,-3.6 A8,6 0 0 1 3,-5.6', 'fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round"') + T(x.fo.marca || '', 0, 0.6, { t: 5.6, w: 800, c: '#6b3d06', deg: Math.abs(deg) > 90 ? 180 : 0 }) },
  zener: { alto: 7, d: () => R(-11, -4.2, 22, 8.4, 4.2, '#e8763a', 'stroke="#b5501f" stroke-width=".7"') + R(4.6, -4.2, 3, 8.4, 0, '#1d1d1d') + brillo(-8, 3, -2, 1.2) },
  inductor: { alto: 9, d: () => R(-14, -6, 28, 12, 6, '#3f9c8b', 'stroke="#2b7466" stroke-width=".8"') + [['#8b4a1c', -9.5], ['#111', -4], ['#8b4a1c', 1.5], ['#bfc3c7', 7]].map(([c, bx]) => R(bx, -5.8, 2.8, 11.6, 0, c)).join('') + brillo(-11, 11, -3.2, 1.5) },
  fusible: { alto: 8, d: () => R(-15, -4.6, 30, 9.2, 2, '#eaf3f7', 'fill-opacity=".85" stroke="#9fb0bb" stroke-width=".7"') + P('M-8,0 Q-3,-2.4 0,0 T8,0', 'fill="none" stroke="#8a6d3b" stroke-width=".9"') + R(-15, -4.6, 7, 9.2, 1.5, METAL, `stroke="${METAL_O}" stroke-width=".6"`) + R(8, -4.6, 7, 9.2, 1.5, METAL, `stroke="${METAL_O}" stroke-width=".6"`) + brillo(-13, 13, -2.6, 1.2) },
  reed: { alto: 7, d: () => R(-15, -4, 30, 8, 4, '#cfe8d8', 'fill-opacity=".85" stroke="#86b39a" stroke-width=".8"') + P('M-13,-0.8 H2 M-2,1 H13', `fill="none" stroke="${METAL_O}" stroke-width="1.3" stroke-linecap="round"`) + brillo(-11, 11, -2.2, 1) },
  flex: { alto: 7, d: () => R(-22, -4.5, 44, 9, 1.5, '#3a3c40') + P(Array.from({ length: 10 }, (_, i) => `M${-18 + i * 4},-2.5 v5`).join(' '), 'stroke="#8d9299" stroke-width="1.2"') },
  axial: { alto: 9, d: (el, x, deg) => R(-15, -5.5, 30, 11, 3, '#d5d8dc', 'stroke="#9ea4ab" stroke-width=".8"') + (x.fo.banda ? R(8.5, -5.5, 3.6, 11, 0, NEGRO) : '') + (x.fo.txt ? T(x.fo.txt, x.fo.banda ? -3 : 0, 0, { t: cabe(x.fo.txt, x.fo.banda ? 19 : 26, 6.5), c: '#333', deg: Math.abs(deg) > 90 ? 180 : 0 }) : '') },
  termistor: { alto: 9, d: () => `<ellipse rx="6.8" ry="6.2" fill="#2f4035" stroke="#1c2a22" stroke-width=".7"/>` + P('M-4,-2.6 A5.5,5 0 0 1 1.5,-4.4', 'fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.1" stroke-linecap="round"') },
  fotodiodo: { alto: 10, d: (el, x, deg) => C(0, 0, 7.5, '#2a2b33', 'stroke="#15161b" stroke-width=".7"') + C(0, 0, 4.4, '#474a5e') + C(-2, -2, 1.5, '#fff', 'opacity=".45"') + T('+', -12.5, -8, { t: 9, w: 800, c: '#555', deg }) },
  fototransistor: { alto: 10, d: (el, x, deg) => C(0, 0, 7.5, '#dbe8f1', 'stroke="#93a9ba" stroke-width=".8"') + C(0, 0, 4, '#b3c7d6') + C(-2, -2, 1.5, '#fff', 'opacity=".8"') + T('+', -12.5, -8, { t: 9, w: 800, c: '#555', deg }) },
  inclinacion: { alto: 11, d: () => C(0, 0, 8.5, METAL, `stroke="${METAL_O}" stroke-width=".9"`) + C(0, 0, 5.4, '#dfe3e7', `stroke="${METAL_O}" stroke-width=".6"`) + C(-1.8, -1.8, 1.6, '#fff', 'opacity=".8"') },
  fsr: { alto: 12, d: () => C(0, 0, 9.5, '#2c2d30', 'stroke="#111" stroke-width=".7"') + P('M-6,-4.5 H6 M-7,-1.5 H7 M-7,1.5 H7 M-6,4.5 H6', 'stroke="#9aa0a6" stroke-width="1"') },
  radial: { alto: 12, d: (el, x, deg) => { const r = x.fo.r || 9; return C(0, 0, r, '#7f858c', 'stroke="#5d636a" stroke-width=".8"') + (x.fo.marca ? T(x.fo.marca, 0, 0, { t: cabe(x.fo.marca, 2 * r - 4, 7), deg }) : '') + (x.fo.pol ? T('+', -(r + 5), -8, { t: 9, w: 800, c: '#555', deg }) : ''); } },
};
const CUERPO_DE = { 'capacitor-ceramico': 'ceramico', zener: 'zener', inductor: 'inductor', fusible: 'fusible', reed: 'reed', flex: 'flex', termistor: 'termistor', fotodiodo: 'fotodiodo', fototransistor: 'fototransistor', inclinacion: 'inclinacion', fsr: 'fsr' };
function dosReal(comp, fo, x) {
  const k = fo.f === 'nativo' ? fo.t : CUERPO_DE[comp.id] || fo.f, c = CUERPOS[k]; if (!c) return null;
  const xx = Object.assign({ fo }, x);
  return { alto: c.alto, d2: (el, L, deg) => pata2(L) + `<g transform="translate(${N(L / 2)},0)">${c.d(el, xx, deg)}</g>` };
}

/* ---------- Huellas fijas (dibujo propio) ---------- */
const pinPlata = (p) => R(p[0] - 2.7, p[1] - 2.7, 5.4, 5.4, 0.8, METAL, `stroke="${METAL_O}" stroke-width=".7"`);
const pinOro = (p) => R(p[0] - 2.9, p[1] - 2.9, 5.8, 5.8, 0.8, ORO, `stroke="${ORO_O}" stroke-width=".7"`);
const centroX = (pts) => (pts[0][0] + pts[pts.length - 1][0]) / 2;
const tira = (pts) => { const x0 = Math.min(pts[0][0], pts[pts.length - 1][0]), x1 = Math.max(pts[0][0], pts[pts.length - 1][0]), y = pts[0][1]; return R(x0 - 9.5, y - 6, x1 - x0 + 19, 12, 2, '#1b1c1e') + pts.map(pinOro).join(''); };   // tira de pines de un módulo
const nombresTira = (noms, pts, dy, c = '#fff', halo) => pts.map((p, i) => T(noms[i], p[0], p[1] + dy, { t: cabe(noms[i], 17, 5.8), c, halo })).join('');
function to92Real(comp, fo) {
  const n = comp.pines.length;
  return { d: (el, pts) => { const s = el.rot ? -1 : 1, cx = centroX(pts), y = pts[0][1], r = G * (n - 1) / 2 + 6;
    return pts.map((p) => R(p[0] - 1.6, Math.min(p[1], p[1] - 3 * s), 3.2, 3, 0, METAL)).join('') +
      P(`M${cx - r},${y + 8 * s} V${y - 3 * s} A${r},${N(r * 0.85)} 0 0 ${s > 0 ? 1 : 0} ${cx + r},${y - 3 * s} V${y + 8 * s} Z`, `fill="${NEGRO}" stroke="#111" stroke-width=".8" stroke-linejoin="round"`) +
      R(cx - r, s > 0 ? y + 3 : y - 8, 2 * r, 5, 0, '#3d4045') + P(`M${cx - r + 5},${y - 7 * s} A${r - 5},${N(r * 0.6)} 0 0 ${s > 0 ? 1 : 0} ${cx + 2},${y - (r * 0.85 + 0.5) * s}`, 'fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.6" stroke-linecap="round"') +
      (fo.marca ? T(fo.marca, cx, y - 12 * s, { t: cabe(fo.marca, 2 * r - 14, 7), w: 800 }) : '') + pts.map(pinPlata).join('') + nombresTira(comp.pines.map((p) => p.n), pts, 15 * s, '#4a4d52', CREMA); } };
}
function to220Real(comp, fo) {
  const n = comp.pines.length;
  return { d: (el, pts) => { const s = el.rot ? -1 : 1, cx = centroX(pts), y = pts[0][1], w = G * (n - 1) + 16;
    return pts.map((p) => R(p[0] - 1.8, s > 0 ? y - 9 : y, 3.6, 9, 0, METAL, `stroke="${METAL_O}" stroke-width=".5"`)).join('') + R(cx - w / 2, s > 0 ? y - 44 : y + 26, w, 18, 1.5, METAL, `stroke="${METAL_O}" stroke-width=".8"`) + C(cx, y - 36 * s, 4, CREMA, `stroke="${METAL_O}" stroke-width=".8"`) +
      R(cx - w / 2, s > 0 ? y - 28 : y + 8, w, 20, 1.5, NEGRO, 'stroke="#111" stroke-width=".8"') + (fo.marca ? T(fo.marca, cx, y - 18 * s, { t: cabe(fo.marca, w - 6, 7), w: 800 }) : '') + pts.map(pinPlata).join('') +
      nombresTira(comp.pines.map((p) => p.n), pts, 13 * s, '#4a4d52', CREMA); },
    rotAt: (el, pts) => [centroX(pts), pts[0][1] + (el.rot ? 56 : -54), 'middle'] };
}
function dipReal(comp, fo) {
  const n = comp.pines.length + comp.pines.length % 2, m = n / 2;
  return { d: (el, pts) => {
    const [x, y] = el.a, w = (m - 1) * G + 16, yc = y + 1.5 * G, xm = el.rot ? x + w - 5 : x - 11, titulo = fo.txt || comp.nombre;
    let s = pts.map((p) => R(p[0] - 2.6, p[1] > yc ? p[1] - 9 : p[1] - 2.6, 5.2, 11.6, 0.8, METAL, `stroke="${METAL_O}" stroke-width=".6"`)).join('') + R(x - 11, y + 7, w + 6, 3 * G - 14, 2.5, NEGRO, 'stroke="#111" stroke-width=".8"');
    s += P(`M${xm},${yc - 5.5} A5.5,5.5 0 0 ${el.rot ? 0 : 1} ${xm},${yc + 5.5} Z`, 'fill="#0f1011"') + C(pts[0][0] + (el.rot ? 5 : -5), pts[0][1] + (pts[0][1] > yc ? -21 : 21), 1.8, '#6b7077') + P(`M${x - 9},${y + 9} H${x - 7 + w}`, 'stroke="#fff" stroke-opacity=".14" stroke-width="1.6" stroke-linecap="round"');
    s += pts.map((p, i) => T(comp.pines[i].n, p[0], p[1] + (p[1] > yc ? -12.5 : 12.5), { t: cabe(comp.pines[i].n, 17, 5.6), w: 600, c: '#b9bec4' })).join('');
    return s + T(titulo, x + G * (m - 1) / 2, yc, { t: cabe(titulo, w - 22, 9), w: 800 });
  } };
}
function moduloReal(comp, fo, base) {
  const { w, h } = base.caja, titulo = fo.txt || comp.nombre, col = pcbDe(comp), noms = comp.pines.map((p) => p.n);
  return { d: (el, pts) => { const s = el.rot ? -1 : 1, cx = centroX(pts), y = pts[0][1], top = s > 0 ? y - h + 9 : y - 9, lejos = s > 0 ? top + 6.5 : top + h - 6.5;
    let o = R(cx - w / 2 + 1.5, top + 2, w, h, 4, '#000', 'opacity=".12"') + R(cx - w / 2, top, w, h, 4, col, `stroke="${oscuro(col)}" stroke-width="1"`) + R(cx - w / 2 + 2.5, top + 2.5, w - 5, h - 5, 2.5, 'none', 'stroke="#fff" stroke-opacity=".22" stroke-width=".8"');
    if (h >= 44 && w >= 50) o += [cx - w / 2 + 7, cx + w / 2 - 7].map((hx) => C(hx, lejos, 3.2, ORO, `stroke="${ORO_O}" stroke-width=".6"`) + C(hx, lejos, 1.7, CREMA)).join('');
    return o + T(titulo, cx, s > 0 ? top + (h - 28) / 2 + (h >= 44 ? 2 : 0) : top + 28 + (h - 28) / 2 - (h >= 44 ? 2 : 0), { t: cabe(titulo, w - (h >= 44 ? 26 : 10), 9), w: 800 }) + tira(pts) + nombresTira(noms, pts, -11.5 * s); } };
}

/* ---------- Elementos sueltos (dibujo propio) ---------- */
const COLOR_ROL = { 'fuente+': CABLES.rojo, 'fuente-': CABLES.negro, vcc: CABLES.rojo, gnd: CABLES.negro };
const borneReal = (x, y, rol) => { const c = rol === 'fuente+' ? '#e03131' : rol === 'fuente-' ? '#2b2b2b' : ORO; return C(x, y, 5.2, c, `stroke="${oscuro(c)}" stroke-width="1"`) + C(x, y, 2.3, '#e9ecef', `stroke="${METAL_O}" stroke-width=".6"`); };
const chicote = (x1, y1, x2, y2, c) => { const d = `M${N(x1)},${N(y1)} L${N(x2)},${N(y2)}`; return P(d, `stroke="${oscuro(c, 0.62)}" stroke-width="4.6" stroke-linecap="round"`) + P(d, `stroke="${c}" stroke-width="3" stroke-linecap="round"`); };
const pilaAA = (x, y, w, h, haciaDer) => {   // una pila AA acostada; el positivo, hacia donde diga
  const cu = w * 0.26, xp = haciaDer ? x + w - cu : x;
  return R(x, y, w, h, h * 0.22, '#2d3035') + R(xp, y, cu, h, h * 0.22, '#c8782a') + R(haciaDer ? x + w : x - 3.5, y + h * 0.3, 3.5, h * 0.4, 1, METAL) + brillo(x + 3, x + w - 3, y + h * 0.28, 1.6) +
    T('+', haciaDer ? x + w - cu / 2 : x + cu / 2, y + h / 2, { t: h * 0.55, w: 800 }) + T('−', haciaDer ? x + 7 : x + w - 7, y + h / 2, { t: h * 0.55, w: 800, c: '#c9ced3' });
};
const pantalla = (x, y, w, h, dentro) => R(x, y, w, h, 2.5, '#12261c', 'stroke="#0a120e" stroke-width="1"') + dentro;
const perilla = (x, y, r) => C(x, y, r, '#3a3d42', 'stroke="#1f2124" stroke-width=".8"') + P(`M${x},${y} l${N(r * 0.55)},${N(-r * 0.75)}`, 'stroke="#fff" stroke-width="1.5" stroke-linecap="round"');
// Dibujos del cuerpo (x, y, w, h = la caja; t = texto). Devuelven todo el cuerpo, con su fondo.
const CAJAS = {
  // Sonda estanca DS18B20: los tres hilos entran al empalme, sigue el cable negro y termina en la cápsula de acero
  sonda: (x, y, w, h, t) => { const cx = x + w / 2, cy = y + 16, x1 = x + w - 78, yb = y + h - 20, d = `M${N(cx)},${N(yb)} C${N(cx)},${N(cy + 4)} ${N(cx - 46)},${N(yb - 4)} ${N(cx - 46)},${N(cy + 10)} C${N(cx - 46)},${N(cy - 6)} ${N(cx - 20)},${N(cy)} ${N(cx + 6)},${N(cy)} H${N(x1)}`;
    const hilos = [[-20, CABLES.rojo], [0, CABLES.amarillo], [20, CABLES.negro]].map(([dx, c]) => chicote(cx + dx, y + h, cx + dx * 0.3, yb + 6, c)).join('');
    return hilos + P(d, 'fill="none" stroke="#0d0e10" stroke-width="7" stroke-linecap="round"') + P(d, 'fill="none" stroke="#34373c" stroke-width="5" stroke-linecap="round"') + P(d, 'fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1.1" stroke-linecap="round"') +
      R(cx - 9, yb - 4, 18, 14, 4, '#1f2124', 'stroke="#0d0e10" stroke-width="1"') +
      R(x1 - 6, cy - 5.5, 20, 11, 3.5, '#1f2124', 'stroke="#0d0e10" stroke-width=".8"') +
      R(x1 + 10, cy - 6.5, 64, 13, 6.5, METAL, `stroke="${METAL_O}" stroke-width="1"`) + brillo(x1 + 16, x1 + 67, cy - 3, 1.8) + P(`M${N(x1 + 21)},${N(cy - 6.5)} v13`, `stroke="${METAL_O}" stroke-width=".8"`) +
      T(t, x + w - 44, y + h - 26, { t: 7.5, w: 800, c: '#4a4d52', halo: '#fff' }); },
  generica: (x, y, w, h, t) => R(x, y, w, h, 6, '#e8eaed', 'stroke="#aeb4bb" stroke-width="1.2"') + R(x, y, w, 8, 4, '#4b5560') + R(x, y + 5, w, 4, 0, '#4b5560') + T(t, x + w / 2, y + 6 + (h - 6) / 2, { t: cabe(t, w - 12, 10), w: 800, c: '#2b2f34' }),
  pilas: (x, y, w, h, t, comp) => { const n = +(/(\d)aa/.exec(comp.id) || [0, 1])[1], alto = Math.min(18, (h - 8 - (n - 1) * 3) / n); let s = R(x, y, w, h, 6, '#1f2124', 'stroke="#0d0e10" stroke-width="1"');
    for (let i = 0; i < n; i++) s += pilaAA(x + 12, y + (h - n * alto - (n - 1) * 3) / 2 + i * (alto + 3), w - 24, alto, i % 2 === 0);
    return s; },
  pila9v: (x, y, w, h, t) => R(x, y, w, h, 5, '#26282b', 'stroke="#111" stroke-width="1"') + R(x, y, w, h * 0.28, 5, '#c98a2b') + R(x, y + h * 0.18, w, h * 0.1, 0, '#c98a2b') + C(x + w / 2 - 11, y + 10, 6.5, METAL, `stroke="${METAL_O}" stroke-width="1"`) + C(x + w / 2 - 11, y + 10, 3, '#eef0f2') +
    P(`M${x + w / 2 + 4.5},${y + 10} l3.2,-5.6 h6.6 l3.2,5.6 l-3.2,5.6 h-6.6 Z`, `fill="${METAL}" stroke="${METAL_O}" stroke-width="1"`) + brillo(x + 5, x + w - 5, y + h * 0.36) + T(t, x + w / 2, y + h * 0.64, { t: cabe(t, w - 8, 15), w: 800 }),
  'pila-boton': (x, y, w, h, t) => { const r = Math.min(w, h) / 2 - 1, cx = x + w / 2, cy = y + h / 2; return C(cx, cy, r, METAL, `stroke="${METAL_O}" stroke-width="1.2"`) + C(cx, cy, r - 4, '#d6dadf', 'stroke="#aab0b7" stroke-width=".8"') + P(`M${cx - r * 0.55},${cy - r * 0.5} A${r * 0.8},${r * 0.8} 0 0 1 ${cx + r * 0.1},${cy - r * 0.78}`, 'fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"') + T('+', cx, cy - 8, { t: 12, w: 800, c: '#727980' }) + T(t, cx, cy + 6, { t: cabe(t, 2 * r - 16, 7), c: '#727980' }); },
  multimetro: (x, y, w, h, t) => R(x, y, w, h, 8, '#f2b90f', 'stroke="#b88905" stroke-width="1.2"') + R(x + 5, y + 5, w - 10, h - 10, 5, '#2b2e33') + R(x + 10, y + 10, w - 20, 20, 2.5, '#c7d3bd', 'stroke="#8d9a84" stroke-width=".8"') + T('0.00', x + w - 14, y + 20, { t: 12, w: 800, c: '#27302a', a: 'end' }) +
    perilla(x + w / 2, y + 30 + (h - 52) / 2 + 4, Math.max(8, Math.min(13, (h - 60) / 2))) + T(t, x + w / 2, y + h - 12, { t: cabe(t, w - 16, 6.5), w: 800, c: '#f2b90f' }),
  altavoz: (x, y, w, h) => { const r = Math.min(w, h) / 2 - 1, cx = x + w / 2, cy = y + h / 2; return C(cx, cy, r, '#9aa1a9', `stroke="${METAL_O}" stroke-width="1"`) + C(cx, cy, r - 3.5, '#2a2c30') + C(cx, cy, r * 0.62, '#3a3d42', 'stroke="#1c1d20" stroke-width=".8"') + C(cx, cy, r * 0.26, '#17181a') + C(cx - r * 0.08, cy - r * 0.08, r * 0.08, '#fff', 'opacity=".35"'); },
  fuente: (x, y, w, h, t) => R(x, y, w, h, 6, '#dfe2e6', 'stroke="#a4abb3" stroke-width="1.2"') + pantalla(x + 9, y + 9, w * 0.5, h * 0.42, T('5.0 V', x + 9 + w * 0.25, y + 9 + h * 0.21, { t: Math.min(13, h * 0.24), w: 800, c: '#5dfc8b' })) + perilla(x + w * 0.7, y + 9 + h * 0.21, 8) + perilla(x + w * 0.88, y + 9 + h * 0.21, 8) + T(t, x + w / 2, y + h * 0.76, { t: cabe(t, w - 14, 9), w: 800, c: '#2b2f34' }),
  generador: (x, y, w, h, t) => R(x, y, w, h, 6, '#dfe2e6', 'stroke="#a4abb3" stroke-width="1.2"') + pantalla(x + 9, y + 9, w * 0.5, h * 0.42, P(`M${x + 14},${y + 9 + h * 0.21} q${w * 0.05},${-h * 0.3} ${w * 0.1},0 t${w * 0.1},0 t${w * 0.1},0 t${w * 0.1},0`, 'fill="none" stroke="#5dfc8b" stroke-width="1.6"')) + perilla(x + w * 0.7, y + 9 + h * 0.21, 8) + perilla(x + w * 0.88, y + 9 + h * 0.21, 8) + T(t, x + w / 2, y + h * 0.76, { t: cabe(t, w - 14, 9), w: 800, c: '#2b2f34' }),
  osciloscopio: (x, y, w, h, t) => { const sw = w * 0.56, sh = h - 30, sx = x + 9, sy = y + 9; let gr = ''; for (let i = 1; i < 6; i++) gr += `M${N(sx + sw * i / 6)},${sy} v${sh} `; for (let i = 1; i < 4; i++) gr += `M${sx},${N(sy + sh * i / 4)} h${N(sw)} `;
    return R(x, y, w, h, 6, '#dfe2e6', 'stroke="#a4abb3" stroke-width="1.2"') + pantalla(sx, sy, sw, sh, P(gr, 'stroke="#2f5a43" stroke-width=".6"') + P(`M${sx + 3},${sy + sh / 2} q${sw * 0.08},${-sh * 0.7} ${sw * 0.16},0 t${sw * 0.16},0 t${sw * 0.16},0 t${sw * 0.16},0 t${sw * 0.16},0 t${sw * 0.16},0`, 'fill="none" stroke="#5dfc8b" stroke-width="1.5"')) +
      perilla(x + w * 0.76, y + 20, 8) + perilla(x + w * 0.9, y + 20, 5.5) + perilla(x + w * 0.76, y + 44, 5.5) + perilla(x + w * 0.9, y + 44, 5.5) + T(t, x + w / 2, y + h - 10, { t: cabe(t, w - 14, 8), w: 800, c: '#2b2f34' }); },
  solar: (x, y, w, h) => { let gr = ''; for (let i = 1; i < 6; i++) gr += `M${N(x + w * i / 6)},${y + 3} v${h - 6} `; for (let i = 1; i < 3; i++) gr += `M${x + 3},${N(y + h * i / 3)} h${w - 6} `; return R(x, y, w, h, 3, '#1b2f63', 'stroke="#c9ced5" stroke-width="2"') + P(gr, 'stroke="#8fa3cf" stroke-width=".8"') + P(`M${x + 4},${y + h - 4} L${x + w * 0.4},${y + 4}`, 'stroke="#fff" stroke-opacity=".12" stroke-width="10"'); },
  lampara: (x, y, w, h) => { const cx = x + w / 2, r = Math.min(w, h * 0.7) / 2 - 1; return R(cx - r * 0.42, y + h - r * 0.9, r * 0.84, r * 0.9, 2, METAL, `stroke="${METAL_O}" stroke-width=".8"`) + P(`M${cx - r * 0.42},${y + h - r * 0.55} h${r * 0.84} M${cx - r * 0.42},${y + h - r * 0.25} h${r * 0.84}`, `stroke="${METAL_O}" stroke-width=".8"`) + C(cx, y + r + 1, r, '#fff4c2', 'stroke="#d9b84a" stroke-width="1"') + P(`M${cx - 4},${y + r + 6} l2,-7 l2,5 l2,-5 l2,7`, 'fill="none" stroke="#c98a2b" stroke-width="1" stroke-linejoin="round"') + C(cx - r * 0.35, y + r * 0.65, r * 0.18, '#fff', 'opacity=".9"'); },
  ventilador: (x, y, w, h) => { const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2 - 5; let asp = ''; for (let i = 0; i < 5; i++) asp += `<path d="M0,-4 C${N(r * 0.5)},${N(-r * 0.55)} ${N(r * 0.95)},${N(-r * 0.2)} ${N(r * 0.9)},${N(r * 0.1)} C${N(r * 0.5)},${N(r * 0.05)} ${N(r * 0.25)},2 0,4 Z" fill="#3d4045" transform="translate(${cx},${cy}) rotate(${i * 72})"/>`;
    return R(x, y, w, h, 6, '#25272a', 'stroke="#111" stroke-width="1"') + C(cx, cy, r + 2, '#15161a') + asp + C(cx, cy, r * 0.3, '#2f3237', 'stroke="#111" stroke-width=".6"') + [[x + 5, y + 5], [x + w - 5, y + 5], [x + 5, y + h - 5], [x + w - 5, y + h - 5]].map(([a, b]) => C(a, b, 2, '#0c0d0e')).join(''); },
  peltier: (x, y, w, h, t) => R(x, y, w, h, 2, '#f1f1ee', 'stroke="#b9b9b2" stroke-width="1.5"') + R(x + 3, y + 3, w - 6, h - 6, 1, 'none', 'stroke="#d6d6cf" stroke-width="1"') + T(t, x + w / 2, y + h / 2, { t: cabe(t, w - 12, 9), w: 700, c: '#8b8b84' }),
  motorreductor: (x, y, w, h, t) => R(x, y + h * 0.18, w * 0.42, h * 0.64, 6, METAL, `stroke="${METAL_O}" stroke-width="1"`) + brillo(x + 5, x + w * 0.4, y + h * 0.3) + R(x + w * 0.38, y, w * 0.62, h, 5, '#f4c62b', 'stroke="#b8900f" stroke-width="1"') + C(x + w * 0.82, y + h / 2, h * 0.16, '#fff', 'stroke="#b8900f" stroke-width="1"') + C(x + w * 0.82, y + h / 2, h * 0.06, '#b8900f') + C(x + w * 0.5, y + 7, 2.4, '#b8900f') + C(x + w * 0.5, y + h - 7, 2.4, '#b8900f'),
  electroiman: (x, y, w, h) => { const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2 - 1; return C(cx, cy, r, METAL, `stroke="${METAL_O}" stroke-width="1.2"`) + C(cx, cy, r * 0.72, '#b5651d', 'stroke="#8a4a12" stroke-width="1"') + C(cx, cy, r * 0.34, METAL, `stroke="${METAL_O}" stroke-width="1"`) + C(cx, cy, r * 0.12, '#6d747c'); },
  usb: (x, y, w, h, t) => R(x, y, w, h, 7, '#f6f7f8', 'stroke="#b4bac1" stroke-width="1.2"') + R(x - 9, y + h / 2 - 7, 10, 14, 1.5, METAL, `stroke="${METAL_O}" stroke-width=".8"`) + T(t, x + w / 2, y + h / 2, { t: cabe(t, w - 12, 10), w: 800, c: '#2b2f34' }),
  calefactor: (x, y, w, h, t) => R(x, y, w, h, h / 2, '#d9d2c3', 'stroke="#a79f8c" stroke-width="1"') + P(`M${x + 10},${y + h / 2} ` + Array.from({ length: Math.floor((w - 20) / 8) }, (_, i) => `l4,${i % 2 ? 7 : -7}`).join(' '), 'fill="none" stroke="#c0392b" stroke-width="1.6" stroke-linejoin="round"'),
};
const CAJA_DE = { 'pila-aa': 'pilas', 'portapilas-3aa': 'pilas', 'portapilas-4aa': 'pilas', 'bateria-9v': 'pila9v', 'pila-boton': 'pila-boton', voltimetro: 'multimetro', amperimetro: 'multimetro', ohmimetro: 'multimetro', altavoz: 'altavoz', 'fuente-cc': 'fuente', generador: 'generador', osciloscopio: 'osciloscopio',
  'celda-solar': 'solar', lampara: 'lampara', ventilador: 'ventilador', peltier: 'peltier', motorreductor: 'motorreductor', 'motor-encoder': 'motorreductor', electroiman: 'electroiman', 'fuente-usb': 'usb', calefactor: 'calefactor', 'ds18b20-sonda': 'sonda' };
const REDONDAS = new Set(['sonda', 'pila-boton', 'altavoz', 'electroiman', 'lampara', 'calefactor', 'motorreductor', 'usb']);   // sin la sombra rectangular
function libreReal(comp, fo, base) {
  const { w, h, dos } = base.caja, titulo = fo.txt || comp.nombre, cuerpo = CAJAS[CAJA_DE[comp.id]] || CAJAS.generica;
  return { d: (el, pts) => {
    const [x, y] = el.a; let s = '', nom = '';
    pts.forEach((p, i) => { const q = comp.pines[i], ab = p[1] > y + h / 2, col = COLOR_ROL[q.rol] || (CAJA_DE[comp.id] === 'sonda' ? CABLES.amarillo : '#8d949b');
      s += chicote(p[0], ab ? y + h - 2 : y + 2, p[0], p[1], col) + borneReal(p[0], p[1], q.rol);
      nom += T(q.n, p[0], p[1] + (ab ? 12.5 : -12.5), { t: cabe(q.n, 18, 6.6), c: '#4a4d52', halo: '#fff' }); });
    return s + (REDONDAS.has(CAJA_DE[comp.id]) ? '' : R(x + 2, y + 3, w, h, 6, '#000', 'opacity=".10"')) + cuerpo(x, y, w, h, titulo, comp) + nom;
  } };
}
// Piezas propias sueltas del editor (su geometría es la del dibujo en línea)
const NATIVOS = {
  portapilas: { d: (el, pts) => { const [x, y] = el.a;
    return chicote(x + 118, y + 20, x + 150, y + 20, CABLES.rojo) + chicote(x + 118, y + 40, x + 150, y + 40, CABLES.negro) + R(x + 2, y + 3, 120, 60, 6, '#000', 'opacity=".10"') + R(x, y, 120, 60, 6, '#1f2124', 'stroke="#0d0e10" stroke-width="1"') +
      pilaAA(x + 12, y + 8, 96, 19, true) + pilaAA(x + 12, y + 33, 96, 19, false) + borneReal(x + 150, y + 20, 'fuente+') + borneReal(x + 150, y + 40, 'fuente-') + T('+', x + 136, y + 9, { t: 12, w: 800, c: '#e03131' }) + T('−', x + 136, y + 52, { t: 12, w: 800, c: '#2b2b2b' }); } },
  motor: { d: (el, pts) => { const [x, y] = el.a, s = el.rot ? -1 : 1, y0 = Math.min(y - 30 * s, y + 20 * s);
    return chicote(x - 10, y + 22 * s, x - 10, y + 40 * s, CABLES.rojo) + chicote(x + 10, y + 22 * s, x + 10, y + 40 * s, CABLES.negro) + R(x - 3, s > 0 ? y - 44 : y + 30, 6, 14, 1, METAL, `stroke="${METAL_O}" stroke-width=".8"`) +
      R(x - 22, y0, 44, 50, 7, '#b9bfc6', `stroke="${METAL_O}" stroke-width="1"`) + R(x - 22, y0, 9, 50, 4, '#fff', 'opacity=".35"') + R(x + 11, y0, 11, 50, 4, '#000', 'opacity=".12"') + R(x - 22, s > 0 ? y + 12 : y - 20, 44, 8, 2, '#2b2d31') +
      R(x - 9, s > 0 ? y - 34 : y + 26, 18, 8, 2, '#8a9199') + T('M', x, y - 6 * s, { t: 15, w: 800, c: '#4a4f55' }) + borneReal(x - 10, y + 40 * s) + borneReal(x + 10, y + 40 * s); } },
  microbit: { d: (el, pts, x) => microbitReal(el, x.ver(el)) },
  // pin suelto de la micro:bit: un trozo del borde de la placa, con su anillo dorado
  mbpin: { d: (el, pts, x) => { const [ax, ay] = el.a, r = !!el.rot, p = x.pin(el), pot = p === '3V' || p === 'GND', yy = (v) => ay + (r ? 50 - v : v);
    return R(ax + 1.5, ay + 3, 40, 50, 6, '#000', 'opacity=".14"') + R(ax, ay, 40, 50, 6, '#1c1e22', 'stroke="#0b0c0e" stroke-width="1"') + R(ax + 7, r ? ay + 0.5 : ay + 22, 26, 27.5, 0, ORO) +
      C(ax + 20, yy(36), 7.6, '#fff', `stroke="${ORO_O}" stroke-width="1.5"`) + (pot ? R(ax + 7, yy(15.5) - 6.5, 26, 13, 2, p === '3V' ? '#e03131' : '#111', p === 'GND' ? 'stroke="#8d949b" stroke-width=".8"' : '') : '') +
      T(p, ax + 20, yy(15.5), { t: pot ? 8 : 9.5, w: 800, c: '#fff' }) + T('micro:bit', ax + 20, yy(6.5), { t: 5.4, w: 700, c: '#aeb4bb' }); } },
};

/* ---------- micro:bit (V1 y V2) y su extensor ---------- */
const MB_X = [30, 70, 110, 150, 190];
function microbitReal(el, ver) {
  const deg = el.arriba ? 180 : 0, v2 = !/1/.test(ver), F = '#1c1e22'; let s = R(1.5, 3, 220, 170, 15, '#000', 'opacity=".14"') + R(0, 0, 220, 170, 15, F, 'stroke="#0b0c0e" stroke-width="1"');
  s += v2 ? R(92, 9, 36, 19, 9.5, ORO, `stroke="${ORO_O}" stroke-width=".8"`) + C(102.5, 18.5, 2.7, F) + C(117.5, 18.5, 2.7, F) + C(142, 18.5, 1.6, '#e03131') + R(60, 12, 16, 13, 2, '#0e0f11') + R(63, 15, 10, 7, 1, '#3a3d42')
    : R(95, 11, 30, 15, 7.5, 'none', 'stroke="#f1f1f1" stroke-width="1.7"') + C(104, 18.5, 1.9, '#f1f1f1') + C(116, 18.5, 1.9, '#f1f1f1');
  s += T(ver, 196, 17, { t: 9, w: 800, c: '#aeb4bb', deg });
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) s += R(110 - 2.5 + (i - 2) * 14, 40 + j * 15, 5, 9, 1.3, '#e9e3cf', 'stroke="#8c8672" stroke-width=".5"');
  [[29, 'A'], [191, 'B']].forEach(([bx, l]) => { s += R(bx - 13, 60, 26, 26, 3, '#c6cacf', `stroke="${METAL_O}" stroke-width=".8"`) + C(bx, 73, 8.5, '#141518') + C(bx - 2.6, 70.4, 2.4, '#fff', 'opacity=".22"') + T(l, bx, 50, { t: 10, w: 800, deg }); });
  if (!el.ext) {
    MB_X.forEach((px, i) => {
      s += R(px - 13, 133, 26, i === 0 || i === 4 ? 30 : 37, 0, ORO) + (i === 0 || i === 4 ? R(px - 13 + (i === 0 ? 5 : 0), 160, 21, 10, 0, ORO) + C(i === 0 ? 30 - 13 + 6 : 190 + 13 - 6, 163, 7, ORO) : '');
      s += C(px, 150, 7.6, '#fff', `stroke="${ORO_O}" stroke-width="1.5"`) + T(['0', '1', '2', '3V', 'GND'][i], px, 121, { t: 9, w: 800, deg });
      if (i < 4) s += [16, 20, 24].map((d) => R(px + d - 1.1, 142, 2.2, 28, 0, ORO)).join('');
      if (v2) s += C(px - 9, 171, 2.6, '#fff') + C(px + 9, 171, 2.6, '#fff');   // muescas del borde de la V2
    });
  } else {
    s += R(-102.5, 149, 428, 92, 7, '#000', 'opacity=".12"') + R(-104, 146, 428, 92, 6, '#1f7a4d', 'stroke="#145536" stroke-width="1"') + R(-101, 149, 422, 86, 4, 'none', 'stroke="#fff" stroke-opacity=".2" stroke-width=".8"');
    s += R(-8, 148.5, 236, 14, 3, '#e4e6e9', 'stroke="#a9afb6" stroke-width=".8"') + R(-3, 153, 226, 5, 2, '#1b1c1e') + T('EXTENSOR', 270, 168, { t: 7, w: 800, c: '#d5f0e0', deg });
    EXTENSOR.forEach((p, i) => {
      const x = -90 + G * i, c = caps(p, el.ver || 'v2');
      s += c.potencia ? R(x - 9, 189.5, 18, 13, 2, /3V/.test(p) ? '#e03131' : '#111') + T(p, x, 196, { t: 6.6, w: 800, deg }) : T(p, x, 196, { t: 6.6, w: 700, deg });
      if (c.pantalla) s += R(x - 1.8, 205.2, 3.6, 3.6, 0, '#fff');
      else if (c.boton) s += C(x, 207, 1.9, 'none', 'stroke="#fff" stroke-width="1.1"');
      else if (c.i2c) s += P(`M${x},204.3 l2.7,2.7 l-2.7,2.7 l-2.7,-2.7 Z`, 'fill="#fff"');
      s += C(x, 222, 5.4, ORO, `stroke="${ORO_O}" stroke-width="1"`) + C(x, 222, 2.3, '#fff', `stroke="${ORO_O}" stroke-width=".6"`);
    });
  }
  return `<g transform="translate(${el.a[0]},${el.a[1]})${el.arriba ? ' rotate(180 110 85)' : ''}">${s}</g>`;
}

/* ---------- Wokwi Elements ----------
   Correspondencias: id del componente → elemento de Wokwi y cómo se acomoda a nuestros terminales.
     modo 'dos'    dos patas entre dos agujeros cualesquiera; el cuerpo queda de pie, del lado de arriba
     modo 'pines'  las patas del arte caen sobre nuestros terminales (se ajusta escala y giro con la primera y la última);
                   pines = nombre de la pata de Wokwi para cada terminal nuestro, en orden
     modo 'patas'  las patas no coinciden: el cuerpo va sobre una tira de pines propia, rotulada con nuestros nombres
     modo 'libre'  elemento suelto: el arte, un conector en nuestros bornes y los cables que los unen
   tonos: valores del atributo de color que se puede elegir en el inspector (el.tono). */
const TONOS_LED = { rojo: 'red', verde: 'green', amarillo: 'yellow', azul: 'blue', blanco: 'white' };
const TONOS_BOTON = { rojo: 'red', verde: 'green', azul: 'blue', amarillo: 'yellow', negro: '#2b2b2b', blanco: 'white' };
export const WOKWI = {
  led: { tag: 'led', modo: 'dos', s: 2, pines: ['A', 'C'], alto: 76, tonos: TONOS_LED, attr: 'color' },
  'led-ir': { tag: 'led', attrs: { color: '#b7a3ea' }, modo: 'dos', s: 2, pines: ['A', 'C'], alto: 76 },
  zumbador: { tag: 'buzzer', modo: 'dos', s: 1.5, pines: ['2', '1'], alto: 112 },
  'zumbador-activo': { tag: 'buzzer', modo: 'dos', s: 1.5, pines: ['2', '1'], alto: 112 },
  pulsador: { tag: 'pushbutton-6mm', modo: 'pines', pines: ['1.r', '1.l', '2.r', '2.l'], tonos: TONOS_BOTON, attr: 'color' },
  potenciometro: { tag: 'potentiometer', modo: 'pines', pines: ['GND', 'SIG', 'VCC'] },
  'led-rgb': { tag: 'rgb-led', modo: 'pines', pines: ['R', 'COM', 'G', 'B'], recorte: [0, 0, 42.13, 45.2] },
  deslizante: { tag: 'slide-switch', modo: 'pines', pines: ['1', '2', '3'] },
  'hc-sr04': { tag: 'hc-sr04', modo: 'pines', pines: ['VCC', 'TRIG', 'ECHO', 'GND'] },
  'hc-sr04p': { tag: 'hc-sr04', modo: 'pines', pines: ['VCC', 'TRIG', 'ECHO', 'GND'] },
  pir: { tag: 'pir-motion-sensor', modo: 'pines', pines: ['VCC', 'OUT', 'GND'] },
  mpu6050: { tag: 'mpu6050', modo: 'pines', pines: ['VCC', 'GND', 'SCL', 'SDA', 'XDA', 'XCL', 'AD0', 'INT'] },
  'lcd-16x2': { tag: 'lcd1602', modo: 'pines', pines: ['VSS', 'VDD', 'V0', 'RS', 'RW', 'E', 'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'A', 'K'] },
  hx711: { tag: 'hx711', modo: 'pines', pines: ['GND', 'DT', 'SCK', 'VCC'], recorte: [0, 0, 110, 66] },
  encoder: { tag: 'ky-040', modo: 'pines', pines: ['GND', 'VCC', 'SW', 'DT', 'CLK'] },
  'gas-mq2': { tag: 'gas-sensor', modo: 'pines', pines: ['VCC', 'GND', 'DOUT', 'AOUT'] },
  'sensor-sonido': { tag: 'small-sound-sensor', modo: 'pines', pines: ['AOUT', 'GND', 'VCC', 'DOUT'] },
  'display-7seg': { tag: '7segment', modo: 'pines', pines: ['E', 'D', 'COM.1', 'C', 'DP', 'B', 'A', 'COM.2', 'F', 'G'], fuera: 40 },
  dht11: { tag: 'dht22', modo: 'patas', s: 1.25, recorte: [0, 0, 57.1, 91.6], placa: PCB.azul, aire: 7 },
  dht22: { tag: 'dht22', modo: 'patas', s: 1.4, recorte: [0, 0, 57.1, 91.6], placa: PCB.azul, aire: 7 },
  oled: { tag: 'ssd1306', modo: 'patas', s: 1, recorte: [0, 25.5, 150, 90.5], banda: '#0d59b3' },
  joystick: { tag: 'analog-joystick', modo: 'patas', s: 1.25, recorte: [0, 0, 102.8, 104], banda: '#b0171f' },
  neopixel: { tag: 'neopixel', modo: 'patas', s: 2, placa: '#26282b', aire: 9 },
  rele: { tag: 'ks2e-m-dc5', modo: 'patas', s: 1.35, placa: PCB.verde, aire: 7 },
  servo: { tag: 'servo', modo: 'libre', s: 0.9, pines: ['GND', 'V+', 'PWM'], recorte: [30, 0, 140.08, 119.55], colores: ['#b44200', '#ff2300', '#f47b00'], costado: true },
  'lcd-i2c': { tag: 'lcd1602', attrs: { pins: 'i2c' }, modo: 'libre', s: 0.85, pines: ['GND', 'VCC', 'SDA', 'SCL'], costado: true },
  'teclado-4x4': { tag: 'membrane-keypad', modo: 'libre', s: 0.62, pines: ['R1', 'R2', 'R3', 'R4', 'C1', 'C2', 'C3', 'C4'], cinta: true },
};
const claveDe = (tag, attrs) => 'w-' + tag + Object.values(attrs || {}).map((v) => '-' + String(v).replace(/[^a-z0-9]/gi, '')).join('');
const attrsDe = (cfg, tono) => Object.assign({}, cfg.attrs, cfg.tonos ? { [cfg.attr]: cfg.tonos[tono] || Object.values(cfg.tonos)[0] } : null);
export const tonosDe = (id) => (WOKWI[id] && WOKWI[id].tonos ? Object.keys(WOKWI[id].tonos) : null);
export const usaWokwi = (id) => !!WOKWI[id];

const W = { estado: 0, artes: new Map(), promesa: null };   // estado: 0 sin cargar · 1 cargando · 2 listo · -1 falló
export const wokwiListo = () => W.estado === 2;
const OMITIR = /^(cursor|transition|user-select|-webkit-user-select|pointer-events|outline|animation)/;
async function extraer(clave, tag, attrs, caja) {
  const e = document.createElement('wokwi-' + tag); Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
  const d = document.createElement('div'); d.style.cssText = 'position:absolute; left:0; top:0'; d.appendChild(e); caja.appendChild(d);
  await Promise.race([e.updateComplete, new Promise((r) => setTimeout(r, 2500))]);
  if (getComputedStyle(e).display === 'inline') e.style.display = 'inline-block';   // pinInfo se mide desde la esquina de la caja del elemento
  const sr = e.shadowRoot; if (!sr) throw new Error('sin shadow root: ' + tag);
  const svg = [...sr.querySelectorAll('svg')].filter((s) => !(s.parentElement && s.parentElement.closest('svg'))).map((s) => ({ s, r: s.getBoundingClientRect() })).sort((p, q) => q.r.width * q.r.height - p.r.width * p.r.height)[0];
  if (!svg || !svg.r.width) throw new Error('sin dibujo: ' + tag);
  const s = svg.s, r = svg.r, hr = e.getBoundingClientRect();
  // Los estilos que vienen en hojas del shadow root pasan a cada elemento, para que el SVG no dependa de ellas
  for (const hoja of [...(sr.adoptedStyleSheets || []), ...sr.styleSheets]) {
    let reglas = []; try { reglas = [...hoja.cssRules]; } catch (er) {}
    for (const regla of reglas) {
      if (!regla.style || !regla.selectorText || /:hover|:focus|:active|:checked|:host|\.pressed|\.active/.test(regla.selectorText)) continue;
      let nodos = []; try { nodos = [...sr.querySelectorAll(regla.selectorText)]; } catch (er) {}
      nodos.forEach((n) => { if (n === s || !s.contains(n)) return; for (const p of regla.style) { const v = regla.style.getPropertyValue(p); if (!OMITIR.test(p) && !v.includes('var(')) n.style.setProperty(p, v); } });
    }
  }
  let html = s.innerHTML.replace(/<!--[\s\S]*?-->/g, '');
  [...new Set([...s.querySelectorAll('[id]')].map((n) => n.id))].forEach((id) => {   // ids propios de cada arte, para que no choquen entre piezas
    const q = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`(\\sid=")${q}"`, 'g'), `$1${clave}-${id}"`).replace(new RegExp(`(url\\((?:&quot;|["'])?#|href=["']#)${q}(?=[)"'&])`, 'g'), `$1${clave}-${id}`);
  });
  const raiz = [...s.attributes].filter((a) => !/^(width|height|viewBox|version|id|class|preserveAspectRatio|transform|x|y|xmlns.*)$/.test(a.name)).map((a) => ` ${a.name}="${esc(a.value)}"`).join('');
  const vb = s.getAttribute('viewBox') || `0 0 ${N(r.width)} ${N(r.height)}`, par = s.getAttribute('preserveAspectRatio');
  const pins = {}; (e.pinInfo || []).forEach((p) => { pins[p.name] = [p.x - (r.left - hr.left), p.y - (r.top - hr.top)]; });
  d.remove();
  return { id: clave, w: N(r.width), h: N(r.height), pins, simbolo: `<symbol id="${clave}" viewBox="${vb}"${par ? ` preserveAspectRatio="${par}"` : ''}><g${/\sfont-family=/.test(raiz) ? '' : ' font-family="Montserrat, Arial, sans-serif"'}${raiz}>${html}</g></symbol>` };
}
// Carga el paquete (una sola vez) y deja en `defs` un <symbol> por cada dibujo que usa el editor. Devuelve si quedó listo.
export function cargarWokwi(defs) {
  if (W.promesa) return W.promesa;
  W.estado = 1;
  W.promesa = (async () => {
    try {
      if (!customElements.get('wokwi-led')) await new Promise((ok, mal) => { const sc = document.createElement('script'); sc.src = new URL('../lib/wokwi-elements.bundle.min.js', import.meta.url).href; sc.onload = ok; sc.onerror = () => mal(new Error('no se pudo cargar')); document.head.appendChild(sc); });
      if (!customElements.get('wokwi-led')) throw new Error('paquete sin elementos');
      const caja = document.createElement('div'); caja.style.cssText = 'position:absolute; left:-9999px; top:0; width:2000px; height:10px; overflow:hidden; visibility:hidden'; document.body.appendChild(caja);
      const hacer = new Map();
      Object.values(WOKWI).forEach((cfg) => (cfg.tonos ? Object.keys(cfg.tonos) : [null]).forEach((t) => { const at = attrsDe(cfg, t); hacer.set(claveDe(cfg.tag, at), [cfg.tag, at]); }));
      await Promise.all([...hacer].map(async ([k, [tag, at]]) => { try { W.artes.set(k, await extraer(k, tag, at, caja)); } catch (er) { console.warn('Wokwi:', er.message); } }));
      caja.remove();
      if (!W.artes.size) throw new Error('ningún dibujo');
      defs.innerHTML = [...W.artes.values()].map((a) => a.simbolo).join('');
      W.estado = 2; return true;
    } catch (er) { console.warn('No se pudieron cargar los dibujos de Wokwi Elements:', er.message); W.estado = -1; return false; }
  })();
  return W.promesa;
}
export const simbolosDe = (svgTxt) => [...W.artes.values()].filter((a) => svgTxt.includes('#' + a.id + '"')).map((a) => a.simbolo).join('');   // los <symbol> que usa un dibujo (para exportarlo)

const ap = (M, p) => [M[0] * p[0] + M[2] * p[1] + M[4], M[1] * p[0] + M[3] * p[1] + M[5]];
function semejanza(p0, p1, P0, P1) {   // giro + escala (sin espejo) que lleva p0 → P0 y p1 → P1
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], DX = P1[0] - P0[0], DY = P1[1] - P0[1], d2 = dx * dx + dy * dy || 1, a = (DX * dx + DY * dy) / d2, b = (DY * dx - DX * dy) / d2;
  return [a, b, -b, a, P0[0] - a * p0[0] + b * p0[1], P0[1] - b * p0[0] - a * p0[1]];
}
const zona = (arte, cfg) => cfg.recorte || [0, 0, arte.w, arte.h];
function usar(arte, M, rec) {
  const tr = `matrix(${M.map((n) => Math.round(n * 1e4) / 1e4).join(' ')})`, u = `<use xlink:href="#${arte.id}" width="${arte.w}" height="${arte.h}"`;
  // data-lim: lo que se ve del dibujo. getBBox cuenta también lo recortado y lo invisible, así que el editor mide con esto (cajaDom)
  return `<g data-lim="${limites(M, rec || [0, 0, arte.w, arte.h]).map(N).join(',')}">` + (rec ? `<g transform="${tr}"><svg x="${rec[0]}" y="${rec[1]}" width="${rec[2]}" height="${rec[3]}" viewBox="${rec.join(' ')}">${u}/></svg></g>` : `${u} transform="${tr}"/>`) + '</g>';
}
function limites(M, rec) { const q = [[rec[0], rec[1]], [rec[0] + rec[2], rec[1]], [rec[0], rec[1] + rec[3]], [rec[0] + rec[2], rec[1] + rec[3]]].map((p) => ap(M, p)), xs = q.map((p) => p[0]), ys = q.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
const arriba = (M, rec, pts) => { const b = limites(M, rec), y = pts.reduce((t, p) => t + p[1], 0) / pts.length; return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2 > y + 5 ? b[3] + 11 : b[1] - 9, 'middle']; };   // el rótulo va del lado del cuerpo
function wokwiReal(comp, fo, base, cfg) {
  const arteDe = (el) => W.artes.get(claveDe(cfg.tag, attrsDe(cfg, el.tono))), a0 = arteDe({}); if (!a0) return null;
  if (cfg.modo === 'dos') {
    const s = cfg.s, pa = a0.pins[cfg.pines[0]], pb = a0.pins[cfg.pines[1]]; if (!pa || !pb) return null;
    const m = pb[0] >= pa[0] ? 1 : -1, mx = (pa[0] + pb[0]) / 2, medio = Math.abs(pb[0] - pa[0]) * s / 2;
    return { alto: cfg.alto, icoL: G, resto: () => Math.abs(2 * medio - G), d2: (el, L, deg) => {
      const arte = arteDe(el) || a0, ux = Math.cos(deg * Math.PI / 180), uy = Math.sin(deg * Math.PI / 180), horiz = Math.abs(ux) >= Math.abs(uy), nx = -uy, ny = ux;
      const k = (horiz ? ny > 0 : nx < 0) ? 1 : -1;   // el cuerpo va hacia arriba (o hacia la derecha si la pieza está vertical), como el rótulo
      const M = [s * m, 0, 0, s * k, L / 2 - s * m * mx, -s * k * pa[1]];
      const patas = [[0, L / 2 - medio], [L, L / 2 + medio]].map(([x1, x2]) => (Math.abs(x1 - x2) > 0.6 ? P(`M${N(x1)},0 H${N(x2)}`, `stroke="${METAL_O}" stroke-width="2.6" stroke-linecap="round"`) + P(`M${N(x1)},-0.6 H${N(x2)}`, 'stroke="#eef0f2" stroke-width=".9" stroke-linecap="round"') : '')).join('');
      return patas + usar(arte, M) + C(0, 0, 2.3, '#6d747c') + C(L, 0, 2.3, '#6d747c');
    } };
  }
  if (cfg.modo === 'pines') {
    const ps = cfg.pines.map((n) => a0.pins[n]); if (ps.some((p) => !p)) return null;
    const mat = (el, pts) => { let Q = pts; if (cfg.fuera) { const cy = pts.reduce((t, p) => t + p[1], 0) / pts.length; Q = pts.map((p) => [p[0], p[1] + (p[1] > cy ? cfg.fuera : -cfg.fuera)]); } return semejanza(ps[0], ps[ps.length - 1], Q[0], Q[Q.length - 1]); };
    // resto: cuánto se aparta la peor pata del dibujo de su agujero (para las pruebas)
    const resto = (el, pts) => { const M = mat(el, pts), cy = pts.reduce((t, p) => t + p[1], 0) / pts.length; return Math.max(...ps.map((p, i) => { const q = ap(M, p), o = cfg.fuera ? [pts[i][0], pts[i][1] + (pts[i][1] > cy ? cfg.fuera : -cfg.fuera)] : pts[i]; return cfg.recorte && p[1] > cfg.recorte[1] + cfg.recorte[3] ? Math.abs(q[0] - o[0]) : Math.hypot(q[0] - o[0], q[1] - o[1]); })); };
    return { mat, resto, d: (el, pts) => usar(arteDe(el) || a0, mat(el, pts), cfg.recorte), rotAt: (el, pts) => arriba(mat(el, pts), zona(a0, cfg), pts) };
  }
  if (cfg.modo === 'patas') {
    const rec = zona(a0, cfg), s = cfg.s, aw = rec[2] * s, ah = rec[3] * s, aire = cfg.aire || 0, noms = comp.pines.map((p) => p.n), banda = cfg.banda || cfg.placa;
    const geo = (pts) => { const cx = centroX(pts), y = pts[0][1], ancho = Math.max(aw + 2 * aire, Math.abs(pts[pts.length - 1][0] - pts[0][0]) + 20); return { cx, y, ancho, alto: ah + 2 * aire + 26 }; };
    return { rotAt: (el, pts) => { const g = geo(pts); return [g.cx, el.rot ? g.y + g.alto - 7 + 9 : g.y - g.alto + 7 - 9, 'middle']; },
      d: (el, pts) => { const g = geo(pts), deg = el.rot ? 180 : 0;   // se dibuja derecho y, si está girado, se da vuelta entero (la tira es simétrica)
        const x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0]));
        let o = cfg.placa ? R(g.cx - g.ancho / 2 + 1.5, g.y - g.alto + 9, g.ancho, g.alto, 4, '#000', 'opacity=".12"') + R(g.cx - g.ancho / 2, g.y - g.alto + 7, g.ancho, g.alto, 4, cfg.placa, `stroke="${oscuro(cfg.placa)}" stroke-width="1"`) : R(x0 - 10, g.y - 19, x1 - x0 + 20, 26, 2, banda);
        o += usar(a0, [s, 0, 0, s, g.cx - aw / 2 - rec[0] * s, g.y - 19 - aire - ah - rec[1] * s], cfg.recorte);
        o += tira(pts) + pts.map((p, i) => T(noms[i], el.rot ? 2 * g.cx - p[0] : p[0], g.y - 11.5, { t: cabe(noms[i], 17, 5.8), deg })).join('');
        return el.rot ? `<g transform="rotate(180 ${N(g.cx)} ${N(g.y)})">${o}</g>` : o; } };
  }
  if (cfg.modo === 'libre') {
    const rec = zona(a0, cfg), s = cfg.s, aw = rec[2] * s, ah = rec[3] * s;
    // de costado: los cables salen por el borde izquierdo del dibujo, así que va a la derecha del conector
    const mat = (el, pts) => { const cx = centroX(pts), y = pts[0][1], abajo = !el.rot, x0 = cfg.costado ? Math.max(...pts.map((p) => p[0])) + 14 : cx - aw / 2; return [s, 0, 0, s, x0 - rec[0] * s, (abajo ? y - (cfg.costado ? 34 : 46) - ah : y + (cfg.costado ? 34 : 46)) - rec[1] * s]; };
    return { mat, rotAt: (el, pts) => { const b = limites(mat(el, pts), rec); return [(b[0] + b[2]) / 2, el.rot ? b[3] + 11 : b[1] - 9, 'middle']; },
      d: (el, pts) => { const M = mat(el, pts), y = pts[0][1], dir = el.rot ? -1 : 1, x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0])); let cab = '', nom = '';
        pts.forEach((p, i) => { const q0 = a0.pins[cfg.pines[i]] || [rec[0] + rec[2] / 2, rec[1] + rec[3]], q = ap(M, [Math.max(rec[0], Math.min(rec[0] + rec[2], q0[0])), Math.max(rec[1], Math.min(rec[1] + rec[3], q0[1]))]);
          const rol = comp.pines[i].rol, col = cfg.cinta ? '#8f959c' : (cfg.colores && cfg.colores[i]) || COLOR_ROL[rol] || [CABLES.amarillo, CABLES.verde, CABLES.azul, CABLES.naranja][i % 4];
          const lado = Math.abs(q0[0] - rec[0]) < 8 ? [-1, 0] : Math.abs(q0[0] - rec[0] - rec[2]) < 8 ? [1, 0] : [0, q0[1] > rec[1] + rec[3] / 2 ? 1 : -1], t = cfg.cinta ? 10 : 26;
          const dd = `M${N(p[0])},${N(y - 17 * dir)} C${N(p[0])},${N(y - (17 + t) * dir)} ${N(q[0] + lado[0] * t)},${N(q[1] + lado[1] * t)} ${N(q[0])},${N(q[1])}`;
          cab += P(dd, `fill="none" stroke="${oscuro(col, 0.62)}" stroke-width="3.8" stroke-linecap="round"`) + P(dd, `fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round"`);
          nom += T(comp.pines[i].n, p[0], y - 12.5 * dir, { t: cabe(comp.pines[i].n, 17, 5.8) }); });   // el nombre va en el conector, del lado del dibujo: del otro llegan los cables
        return cab + usar(a0, M, cfg.recorte) + R(x0 - 9.5, dir > 0 ? y - 19 : y - 7, x1 - x0 + 19, 26, 2, '#1b1c1e') + pts.map(pinOro).join('') + nom; } };
  }
  return null;
}

/* ---------- Definición realista de un componente ----------
   base = la forma de siempre (terminales, ancla, giro); x = { bandas(el) → 4 colores, ver(el) → 'V1' | 'V2' }.
   Devuelve { d2(el, L, deg), alto } para las piezas de dos patas o { d(el, pts), rotAt? } para el resto;
   null si no hay dibujo realista (se usa el de línea). */
export function defReal(comp, fo, base, x) {
  if (!fo) return null;
  const cfg = WOKWI[comp.id];
  if (cfg) { const r = wokwiListo() ? wokwiReal(comp, fo, base, cfg) : null; if (r) { r.wokwi = true; if (r.d) { const d = r.d; r.d = (el, pts) => d(el, pts, x); } return r; } return null; }
  let r = null;
  if (base.n === 2) r = dosReal(comp, fo, x);
  else if (fo.f === 'nativo') r = NATIVOS[fo.t] || null;
  else r = ({ to92: to92Real, to220: to220Real, dip: dipReal, modulo: moduloReal }[fo.f] || libreReal)(comp, fo, base);
  if (r && r.d) { const d = r.d; r = Object.assign({}, r, { d: (el, pts) => d(el, pts, x) }); }
  return r;
}
