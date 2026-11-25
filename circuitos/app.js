// Editor de circuitos de fisicabit: un esquemático y una protoboard, dibujados en SVG.
// Todo elemento de dos terminales se crea entre dos puntos (A y B): el símbolo queda
// centrado y los terminales se estiran. Los componentes salen de la base de datos
// (componentes.js): cada uno dice con qué forma se dibuja en cada vista. El esquemático
// va en línea, en blanco y negro; la protoboard tiene dos estilos: «Realista» (arte.js) y
// «Línea» (blanco y negro, para imprimir). Los terminales son los mismos en los dos.
import { CATEGORIAS, COMPONENTES } from './componentes.js';
import { placaReal, cableReal, defReal, cargarWokwi, wokwiListo, simbolosDe, tonosDe } from './arte.js';
import { VERSIONES, ANILLOS, EXTENSOR, caps, infoPin, recomendar, revisar } from './microbit.js';
import { cargarPartes, partes, parte, enlaceMakeCode } from './partes.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const N = (n) => Math.round(n * 100) / 100;
const uid = () => Math.random().toString(36).slice(2, 9);
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const NS = 'http://www.w3.org/2000/svg';
const EMBED = new URLSearchParams(location.search).has('embed') && window.parent !== window;
const CLAVE = 'fisicabit_circuito_v1';
const G = 20;   // paso de la grilla del esquemático y de los agujeros de la protoboard

/* ---------- Colores (lo único que no es blanco y negro) ---------- */
const CABLES = { negro: '#111111', rojo: '#d62828', azul: '#1d5fd1', verde: '#2a9d3a', amarillo: '#f6d21f', naranja: '#f77f00', gris: '#8a8a8a' };
const BANDA = [['negro', '#111111'], ['marrón', '#8b4a1c'], ['rojo', '#d62828'], ['naranja', '#f77f00'], ['amarillo', '#f6d21f'], ['verde', '#2a9d3a'], ['azul', '#1d5fd1'], ['violeta', '#8e44ad'], ['gris', '#8a8a8a'], ['blanco', '#ffffff']];
const ORO = ['dorado', '#c9a227'], PLATA = ['plateado', '#bfc3c7'];
const TOLS = [[1, BANDA[1]], [2, BANDA[2]], [5, ORO], [10, PLATA]];
const colorMult = (m) => (m === -1 ? ORO : m === -2 ? PLATA : BANDA[Math.max(0, Math.min(9, m))]);
const colorTol = (t) => (TOLS.find((x) => x[0] === +t) || TOLS[2])[1];

/* ---------- Código de colores de las resistencias (4 bandas) ---------- */
export function bandas(ohm) {
  let d1 = 0, d2 = 0, m = 0;
  if (ohm > 0) {
    let e = Math.floor(Math.log10(ohm) + 1e-9), mant = Math.round(ohm / Math.pow(10, e - 1));
    if (mant >= 100) { mant = 10; e++; }
    m = e - 1;
    if (m < -2) { m = -2; mant = Math.round(ohm * 100); }
    if (m > 9) { m = 9; mant = Math.min(99, Math.round(ohm / 1e9)); }
    d1 = Math.floor(mant / 10); d2 = mant % 10;
  }
  return { d1, d2, m };
}
const valorDeBandas = (d1, d2, m) => +((d1 * 10 + d2) * Math.pow(10, m)).toPrecision(3);
export function leerOhm(s) {   // «220», «4.7k», «4k7», «1M», «0,47», «2R2»
  s = String(s).trim().replace(/\s+/g, '').replace(/Ω|ω|ohms?/gi, '').replace(',', '.');
  const m = s.match(/^(\d*\.?\d+)([kKmMrR]?)(\d*)$/); if (!m) return NaN;
  if (m[3] && m[1].includes('.')) return NaN;
  const v = m[3] ? parseFloat(m[1] + '.' + m[3]) : parseFloat(m[1]), suf = m[2].toLowerCase();
  return v * (suf === 'k' ? 1e3 : suf === 'm' ? 1e6 : 1);
}
export function textoOhm(v) {
  const f = (x) => String(+x.toPrecision(3)).replace('.', ',');
  return v >= 1e6 ? f(v / 1e6) + ' MΩ' : v >= 1e3 ? f(v / 1e3) + ' kΩ' : f(v) + ' Ω';
}

/* ---------- Trazos básicos (todo con atributos, para que el SVG exportado sea autocontenido) ---------- */
const TRAZO = 'stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const linea = (d, sw) => `<path d="${d}" fill="none" ${sw ? TRAZO.replace('width="2"', `width="${sw}"`) : TRAZO}/>`;
const forma = (d, fill = '#fff', sw = 2) => `<path d="${d}" fill="${fill}" stroke="#111" stroke-width="${sw}" stroke-linejoin="round"/>`;
const circ = (r, x = 0, y = 0, fill = '#fff', sw = 2) => `<circle cx="${N(x)}" cy="${N(y)}" r="${r}" fill="${fill}" stroke="#111" stroke-width="${sw}"/>`;
const caja = (x, y, w, h, rx = 0, fill = '#fff', sw = 2) => `<rect x="${N(x)}" y="${N(y)}" width="${N(w)}" height="${N(h)}" rx="${rx}" fill="${fill}" stroke="#111" stroke-width="${sw}"/>`;
// Texto: o = { t: tamaño, w: peso, a: anclaje, c: color, deg: giro del grupo (para dejarlo derecho), halo: borde blanco }
function txt(s, x, y, o = {}) {
  const t = o.t || 11, giro = o.deg ? ` transform="rotate(${N(-o.deg)} ${N(x)} ${N(y)})"` : '';
  return `<text x="${N(x)}" y="${N(y + t * 0.36)}" font-family="Montserrat, Arial, sans-serif" font-size="${N(t)}" font-weight="${o.w || 600}" fill="${o.c || '#111'}" text-anchor="${o.a || 'middle'}"${o.halo ? ` stroke="${o.halo === true ? '#fff' : o.halo}" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke"` : ''}${giro}>${esc(s)}</text>`;
}
const cabe = (s, ancho, max) => Math.min(max, ancho / Math.max(1, String(s).length * 0.7));   // tamaño de letra para que un texto entre en un ancho
const pin = (x, y) => `<rect x="${N(x - 2.6)}" y="${N(y - 2.6)}" width="5.2" height="5.2" fill="#111"/>`;
const borne = (x, y, fill = '#fff') => `<circle cx="${N(x)}" cy="${N(y)}" r="4" fill="${fill}" stroke="#111" stroke-width="1.6"/>`;
const flecha = (x1, y1, x2, y2, sw = 1.6) => {   // línea con punta abierta en (x2, y2)
  const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, p = 5;
  return linea(`M${x1},${y1} L${x2},${y2} M${N(x2 - ux * p - uy * p * 0.6)},${N(y2 - uy * p + ux * p * 0.6)} L${x2},${y2} L${N(x2 - ux * p + uy * p * 0.6)},${N(y2 - uy * p - ux * p * 0.6)}`, sw);
};
const punta = (x, y, ux, uy, t = 7) => `<path d="M${N(x)},${N(y)} L${N(x - ux * t - uy * t * 0.45)},${N(y - uy * t + ux * t * 0.45)} L${N(x - ux * t + uy * t * 0.45)},${N(y - uy * t - ux * t * 0.45)} Z" fill="#111"/>`;   // punta llena

/* ---------- Esquemático: símbolos de dos patas ----------
   s = medio largo del símbolo; arr / aba = alto hacia cada lado (para ubicar el rótulo).
   d(el, deg) dibuja el símbolo centrado en el origen, a lo largo del eje x. */
const RES_IEC = caja(-20, -7, 40, 14);
const RES_ZZ = linea('M-20,0 L-16.7,-7 L-10,7 L-3.3,-7 L3.3,7 L10,-7 L16.7,7 L20,0');
const resEsq = () => (E.resEstilo === 'zigzag' ? RES_ZZ : RES_IEC);
const DIODO = forma('M-8,-8 V8 L8,0 Z');
const redondo = (r, dentro) => ({ n: 2, s: r, arr: r + 1, aba: r + 1, d: (el, deg) => circ(r) + dentro(deg) });
const ESQ = {
  cable: { n: 2, s: 0, arr: 2, aba: 2, d: () => '' },
  resistencia: { n: 2, s: 20, arr: 8, aba: 8, d: () => resEsq() },
  pila: { n: 2, s: 4, arr: 13, aba: 13, d: (el, deg) => linea('M-4,-12 V12') + linea('M4,-6 V6', 4.5) + txt('+', -13, -11, { t: 12, w: 700, deg }) },
  bateria: { n: 2, s: 9, arr: 13, aba: 13, d: (el, deg) => linea('M-9,-12 V12 M3,-12 V12') + linea('M-3,-6 V6 M9,-6 V6', 4.5) + txt('+', -18, -11, { t: 12, w: 700, deg }) },
  fuente: redondo(14, (deg) => txt('+', -6, 0, { t: 12, w: 700, deg }) + txt('−', 6.5, 0, { t: 12, w: 700, deg })),
  led: { n: 2, s: 8, arr: 22, aba: 9, d: () => DIODO + linea('M8,-8 V8') + flecha(-2, -12, 4, -20) + flecha(5, -12, 11, -20) },
  diodo: { n: 2, s: 8, arr: 9, aba: 9, d: () => DIODO + linea('M8,-8 V8') },
  lampara: redondo(12, () => linea('M-8.5,-8.5 L8.5,8.5 M-8.5,8.5 L8.5,-8.5')),
  interruptor: { n: 2, s: 14, arr: 13, aba: 4, d: (el) => linea(el.cerrado ? 'M-14,0 L14,0' : 'M-14,0 L11,-12') + circ(2.6, -14, 0) + circ(2.6, 14, 0) },
  pulsador: { n: 2, s: 12, arr: 17, aba: 4, d: () => linea('M-15,-7 H15 M0,-7 V-15 M-6,-15 H6') + circ(2.6, -12, 0) + circ(2.6, 12, 0) },
  // con polaridad (electrolítico): placa recta del positivo, del lado de la pata «+», placa curva del negativo y el signo +
  capacitor: { n: 2, s: 4, arr: 13, aba: 13, d: (el, deg) => (polar(el) ? linea('M-4,-12 V12') + linea('M7,-12 Q1,0 7,12') + txt('+', -13, -11, { t: 12, w: 700, deg }) : linea('M-4,-12 V12 M4,-12 V12')) },
  potenciometro: { n: 2, s: 20, arr: 15, aba: 15, d: () => resEsq() + flecha(-14, 14, 14, -14) },
  ldr: { n: 2, s: 20, arr: 24, aba: 8, d: () => resEsq() + flecha(-14, -23, -7, -11) + flecha(-3, -23, 4, -11) },
  termistor: { n: 2, s: 20, arr: 15, aba: 14, d: () => resEsq() + linea('M-17,13 H-10 L12,-14', 1.6) },
  amperimetro: redondo(13, (deg) => txt('A', 0, 0, { t: 13, w: 800, deg })),
  voltimetro: redondo(13, (deg) => txt('V', 0, 0, { t: 13, w: 800, deg })),
  motor: redondo(13, (deg) => txt('M', 0, 0, { t: 13, w: 800, deg })),
  zumbador: { n: 2, s: 10.4, arr: 7, aba: 7, d: () => forma('M-12,6 A12,12 0 0 1 12,6 Z') },
  // símbolos que pide la base de componentes
  inductor: { n: 2, s: 20, arr: 7, aba: 3, d: () => linea('M-20,0 a5,5 0 0 1 10,0 a5,5 0 0 1 10,0 a5,5 0 0 1 10,0 a5,5 0 0 1 10,0') },
  zener: { n: 2, s: 8, arr: 11, aba: 11, d: () => DIODO + linea('M4,-10 L8,-8 V8 L12,10') },
  fotodiodo: { n: 2, s: 8, arr: 22, aba: 9, d: () => DIODO + linea('M8,-8 V8') + flecha(4, -21, -2, -12) + flecha(11, -21, 5, -12) },
  fusible: { n: 2, s: 18, arr: 7, aba: 7, d: () => caja(-18, -6, 36, 12) + linea('M-18,0 H18', 1.4) },
  altavoz: { n: 2, s: 8, arr: 18, aba: 6, d: () => forma('M-8,-5 L-16,-17 H16 L8,-5 Z') + caja(-8, -5, 16, 10) },
  solar: { n: 2, s: 14, arr: 28, aba: 15, d: () => circ(14) + linea('M-3,-9 V9') + linea('M3,-5 V5', 4) + flecha(-12, -27, -7, -17) + flecha(-2, -28, 3, -18) },
  generador: redondo(14, () => linea('M-8,0 q4,-9 8,0 t8,0', 1.8)),
  osciloscopio: redondo(14, () => linea('M-8,5 L-2,-5 V5 L4,-5 V5 L8,-1.5', 1.6)),
  ohmimetro: redondo(13, (deg) => txt('Ω', 0, 0, { t: 13, w: 800, deg })),
  'rele-bobina': { n: 2, s: 10, arr: 10, aba: 10, d: () => caja(-10, -9, 20, 18) + linea('M-10,9 L10,-9', 1.4) },
  cristal: { n: 2, s: 9, arr: 12, aba: 12, d: () => linea('M-9,-9 V9 M9,-9 V9') + caja(-4.5, -11, 9, 22) },
  varistor: { n: 2, s: 20, arr: 15, aba: 14, d: (el, deg) => resEsq() + linea('M-17,13 H-10 L12,-14', 1.6) + txt('U', 17, -14, { t: 8, w: 700, deg }) },
};

/* ---------- Esquemático: símbolos de tres patas (un clic, patas sobre la grilla, giran de a 90°) ----------
   slots: [nombre, posición] de cada pata · al: cómo reconocer cada pata por su nombre en la base
   orden: a qué slot va cada pata cuando el nombre no alcanza (orden físico de la base). */
const transistor = (pnp) => (deg) => circ(19, 6, 0) + linea('M-20,0 H-6 M-6,-5 L20,-16 V-40 M-6,5 L20,16 V40') + linea('M-6,-11 V11', 3.2) + (pnp ? punta(-1.5, 6.9, -0.921, -0.39) : punta(16, 14.3, 0.921, 0.39));
const mosfet = (p) => () => circ(19, 6, 0) + linea('M-20,0 H-9 M-3,-9 H20 V-40 M-3,9 H20 V40') + linea('M-9,-10 V10', 2.2) + linea('M-3,-13 V13', 2.8) + (p ? punta(4, 9, -1, 0) : punta(14, 9, 1, 0));
const ESQ3 = {
  npn: { slots: [['C', [20, -40]], ['B', [-20, 0]], ['E', [20, 40]]], al: { C: /^c/i, B: /^b/i, E: /^e/i }, d: transistor(false) },
  pnp: { slots: [['C', [20, -40]], ['B', [-20, 0]], ['E', [20, 40]]], al: { C: /^c/i, B: /^b/i, E: /^e/i }, d: transistor(true) },
  nmos: { slots: [['G', [-20, 0]], ['D', [20, -40]], ['S', [20, 40]]], al: { G: /^(g|comp|puerta)/i, D: /^d/i, S: /^(s|f)/i }, d: mosfet(false) },
  pmos: { slots: [['G', [-20, 0]], ['D', [20, -40]], ['S', [20, 40]]], al: { G: /^(g|comp|puerta)/i, D: /^d/i, S: /^(s|f)/i }, d: mosfet(true) },
  pot3: { slots: [['1', [-40, 0]], ['C', [0, -40]], ['2', [40, 0]]], al: { C: /^(c|w|cursor|centro|medio|sal|out)/i }, rot: [10, -28], d: () => linea('M-40,0 H-20 M20,0 H40 M0,-40 V-12') + resEsq() + punta(0, -8, 0, 1) },
  conmutador: { slots: [['C', [-40, 0]], ['1', [40, -20]], ['2', [40, 20]]], al: { C: /^(c|com)/i }, orden: [1, 0, 2], rot: [-34, -32],
    d: () => linea('M-40,0 H-14 M14,-20 H40 M14,20 H40 M-14,0 L12,-19') + circ(2.6, -14, 0) + circ(2.6, 14, -20) + circ(2.6, 14, 20) },
  opamp: { slots: [['+', [-40, 20]], ['−', [-40, -20]], ['OUT', [40, 0]]], al: { '+': /\+|no.?inv/i, '−': /-|−|inv/i, OUT: /out|sal/i }, rot: [8, -34],
    d: (deg) => linea('M-40,-20 H-22 M-40,20 H-22 M30,0 H40') + forma('M-22,-32 V32 L30,0 Z') + txt('−', -14, -20, { t: 12, w: 700, deg }) + txt('+', -14, 20, { t: 12, w: 700, deg }) },
  regulador: { slots: [['IN', [-40, 0]], ['GND', [0, 40]], ['OUT', [40, 0]]], al: { IN: /^(in|ent|vin|vi$)/i, GND: /gnd|masa|adj|com/i, OUT: /^(out|sal|vout|vo$)/i }, rot: [28, -24],
    d: (deg, comp) => linea('M-40,0 H-22 M22,0 H40 M0,14 V40') + caja(-22, -14, 44, 28) + txt((comp.esq && comp.esq.txt) || 'REG', 0, 0, { t: 9, w: 800, deg }) },
};
function asignar(nombresBase, S) {   // nombre de la base para cada slot del símbolo
  const libres = nombresBase.slice(), res = S.slots.map(() => null);
  S.slots.forEach(([k], i) => { const r = S.al && S.al[k], j = r ? libres.findIndex((n) => n != null && r.test(n)) : -1; if (j >= 0) { res[i] = libres[j]; libres[j] = null; } });
  const resto = libres.filter((n) => n != null);
  (S.orden || S.slots.map((_, i) => i)).forEach((i) => { if (res[i] == null) res[i] = resto.length ? resto.shift() : S.slots[i][0]; });
  return res;
}
const girar = (p, r) => { let [x, y] = p; for (let i = 0; i < (r || 0) % 4; i++) [x, y] = [-y, x]; return [x, y]; };
function tresEsq(comp, S, nombresBase) {
  const nombres = asignar(nombresBase, S);
  return { n: 1, rota: 4, nombres: () => nombres,
    term: (el) => S.slots.map(([, p]) => { const q = girar(p, el.rot); return [el.a[0] + q[0], el.a[1] + q[1]]; }),
    d: (el) => `<g transform="translate(${el.a[0]},${el.a[1]}) rotate(${90 * (el.rot || 0)})"><circle r="26" fill="#000" fill-opacity="0"/>${S.d(90 * (el.rot || 0), comp)}</g>`,
    rotAt: (el) => { const o = el.rot ? [26, -30] : S.rot || [32, -8]; return [el.a[0] + o[0], el.a[1] + o[1], 'start']; } };
}

/* ---------- Esquemático: bloque (caja con los pines rotulados a los lados) ---------- */
function bloque(a, titulo, izq, der, soloPts) {
  const filas = Math.max(izq.length, der.length, 1), h = filas * G + G, lw = (l) => Math.max(0, ...l.map((s) => String(s).length)) * 5.4;
  const w = Math.max(80, Math.ceil((lw(izq) + lw(der) + String(titulo).length * 7.6 + 30) / 40) * 40), [x, y] = a;
  const pts = izq.map((n, i) => [x - G, y + G * (i + 1)]).concat(der.map((n, i) => [x + w + G, y + G * (i + 1)]));
  if (soloPts) return { w, h, pts };
  let s = caja(x, y, w, h, 4);
  izq.forEach((n, i) => { s += linea(`M${x - G},${y + G * (i + 1)} H${x}`) + txt(n, x + 5, y + G * (i + 1), { t: 8.5, w: 700, a: 'start' }); });
  der.forEach((n, i) => { s += linea(`M${x + w},${y + G * (i + 1)} H${x + w + G}`) + txt(n, x + w - 5, y + G * (i + 1), { t: 8.5, w: 700, a: 'end' }); });
  s += txt(titulo, x + lw(izq) + 5 + (w - lw(izq) - lw(der) - 10) / 2, y + h / 2, { t: 11, w: 800 });
  return { w, h, pts, svg: s };
}
function bloqueEsq(comp, fo) {
  const todos = (comp.pines || []).map((p) => p.n);   // los nombres de izq / der que no están en «pines» se dibujan igual, como patas sin rol
  let izq = (fo.izq || []).slice(), der = (fo.der || []).filter((n) => !izq.includes(n));
  const faltan = todos.filter((n) => !izq.includes(n) && !der.includes(n));
  if (!izq.length && !der.length) { const m = Math.ceil(faltan.length / 2); izq = faltan.slice(0, m); der = faltan.slice(m); }
  else faltan.forEach((n) => (izq.length <= der.length ? izq : der).push(n));
  const titulo = fo.txt || comp.pref || comp.nombre.slice(0, 12), geo = (el, pts) => bloque(el.a, titulo, el.rot ? der : izq, el.rot ? izq : der, pts);
  return { n: 1, rota: 2, term: (el) => geo(el, true).pts, nombres: (el) => (el.rot ? der.concat(izq) : izq.concat(der)), d: (el) => geo(el).svg,
    rotAt: (el) => [el.a[0] + geo(el, true).w / 2, el.a[1] - 9, 'middle'] };
}
const verTxt = (el) => (el.ver === 'v1' ? 'V1' : 'V2');
// Pin suelto de la micro:bit: qué pin es (el del elemento o el que trae el componente), si es de alimentación y el ancho de su etiqueta
const pinDe = (el) => el.pin || (COMP.get(el.c) || {}).mb || 'P0';
const potencia = (p) => p === '3V' || p === 'GND';
const anchoPin = (el) => Math.max(28, pinDe(el).length * 7.5 + 12);
const polar = (el) => { const c = COMP.get(el.c); return !!(c && c.esq && c.esq.pol); };
const EXT_IZQ = EXTENSOR.slice(0, Math.ceil(EXTENSOR.length / 2)), EXT_DER = EXTENSOR.slice(Math.ceil(EXTENSOR.length / 2));
Object.assign(ESQ, {
  tierra: { n: 1, term: (el) => [el.a],
    d: (el) => `<g transform="translate(${el.a[0]},${el.a[1]})"><rect x="-13" y="-2" width="26" height="25" fill="#000" fill-opacity="0"/>${linea('M0,0 V10 M-12,10 H12 M-8,15 H8 M-4,20 H4')}</g>` },
  texto: { n: 1, term: () => [], d: (el) => txt(el.valor || 'Texto', el.a[0], el.a[1], { t: 13, a: 'start' }) },
  // pin suelto de la micro:bit (3V, GND, P0…): una etiqueta con su nombre; el terminal es la punta
  mbpin: { n: 1, rota: 2, nombres: (el) => [pinDe(el)], term: (el) => [el.a],
    rotAt: (el) => [el.a[0] + (el.rot ? -1 : 1) * (16 + anchoPin(el) / 2), el.a[1] + 21, 'middle'],
    d: (el) => { const [x, y] = el.a, s = el.rot ? -1 : 1, p = pinDe(el), w = anchoPin(el), x1 = x + s * 16, x2 = x + s * (16 + w), cx = (x1 + x2) / 2 - s * 2;
      return linea(`M${x},${y} H${x + s * 8}`) + forma(`M${x + s * 8},${y} L${x1},${y - 10} H${x2} V${y + 10} H${x1} Z`, potencia(p) ? '#111' : '#fff') +
        txt(p, cx, y, { t: 10, w: 800, c: potencia(p) ? '#fff' : '#111' }) + txt('micro:bit', (x1 + x2) / 2, y - 16.5, { t: 6.5, w: 700, c: '#555' }); } },
  // micro:bit: simple (los 5 anillos, abajo) o con extensor (todos los pines, a los lados)
  microbit: { n: 1, nombres: (el) => (el.ext ? EXTENSOR : ANILLOS),
    term: (el) => (el.ext ? bloque(el.a, 'micro:bit ' + verTxt(el), EXT_IZQ, EXT_DER, true).pts : ANILLOS.map((p, i) => [el.a[0] + G * (i + 1), el.a[1] + 100])),
    zonas: (el) => (el.ext ? ESQ.microbit.term(el).map((p, i) => [p[0] + (i < EXT_IZQ.length ? 34 : -34), p[1]]) : ANILLOS.map((p, i) => [el.a[0] + G * (i + 1), el.a[1] + 70])),
    d: (el) => {
      if (el.ext) return bloque(el.a, 'micro:bit ' + verTxt(el), EXT_IZQ, EXT_DER).svg;
      const [x, y] = el.a;
      return caja(x, y, 120, 80, 6) + txt('micro:bit', x + 60, y + 28, { t: 13, w: 800 }) + txt(verTxt(el), x + 60, y + 44, { t: 9, w: 700, c: '#555' }) +
        ANILLOS.map((p, i) => linea(`M${x + G * (i + 1)},${y + 80} V${y + 100}`) + txt(p, x + G * (i + 1), y + 70, { t: 8, w: 700 })).join('');
    } },
});

/* ---------- Protoboard: geometría (30 o 60 columnas) ---------- */
const colX = (c) => 40 + (c - 1) * G;
const FILAS = { a: 80, b: 100, c: 120, d: 140, e: 160, f: 220, g: 240, h: 260, i: 280, j: 300 }, FILA_Y = Object.values(FILAS);
const RIELES = [20, 40, 340, 360];   // +, −, +, −
const enRiel = (c) => c >= 2 && (c - 2) % 6 !== 5;
const placas = {};
function placa(cols) {
  const k = cols + (real() ? 'r' : ''); if (placas[k]) return placas[k];
  const ag = [], w = colX(cols) + 40;
  for (let c = 1; c <= cols; c++) { FILA_Y.forEach((y) => ag.push([colX(c), y])); if (enRiel(c)) RIELES.forEach((y) => ag.push([colX(c), y])); }
  let s = caja(0, -10, w, 400, 9) + `<rect x="12" y="181" width="${w - 24}" height="18" rx="3" fill="#f1f1f1" stroke="#999" stroke-width="1"/>`;
  [[9, 51], [329, 371]].forEach(([y1, y2]) => { s += `<path d="M52,${y1} H${w - 32} M52,${y2} H${w - 32}" fill="none" stroke="#9a9a9a" stroke-width="1"/>`; });
  RIELES.forEach((y, k) => { const sg = k % 2 ? '−' : '+'; s += txt(sg, 22, y, { t: 13, w: 700 }) + txt(sg, w - 22, y, { t: 13, w: 700 }); });
  Object.entries(FILAS).forEach(([l, y]) => { s += txt(l, 22, y, { t: 9, c: '#555' }) + txt(l, w - 22, y, { t: 9, c: '#555' }); });
  for (let c = 1; c <= cols; c++) if (c === 1 || c % 5 === 0) s += txt(c, colX(c), 66, { t: 8, c: '#555' }) + txt(c, colX(c), 314, { t: 8, c: '#555' });
  s += ag.map(([x, y]) => `<rect x="${x - 2.6}" y="${y - 2.6}" width="5.2" height="5.2" fill="#fff" stroke="#6d6d6d" stroke-width="1"/>`).join('');
  return (placas[k] = { cols, w, agujeros: ag, svg: real() ? placaReal(cols, { colX, FILAS, RIELES, enRiel }) : `<g pointer-events="none">${s}</g>` });
}
const colsP = () => (E.proto.cols === 60 ? 60 : 30);
const colCerca = (x, ancho = 1) => Math.max(1, Math.min(colsP() - ancho + 1, Math.round((x - 40) / G) + 1));
const filaCerca = (y) => FILA_Y.reduce((m, yy) => (Math.abs(yy - y) < Math.abs(m - y) ? yy : m), FILA_Y[0]);
// Nodo eléctrico de un punto de la protoboard: media columna (a–e o f–j), un riel entero o el punto suelto
function nodoProto(p) {
  const c = Math.round((p[0] - 40) / G) + 1;
  if (c >= 1 && c <= colsP() && Math.abs(colX(c) - p[0]) < 0.5) {
    const f = FILA_Y.indexOf(p[1]); if (f >= 0) return 'c' + c + (f < 5 ? 'a' : 'f');
    const r = RIELES.indexOf(p[1]); if (r >= 0 && enRiel(c)) return 'r' + r;
  }
  return 'p' + p[0] + ',' + p[1];
}

/* ---------- Protoboard: piezas propias del editor ----------
   n: 2 = dos patas · 'fijo' = huella fija sobre agujeros · 'libre' = fuera de la placa. */
function cuerpoRes(el) {   // cuerpo con sus 4 bandas de color
  const b = bandas(el.ohm || 0), cols = [BANDA[b.d1][1], BANDA[b.d2][1], colorMult(b.m)[1], colorTol(el.tol || 5)[1]];
  return caja(-22, -7, 44, 14, 6, '#fff', 1.6) + [-15.5, -8.5, -1.5, 11.5].map((x, i) => `<rect x="${x}" y="-6.2" width="4.6" height="12.4" fill="${cols[i]}" stroke="#111" stroke-width="0.5"/>`).join('');
}
const MB_ANILLOS = [30, 70, 110, 150, 190].map((x) => [x, 150]), MB_EXT = EXTENSOR.map((p, i) => [-90 + G * i, 222]);
const mbMundo = (el, l) => l.map(([x, y]) => (el.arriba ? [el.a[0] + 220 - x, el.a[1] + 170 - y] : [el.a[0] + x, el.a[1] + y]));
const PROTO = {
  cable: { n: 2 },
  resistencia: { n: 2, alto: 10, d: (el) => cuerpoRes(el) },
  led: { n: 2, alto: 12, d: () => forma('M7,-5.66 A9,9 0 1 0 7,5.66 Z', '#fff', 1.6) + circ(4.5, -0.6, 0, 'none', 1) },
  capacitor: { n: 2, alto: 13, d: () => circ(10, 0, 0, '#fff', 1.6) + `<path d="M5,-8.66 A10,10 0 0 1 5,8.66 Z" fill="#111"/>` },
  diodo: { n: 2, alto: 8, d: () => caja(-13, -5, 26, 10, 2, '#fff', 1.6) + `<rect x="6.5" y="-5" width="3.6" height="10" fill="#111"/>` },
  ldr: { n: 2, alto: 13, d: () => circ(10, 0, 0, '#fff', 1.6) + linea('M-6,-5 H6 V-1.7 H-6 V1.7 H6 V5 H-6', 1.2) },
  zumbador: { n: 2, alto: 17, d: (el, deg) => circ(14, 0, 0, '#fff', 1.6) + circ(3, 0, 0, '#fff', 1.4) + txt('+', -9, 0, { t: 9, w: 700, deg }) },
  pulsador: { n: 'fijo', ancla: (p) => [colX(colCerca(p[0], 3)), FILAS.e], rotAt: (el) => [el.a[0] + 20, el.a[1] - 10, 'middle'],
    term: (el) => { const [x, y] = el.a; return [[x, y], [x, y + 3 * G], [x + 2 * G, y], [x + 2 * G, y + 3 * G]]; },   // las dos patas de una misma columna están unidas por dentro
    d: (el) => { const [x, y] = el.a; return PROTO.pulsador.term(el).map((p) => pin(p[0], p[1])).join('') + linea(`M${x},${y} V${y + 6} M${x + 40},${y} V${y + 6} M${x},${y + 60} V${y + 54} M${x + 40},${y + 60} V${y + 54}`, 1.6) + caja(x - 5, y + 5, 50, 50, 3, '#fff', 1.6) + circ(11, x + 20, y + 30, '#fff', 1.6); } },
  potenciometro: { n: 'fijo', ancla: (p) => [colX(colCerca(p[0], 3)), filaCerca(p[1])], rotAt: (el) => [el.a[0] + 20, el.a[1] - 62, 'middle'],
    term: (el) => [0, 1, 2].map((i) => [el.a[0] + G * i, el.a[1]]),
    d: (el) => { const [x, y] = el.a; return [0, 1, 2].map((i) => linea(`M${x + G * i},${y} V${y - 8}`, 1.6) + pin(x + G * i, y)).join('') + caja(x - 5, y - 52, 50, 46, 3, '#fff', 1.6) + circ(14, x + 20, y - 29, '#fff', 1.6) + linea(`M${x + 12},${y - 21} L${x + 28},${y - 37}`, 2.4); } },
  portapilas: { n: 'libre', rotAt: (el) => [el.a[0] + 60, el.a[1] - 10, 'middle'], term: (el) => [[el.a[0] + 150, el.a[1] + 20], [el.a[0] + 150, el.a[1] + 40]],
    d: (el) => {
      const [x, y] = el.a, cable = (yy, c) => `<path d="M${x + 120},${yy} H${x + 150}" stroke="#111" stroke-width="5" stroke-linecap="round"/><path d="M${x + 120},${yy} H${x + 150}" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`;
      return cable(y + 20, CABLES.rojo) + cable(y + 40, CABLES.negro) + caja(x, y, 120, 60, 5) +
        caja(x + 9, y + 8, 94, 19, 3, '#fff', 1.4) + caja(x + 103, y + 13, 5, 9, 1, '#fff', 1.4) + caja(x + 17, y + 33, 94, 19, 3, '#fff', 1.4) + caja(x + 12, y + 38, 5, 9, 1, '#fff', 1.4) +
        txt('+', x + 94, y + 17.5, { t: 11, w: 700 }) + txt('−', x + 20, y + 17.5, { t: 11, w: 700 }) + txt('+', x + 27, y + 42.5, { t: 11, w: 700 }) + txt('−', x + 101, y + 42.5, { t: 11, w: 700 }) +
        txt('+', x + 136, y + 9, { t: 12, w: 700 }) + txt('−', x + 136, y + 52, { t: 12, w: 700 }) + borne(x + 150, y + 20) + borne(x + 150, y + 40);
    } },
  // micro:bit: simple (5 anillos) o enchufada en un extensor con un borne por pin.
  // «arriba»: el conector mira hacia arriba (cómodo cuando la placa va debajo de la protoboard)
  microbit: { n: 'libre', nombres: (el) => (el.ext ? EXTENSOR : ANILLOS), term: (el) => mbMundo(el, el.ext ? MB_EXT : MB_ANILLOS),
    zonas: (el) => mbMundo(el, el.ext ? MB_EXT.map(([x]) => [x, 196]) : MB_ANILLOS.map(([x]) => [x, 121])),
    rotAt: (el) => [el.a[0] + 110, el.a[1] - 10 - (el.arriba && el.ext ? 70 : 0), 'middle'],
    d: (el) => {
      const deg = el.arriba ? 180 : 0; let s = caja(0, 0, 220, 170, 14);
      s += `<rect x="95" y="11" width="30" height="15" rx="7.5" fill="none" stroke="#111" stroke-width="1.4"/><circle cx="104" cy="18.5" r="1.7" fill="#111"/><circle cx="116" cy="18.5" r="1.7" fill="#111"/>` + txt(verTxt(el), 196, 17, { t: 9, w: 800, deg });
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) s += `<rect x="${110 - 2.5 + (i - 2) * 14}" y="${40 + j * 15}" width="5" height="9" rx="1.5" fill="#fff" stroke="#111" stroke-width="1"/>`;
      [[29, 'A'], [191, 'B']].forEach(([bx, l]) => { s += caja(bx - 13, 60, 26, 26, 3, '#fff', 1.4) + circ(7, bx, 73, '#fff', 1.4) + txt(l, bx, 50, { t: 10, w: 800, deg }); });
      if (!el.ext) {
        s += `<path d="M0,128 H220" stroke="#111" stroke-width="1.2"/>`;
        MB_ANILLOS.forEach(([px], i) => {
          s += caja(px - 13, 133, 26, 37, 0, '#fff', 1.4) + circ(7.5, px, 150, '#fff', 1.6) + txt(['0', '1', '2', '3V', 'GND'][i], px, 121, { t: 9, w: 800, deg });
          if (i < 4) s += `<path d="M${px + 16},140 V170 M${px + 20},140 V170 M${px + 24},140 V170" stroke="#777" stroke-width="1"/>`;
        });
      } else {   // extensor: ranura donde entra la placa y una fila de bornes rotulados
        s += caja(-104, 146, 428, 92, 6) + `<rect x="-4" y="151" width="228" height="9" rx="2" fill="#111"/>` + txt('EXTENSOR', 268, 168, { t: 7, w: 800, c: '#555', deg });
        EXTENSOR.forEach((p, i) => {
          const x = -90 + G * i, c = caps(p, el.ver || 'v2');
          s += c.potencia ? `<rect x="${x - 9}" y="189.5" width="18" height="13" fill="#111"/>` + txt(p, x, 196, { t: 6.6, w: 800, c: '#fff', deg }) : txt(p, x, 196, { t: 6.6, w: 700, deg });
          if (c.pantalla) s += `<rect x="${x - 1.8}" y="205.2" width="3.6" height="3.6" fill="#111"/>`;
          else if (c.boton) s += `<circle cx="${x}" cy="207" r="1.9" fill="#fff" stroke="#111" stroke-width="1.1"/>`;
          else if (c.i2c) s += `<path d="M${x},204.3 l2.7,2.7 l-2.7,2.7 l-2.7,-2.7 Z" fill="#111"/>`;
          s += borne(x, 222);
        });
      }
      return `<g transform="translate(${el.a[0]},${el.a[1]})${el.arriba ? ' rotate(180 110 85)' : ''}">${s}</g>`;
    } },
  // pin suelto de la micro:bit: un trozo del borde de la placa con su anillo (el terminal es el agujero del anillo)
  mbpin: { n: 'libre', rota: 2, nombres: (el) => [pinDe(el)], term: (el) => [[el.a[0] + 20, el.a[1] + (el.rot ? 14 : 36)]],
    rotAt: (el) => [el.a[0] + 20, el.a[1] + (el.rot ? 60 : -9), 'middle'],
    d: (el) => { const [x, y] = el.a, r = !!el.rot, p = pinDe(el), yy = (v) => y + (r ? 50 - v : v);
      return caja(x, y, 40, 50, 5) + caja(x + 7, r ? y : y + 22, 26, 28, 0, '#fff', 1.4) + circ(7.5, x + 20, yy(36), '#fff', 1.6) +
        (potencia(p) ? `<rect x="${x + 7}" y="${yy(15.5) - 6.5}" width="26" height="13" fill="#111"/>` : '') + txt(p, x + 20, yy(15.5), { t: potencia(p) ? 8 : 9.5, w: 800, c: potencia(p) ? '#fff' : '#111' }) +
        txt('micro:bit', x + 20, yy(6.5), { t: 5.4, w: 700, c: '#555' }); } },
  motor: { n: 'libre', rota: 2, rotAt: (el) => [el.a[0], el.a[1] - (el.rot ? 52 : 46), 'middle'], term: (el) => { const s = el.rot ? -1 : 1; return [[el.a[0] - 10, el.a[1] + 40 * s], [el.a[0] + 10, el.a[1] + 40 * s]]; },
    d: (el) => { const [x, y] = el.a, s = el.rot ? -1 : 1; return linea(`M${x - 10},${y + 20 * s} V${y + 40 * s} M${x + 10},${y + 20 * s} V${y + 40 * s}`, 1.6) + caja(x - 3.5, s > 0 ? y - 35 : y + 22, 7, 13, 1, '#fff', 1.6) + circ(24, x, y) + txt('M', x, y, { t: 15, w: 800 }) + borne(x - 10, y + 40 * s) + borne(x + 10, y + 40 * s); } },
};

/* ---------- Protoboard: formas genéricas de la base de componentes ---------- */
const axialProto = (comp, fo) => ({ n: 2, alto: 9, d: (el, deg) => caja(-15, -5.5, 30, 11, 2.5, '#fff', 1.6) + (fo.banda ? `<rect x="8.5" y="-5.5" width="3.6" height="11" fill="#111"/>` : '') +
  (fo.txt ? txt(fo.txt, fo.banda ? -3 : 0, 0, { t: cabe(fo.txt, fo.banda ? 19 : 26, 6.5), w: 700, deg: Math.abs(deg) > 90 ? 180 : 0 }) : '') });
const radialProto = (comp, fo) => { const r = fo.r || 9; return { n: 2, alto: r + 3, d: (el, deg) => circ(r, 0, 0, '#fff', 1.6) + (fo.marca ? txt(fo.marca, 0, 0, { t: cabe(fo.marca, 2 * r - 4, 7), w: 700, deg }) : '') + (fo.pol ? txt('+', -(r + 5), -8, { t: 9, w: 700, deg }) : '') }; };
const enFila = (el, n) => Array.from({ length: n }, (_, i) => [el.a[0] + G * (el.rot ? n - 1 - i : i), el.a[1]]);
const anclaFila = (n) => (p) => [colX(colCerca(p[0], n)), filaCerca(p[1])];
const nombresPines = (comp, pts, dy, halo = true) => pts.map((p, i) => txt(comp.pines[i].n, p[0], p[1] + dy, { t: cabe(comp.pines[i].n, 17, 5.8), w: 700, halo })).join('');
function to92Proto(comp, fo) {   // 3 patas juntas, cuerpo en D visto de arriba
  const n = comp.pines.length;
  return { n: 'fijo', rota: 2, ancla: anclaFila(n), term: (el) => enFila(el, n), rotAt: (el) => [el.a[0] + G * (n - 1) / 2, el.a[1] + (el.rot ? 36 : -36), 'middle'],
    d: (el) => { const pts = enFila(el, n), s = el.rot ? -1 : 1, cx = el.a[0] + G * (n - 1) / 2, y = el.a[1], r = G * (n - 1) / 2 + 6;
      return forma(`M${cx - r},${y + 8 * s} V${y - 3 * s} A${r},${N(r * 0.85)} 0 0 ${s > 0 ? 1 : 0} ${cx + r},${y - 3 * s} V${y + 8 * s} Z`, '#fff', 1.6) + (fo.marca ? txt(fo.marca, cx, y - 13 * s, { t: cabe(fo.marca, 2 * r - 14, 7), w: 800 }) : '') + pts.map((p) => pin(p[0], p[1])).join('') + nombresPines(comp, pts, 15 * s); } };
}
function to220Proto(comp, fo) {   // 3 patas juntas, cuerpo con aleta
  const n = comp.pines.length;
  return { n: 'fijo', rota: 2, ancla: anclaFila(n), term: (el) => enFila(el, n), rotAt: (el) => [el.a[0] + G * (n - 1) / 2, el.a[1] + (el.rot ? 44 : -42), 'middle'],
    d: (el) => { const pts = enFila(el, n), s = el.rot ? -1 : 1, cx = el.a[0] + G * (n - 1) / 2, y = el.a[1], w = G * (n - 1) + 16;
      return pts.map((p) => linea(`M${p[0]},${y} V${y - 8 * s}`, 1.6)).join('') + caja(cx - w / 2, s > 0 ? y - 26 : y + 8, w, 18, 1.5, '#fff', 1.6) + `<rect x="${cx - w / 2}" y="${s > 0 ? y - 32 : y + 27}" width="${w}" height="5" fill="#111"/>` +
        (fo.marca ? txt(fo.marca, cx, y - 17 * s, { t: cabe(fo.marca, w - 6, 7), w: 800 }) : '') + pts.map((p) => pin(p[0], p[1])).join('') + nombresPines(comp, pts, 13 * s); } };
}
function dipProto(comp, fo) {   // integrado a caballo del canal; la pata 1 está junto a la muesca
  const n = comp.pines.length + comp.pines.length % 2, m = n / 2;
  const term = (el) => comp.pines.map((_, i) => { const [x, y] = el.a; return i < m ? [x + G * (el.rot ? m - 1 - i : i), el.rot ? y : y + 3 * G] : [x + G * (el.rot ? i - m : n - 1 - i), el.rot ? y + 3 * G : y]; });
  return { n: 'fijo', rota: 2, ancla: (p) => [colX(colCerca(p[0], m)), FILAS.e], term, rotAt: (el) => [el.a[0] + G * (m - 1) / 2, el.a[1] - 12, 'middle'],
    d: (el) => {
      const [x, y] = el.a, pts = term(el), w = (m - 1) * G + 16, yc = y + 1.5 * G, xm = el.rot ? x + w - 8 : x - 8, titulo = fo.txt || comp.nombre;
      let s = pts.map((p) => linea(`M${p[0]},${p[1]} V${p[1] + (p[1] > yc ? -8 : 8)}`, 1.6) + pin(p[0], p[1])).join('') + caja(x - 8, y + 7, w, 3 * G - 14, 3, '#fff', 1.6);
      s += linea(`M${xm},${yc - 5} A5,5 0 0 ${el.rot ? 0 : 1} ${xm},${yc + 5}`, 1.4) + `<circle cx="${pts[0][0] + (el.rot ? 5 : -5)}" cy="${pts[0][1] + (pts[0][1] > yc ? -21 : 21)}" r="1.8" fill="#111"/>`;
      s += pts.map((p, i) => txt(comp.pines[i].n, p[0], p[1] + (p[1] > yc ? -12.5 : 12.5), { t: cabe(comp.pines[i].n, 17, 5.6), w: 700 })).join('');
      return s + txt(titulo, x + G * (m - 1) / 2, yc, { t: cabe(titulo, w - 22, 9), w: 800 });
    } };
}
function moduloProto(comp, fo) {   // plaqueta con una tira de pines enchufada en una fila
  const n = comp.pines.length, w = Math.max(fo.w || 0, (n - 1) * G + 18), h = Math.max(fo.h || 40, 40), titulo = fo.txt || comp.nombre;
  const arriba = (el) => (el.rot ? el.a[1] - 9 : el.a[1] - h + 9);
  return { n: 'fijo', rota: 2, caja: { w, h }, ancla: anclaFila(n), term: (el) => enFila(el, n), rotAt: (el) => [el.a[0] + G * (n - 1) / 2, el.rot ? arriba(el) + h + 9 : arriba(el) - 9, 'middle'],
    d: (el) => { const pts = enFila(el, n), s = el.rot ? -1 : 1, cx = el.a[0] + G * (n - 1) / 2, y = el.a[1], top = arriba(el);
      return caja(cx - w / 2, top, w, h, 3, '#fff', 1.6) + `<path d="M${cx - w / 2 + 4},${y - 19 * s} H${cx + w / 2 - 4}" stroke="#999" stroke-width="1"/>` +
        txt(titulo, cx, s > 0 ? top + (h - 28) / 2 : top + 28 + (h - 28) / 2, { t: cabe(titulo, w - 10, 9), w: 800 }) + pts.map((p) => pin(p[0], p[1])).join('') + nombresPines(comp, pts, -11 * s, false); } };
}
// Dibujos propios de algunos elementos sueltos (x, y, w, h = zona libre de la caja; t = texto)
const ARTE = {
  servo: (x, y, w, h, t) => txt(t, x + (w - 26) / 2, y + h / 2, { t: cabe(t, w - 34, 9), w: 800 }) + `<rect x="${x + w - 30}" y="${y + h / 2 - 3}" width="26" height="6" rx="3" fill="#fff" stroke="#111" stroke-width="1.3" transform="rotate(-35 ${x + w - 15} ${y + h / 2})"/>` + circ(4, x + w - 15, y + h / 2, '#fff', 1.3),
  pila9v: (x, y, w, h, t) => circ(6, x + w / 2 - 11, y + 9, '#fff', 1.5) + forma(`M${x + w / 2 + 5},${y + 9} l3,-5.2 h6 l3,5.2 l-3,5.2 h-6 Z`, '#fff', 1.5) + txt(t, x + w / 2, y + h / 2 + 8, { t: cabe(t, w - 8, 10), w: 800 }),
  'pila-boton': (x, y, w, h, t) => circ(Math.min(w, h) / 2 - 2, x + w / 2, y + h / 2, '#fff', 1.5) + txt('+', x + w / 2, y + h / 2 - 7, { t: 10, w: 800 }) + txt(t, x + w / 2, y + h / 2 + 5, { t: cabe(t, Math.min(w, h) - 14, 7), w: 700 }),
  multimetro: (x, y, w, h) => caja(x + 7, y + 4, w - 14, 14, 2, '#fff', 1.3) + txt('0.00', x + w / 2, y + 11, { t: 8.5, w: 800 }) + circ(Math.max(5, Math.min(10, (h - 26) / 2)), x + w / 2, y + 20 + (h - 20) / 2, '#fff', 1.4) + linea(`M${x + w / 2},${y + 20 + (h - 20) / 2} l4,-6`, 1.6),
  altavoz: (x, y, w, h) => { const r = Math.min(w, h) / 2 - 2; return circ(r, x + w / 2, y + h / 2, '#fff', 1.5) + circ(N(r * 0.58), x + w / 2, y + h / 2, '#fff', 1.2) + circ(N(r * 0.2), x + w / 2, y + h / 2, '#111', 1); },
};
function libreProto(comp, fo) {   // caja suelta con un borne por pin (los positivos y negativos de las fuentes, marcados)
  const n = comp.pines.length, dos = n > 8, k1 = dos ? Math.ceil(n / 2) : n, k2 = n - k1, titulo = fo.txt || comp.nombre;
  const w = Math.max(60, Math.ceil(Math.max(fo.w || 0, k1 * G + 10) / 20) * 20), h = Math.max(fo.h || 50, dos ? 64 : 40), x0 = (k) => Math.round((w - (k - 1) * G) / 20) * 10;
  const local = (el) => comp.pines.map((_, i) => { const abajo = i < k1; return [x0(abajo ? k1 : k2) + (abajo ? i : i - k1) * G, dos ? (abajo ? h + 14 : -14) : el.rot ? -14 : h + 14]; });
  return { n: 'libre', rota: dos ? 0 : 2, caja: { w, h, dos }, term: (el) => local(el).map(([x, y]) => [el.a[0] + x, el.a[1] + y]),
    rotAt: (el) => [el.a[0] + w / 2, dos ? el.a[1] - 26 : el.rot ? el.a[1] + h + 12 : el.a[1] - 9, 'middle'],
    d: (el) => {
      const [x, y] = el.a, hayArr = dos || !!el.rot, hayAba = dos || !el.rot; let s = '', nom = '';
      local(el).forEach(([lx, ly], i) => {
        const p = comp.pines[i], ab = ly > 0, col = p.rol === 'fuente+' ? CABLES.rojo : p.rol === 'fuente-' ? '#111' : '#fff';
        s += linea(`M${x + lx},${ab ? y + h : y} V${y + ly}`, 1.6) + borne(x + lx, y + ly, col);
        nom += txt(p.n, x + lx, ab ? y + h - 7 : y + 7, { t: cabe(p.n, 18, 6.4), w: 700 });
      });
      const ay = y + (hayArr ? 12 : 2), ah = h - (hayArr ? 12 : 2) - (hayAba ? 12 : 2);
      return s + caja(x, y, w, h, 5) + (ARTE[fo.arte] ? ARTE[fo.arte](x + 2, ay, w - 4, ah, titulo) : txt(titulo, x + w / 2, ay + ah / 2, { t: cabe(titulo, w - 10, 10), w: 800 })) + nom;
    } };
}

/* ---------- Base de componentes ---------- */
// Datos mínimos de las piezas propias del editor, por si la base no las trae: [nombre, categoría, prefijo, valor, patas]
const PROPIOS = {
  resistencia: ['Resistencia', 'basicos', 'R', '220 Ω', '1 2'], pila: ['Pila', 'fuentes', 'B', '1,5 V', '+ −'], bateria: ['Batería', 'fuentes', 'B', '3 V', '+ −'], fuente: ['Fuente CC', 'fuentes', 'V', '5 V', '+ −'],
  led: ['LED', 'basicos', 'LED', '', 'A K'], diodo: ['Diodo', 'semis', 'D', '', 'A K'], lampara: ['Lámpara', 'salidas', 'L', '', '1 2'], interruptor: ['Interruptor', 'entradas', 'S', '', '1 2'], pulsador: ['Pulsador', 'entradas', 'S', '', '1 2'],
  capacitor: ['Capacitor', 'basicos', 'C', '100 µF', '+ −'], potenciometro: ['Potenciómetro', 'entradas', 'P', '10 kΩ', '1 C 2'], ldr: ['LDR', 'sensores', 'LDR', '', '1 2'], termistor: ['Termistor', 'sensores', 'NTC', '', '1 2'],
  amperimetro: ['Amperímetro', 'instrumentos', '', '', '+ −'], voltimetro: ['Voltímetro', 'instrumentos', '', '', '+ −'], motor: ['Motor', 'salidas', 'M', '', '1 2'], zumbador: ['Zumbador', 'salidas', 'BZ', '', '+ −'],
  tierra: ['Tierra', 'basicos', '', '', 'GND'], texto: ['Texto', 'basicos', '', 'Texto', ''], microbit: ['micro:bit', 'placas', '', '', ''], portapilas: ['Portapilas', 'fuentes', '', '3 V', '+ −'],
};
const COMP = new Map(), LISTA = [], NAT = { esq: {}, proto: {} }, SINT = {};
COMPONENTES.forEach((c) => { if (c && c.id && !COMP.has(c.id)) { if (!Array.isArray(c.pines)) c.pines = []; COMP.set(c.id, c); LISTA.push(c); } });
if (!COMP.has('cable')) COMP.set('cable', { id: 'cable', nombre: 'Cable', pines: [], esq: { f: 'nativo', t: 'cable' }, proto: { f: 'nativo', t: 'cable' } });
function sintetico(t, v) {
  let c = SINT[t];
  if (!c) {
    const [nombre, cat, pref, valor, pines] = PROPIOS[t], fuente = cat === 'fuentes';
    c = SINT[t] = { id: COMP.has(t) ? '_' + t : t, nombre, cat, pref, valor: valor || undefined, tk: true, sint: t, esq: null, proto: null,
      pines: pines ? pines.split(' ').map((n) => ({ n, rol: fuente ? (n === '+' ? 'fuente+' : 'fuente-') : t === 'led' ? 'led' : t === 'tierra' ? 'fuente-' : 'pas', v: fuente && n === '+' ? parseFloat(valor.replace(',', '.')) : undefined, vf: t === 'led' ? 2 : undefined, i: t === 'led' ? 15 : undefined })) : [] };
    COMP.set(c.id, c); LISTA.push(c);
  }
  c[v] = { f: 'nativo', t }; return c;
}
// Qué componente corresponde a cada pieza propia en cada vista (para abrir circuitos del formato anterior):
// el de la base con ese mismo id; si la base lo dibuja ahora de otra forma, una copia del símbolo viejo (no va al
// catálogo); si no, el de la base que use esa pieza con el mismo valor inicial (o el primero); y si ninguno, uno propio.
for (const v of ['esq', 'proto']) {
  const propios = v === 'esq' ? ESQ : PROTO, base = LISTA.slice();
  Object.keys(PROPIOS).forEach((t) => {
    if (!propios[t]) return;
    const usan = base.filter((c) => c[v] && c[v].f === 'nativo' && c[v].t === t), mismo = usan.find((c) => c.id === t);
    NAT[v][t] = mismo ? mismo.id : COMP.has(t) && COMP.get(t)[v] ? sintetico(t, v).id : usan.length ? (usan.find((c) => c.valor === PROPIOS[t][3]) || usan[0]).id : sintetico(t, v).id;
  });
}
NAT.esq.cable = NAT.proto.cable = 'cable';
const cacheDef = new Map();
function defDe(comp, v) {   // cómo se dibuja un componente en una vista
  const k = comp.id + '|' + v; if (cacheDef.has(k)) return cacheDef.get(k);
  const fo = comp[v], np = comp.pines.length; let d = null;
  if (fo && v === 'esq') { const nb = fo.pines || comp.pines.map((p) => p.n); d = (fo.f === 'nativo' && ESQ[fo.t]) || (ESQ[fo.f] && ESQ[fo.f].n === 2 && nb.length <= 2 && ESQ[fo.f]) || (ESQ3[fo.f] && nb.length === 3 && tresEsq(comp, ESQ3[fo.f], nb)) || bloqueEsq(comp, fo); }
  else if (fo) {
    const gen = { axial: np === 2 && axialProto, radial: np === 2 && radialProto, to92: np >= 2 && to92Proto, to220: np >= 2 && to220Proto, dip: np >= 4 && dipProto, modulo: np >= 1 && moduloProto }[fo.f];
    d = (fo.f === 'nativo' && PROTO[fo.t]) || (gen || libreProto)(comp, fo);
  }
  cacheDef.set(k, d); return d;
}
const enVista = (c, v) => !!c[v] && !(c.sint && COMP.has(c.sint) && COMP.get(c.sint) !== c && COMP.get(c.sint)[v]);   // ¿va en el catálogo de esa vista?
const texBusca = (c) => norm([c.nombre, c.alias, c.id, (CATEGORIAS.find((k) => k.id === c.cat) || {}).nombre, c.desc].join(' '));
function buscar(q, v) {   // componentes que coinciden con todas las palabras; primero los que coinciden en el nombre
  const pal = norm(q).split(/\s+/).filter(Boolean);
  return LISTA.filter((c) => (enVista(c, 'esq') || enVista(c, 'proto')) && pal.every((p) => texBusca(c).includes(p))).map((c) => ({ c, o: (norm(c.nombre).startsWith(pal[0] || '') ? 0 : norm(c.nombre).includes(pal[0] || '') ? 1 : 2) + (v && !enVista(c, v) ? 10 : 0) })).sort((a, b) => a.o - b.o).map((x) => x.c);
}

/* ---------- Estado ---------- */
const vacio = () => ({ titulo: '', resEstilo: 'iec', esq: { els: [] }, proto: { els: [], cols: 30 } });
let E = vacio();
let vista = 'esq', sel = new Set(), herr = 'sel', pend = null, arr = null, espacio = false;
let pinSel = null;     // { el, pin }: pin elegido de una micro:bit
let resalte = null;    // aviso que se está señalando en el lienzo
let avisos = [], avisosAbierto = false, verFicha = 'v2', compMirado = null;
// Estilo de la protoboard: 'real' (dibujos realistas) o 'linea' (blanco y negro). Se recuerda y se guarda con el circuito.
const CLAVE_ESTILO = 'fisicabit_circuito_estilo';
let estilo = 'real'; try { if (localStorage.getItem(CLAVE_ESTILO) === 'linea') estilo = 'linea'; } catch (e) {}
function real() { return estilo === 'real'; }
const V = { esq: { x: 0, y: 0, k: 1 }, proto: { x: 0, y: 0, k: 1 } };
const colorNuevo = { esq: 'negro', proto: 'rojo' };
const hist = [], futuro = [];
const els = () => E[vista].els;
const porId = (id, v = vista) => E[v].els.find((e) => e.id === id) || null;
const elegidos = () => els().filter((e) => sel.has(e.id));
const elSel = () => (sel.size === 1 ? porId([...sel][0]) : null);
const comp = (el) => COMP.get(el.c);
const def = (el, v = vista) => defDe(COMP.get(el.c), v);
const nat = (el, v = vista) => { const fo = COMP.get(el.c)[v]; return fo && fo.f === 'nativo' ? fo.t : ''; };   // pieza propia del editor ('' si es una forma genérica)
const esMB = (el, v = vista) => nat(el, v) === 'microbit';
const terminales = (el, v = vista) => (def(el, v).n === 2 ? [el.a, el.b] : def(el, v).term(el));
function nombres(el, v = vista) {   // nombre de cada terminal, en el mismo orden que terminales()
  const d = def(el, v); if (d.nombres) return d.nombres(el);
  const fp = comp(el)[v].pines, p = fp && fp.length ? fp : comp(el).pines.map((q) => q.n), t = terminales(el, v);   // esq.pines / proto.pines mandan sobre «pines»
  return t.map((_, i) => (p.length ? p[i % p.length] : String(i + 1)));
}
const igual = (p, q) => Math.abs(p[0] - q[0]) < 0.5 && Math.abs(p[1] - q[1]) < 0.5;
function estado(t, err) { const e = $('#estado'); e.textContent = t; e.title = t; e.className = err ? 'err' : ''; }
const esPuerto = (el, v = vista) => nat(el, v) === 'mbpin';   // pin suelto de la micro:bit (3V, GND, P0…)
const deMB = (el, v = vista) => esMB(el, v) || esPuerto(el, v);
const primeraMB = (v = vista) => E[v].els.find((e) => esMB(e, v)) || null;
const refMB = (v = vista) => primeraMB(v) || E[v].els.find((e) => esPuerto(e, v)) || null;   // la placa del dibujo o, si no hay, uno de sus pines sueltos
const versionDibujo = () => { const m = refMB(); return m ? m.ver || 'v2' : verFicha; };

/* ---------- Dibujo de un elemento ---------- */
const haloEn = (x, y) => (real() && x > 0 && x < colX(colsP()) + 40 && y > -10 && y < 390 ? '#f4f0e3' : true);   // borde de un rótulo: del color de la placa si cae sobre ella
function rotulos(el, v, d) {
  const t1 = el.rotulo || '', t2 = v === 'esq' && el.c !== 'cable' ? el.valor || '' : '';
  if (!t1 && !t2) return '';
  const [ax, ay] = el.a, [bx, by] = el.b, L = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / L, uy = (by - ay) / L;
  const mx = (ax + bx) / 2, my = (ay + by) / 2, horiz = Math.abs(ux) >= Math.abs(uy), halo = v === 'proto' && haloEn(mx, my);
  let nx = -uy, ny = ux;
  if (horiz ? ny > 0 : nx < 0) { nx = -nx; ny = -ny; }   // horizontal: arriba · vertical: a la derecha
  const haciaArr = nx * uy - ny * ux > 0;   // ¿la normal elegida apunta al «arriba» del símbolo?
  const alto = v === 'proto' ? d.alto || 6 : null;
  const h1 = (alto != null ? alto : haciaArr ? d.arr : d.aba) + (Math.abs(ux * uy) > 0.2 ? 6 : 0), h2 = alto != null ? alto : haciaArr ? d.aba : d.arr;
  if (horiz) return (t1 ? txt(t1, mx + nx * (h1 + 9), my + ny * (h1 + 9), { t: 11, w: 700, halo }) : '') + (t2 ? txt(t2, mx - nx * (h2 + 10), my - ny * (h2 + 10), { t: 10.5 }) : '');
  const x = mx + nx * (h1 + 7), dos = t1 && t2;
  return (t1 ? txt(t1, x, my - (dos ? 7 : 0), { t: 11, w: 700, a: 'start', halo }) : '') + (t2 ? txt(t2, x, my + (dos ? 7 : 0), { t: 10.5, a: 'start' }) : '');
}
// Dibujo realista de un componente en la protoboard (null: va el de línea). Los de Wokwi aparecen cuando termina de cargar.
const cacheReal = new Map();
let verPartes = 0;   // sube cada vez que llegan o cambian los sensores de la extensión de MakeCode
const X_ARTE = { bandas: (el) => { const b = bandas(el.ohm || 0); return [BANDA[b.d1][1], BANDA[b.d2][1], colorMult(b.m)[1], colorTol(el.tol || 5)[1]]; }, ver: (el) => verTxt(el), pin: (el) => pinDe(el) };
function realDe(c) {
  if (!real() || !c.proto) return null;
  const k = c.id + (wokwiListo() ? '|w' : '') + '|' + verPartes; if (!cacheReal.has(k)) cacheReal.set(k, defReal(c, c.proto, defDe(c, 'proto'), X_ARTE));
  return cacheReal.get(k);
}
function dibujar(el, v, exp) {
  const d = def(el, v), r = v === 'proto' && el.c !== 'cable' ? realDe(comp(el)) : null; let s;
  if (d.n === 2) {
    const [ax, ay] = el.a, [bx, by] = el.b, L = Math.hypot(bx - ax, by - ay) || 0.01, deg = Math.atan2(by - ay, bx - ax) * 180 / Math.PI, Lr = N(L);
    let dentro;
    if (el.c === 'cable') {
      const c = CABLES[el.color] || CABLES.negro;
      dentro = v === 'esq' ? `<path d="M0,0 H${Lr}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>` : real() ? cableReal(L, el.color)
        : `<path d="M0,0 H${Lr}" stroke="#111" stroke-width="6.4" stroke-linecap="round"/><path d="M0,0 H${Lr}" stroke="${c}" stroke-width="3.8" stroke-linecap="round"/>`;
    } else if (r) dentro = r.d2(el, L, deg);
    else if (v === 'esq') {
      const a1 = Math.max(0, L / 2 - d.s);
      dentro = linea(`M0,0 H${N(a1)} M${N(L - a1)},0 H${Lr}`) + `<g transform="translate(${N(L / 2)},0)">${d.d(el, deg)}</g>`;
    } else dentro = linea(`M0,0 H${Lr}`, 1.6) + pin(0, 0) + pin(L, 0) + `<g transform="translate(${N(L / 2)},0)">${d.d(el, deg)}</g>`;
    const toque = exp ? '' : `<path d="M0,0 H${Lr}" stroke="#000" stroke-opacity="0" stroke-width="15" stroke-linecap="round"/>`;
    s = `<g transform="translate(${N(ax)},${N(ay)}) rotate(${N(deg)})">${toque}${dentro}</g>` + rotulos(el, v, r ? Object.assign({}, d, { alto: r.alto }) : d);
  } else {
    const pts = r ? d.term(el) : null;
    s = r ? r.d(el, pts) : d.d(el);
    const t2 = v === 'esq' && d.rota === 4 ? el.valor || '' : '';
    if (d.rotAt && (el.rotulo || t2)) { const [x, y, a] = r && r.rotAt ? r.rotAt(el, pts) : d.rotAt(el); s += (el.rotulo ? txt(el.rotulo, x, y, { t: 11, w: 700, a, halo: v === 'proto' && haloEn(x, y) }) : '') + (t2 ? txt(t2, x, y + (el.rotulo ? 14 : 0), { t: 10.5, a }) : ''); }
  }
  return exp ? `<g>${s}</g>` : `<g data-id="${el.id}">${s}</g>`;
}
// ¿El punto p cae sobre el interior del cable c (sin contar sus extremos)?
function enCable(p, c) {
  const dx = c.b[0] - c.a[0], dy = c.b[1] - c.a[1], px = p[0] - c.a[0], py = p[1] - c.a[1], t = px * dx + py * dy, L2 = dx * dx + dy * dy;
  return Math.abs(px * dy - py * dx) < 0.5 && t > 0.5 && t < L2 - 0.5;
}
// Puntos de unión del esquemático: 3 o más extremos juntos, o un extremo sobre el interior de un cable
function nodos(lista) {
  const cuenta = new Map(), pts = [];
  lista.forEach((el) => terminales(el, 'esq').forEach((p) => { const k = p[0] + ',' + p[1]; if (!cuenta.has(k)) { cuenta.set(k, 0); pts.push(p); } cuenta.set(k, cuenta.get(k) + 1); }));
  const cables = lista.filter((e) => e.c === 'cable');
  return pts.filter((p) => cuenta.get(p[0] + ',' + p[1]) >= 3 || cables.some((c) => enCable(p, c))).map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.6" fill="#111"/>`).join('');
}
const ORDEN = { libre: 0, fijo: 1, 2: 2 };
function contenido(v, exp) {
  let l = E[v].els;
  if (v === 'proto') l = l.slice().sort((p, q) => (p.c === 'cable' ? 3 : ORDEN[def(p, v).n]) - (q.c === 'cable' ? 3 : ORDEN[def(q, v).n]));
  return (v === 'proto' ? placa(colsP()).svg : '') + l.map((el) => dibujar(el, v, exp)).join('') + (v === 'esq' ? nodos(l) : '');
}

/* ---------- Redes: qué patas quedan unidas eléctricamente ----------
   Devuelve [[{ el, c, pin, ohm? }, …], …] (solo redes con 2 o más patas, salvo que se pidan todas; los cables
   unen pero no figuran). En el esquemático, los símbolos de tierra son una sola red, la del GND de la placa.
   Los pines sueltos de la micro:bit cuentan como pines de la placa (c: 'microbit'). */
function redes(v = vista, todas) {
  const lista = E[v].els, padre = new Map();
  const raiz = (k) => { if (!padre.has(k)) padre.set(k, k); let r = k; while (padre.get(r) !== r) r = padre.get(r); padre.set(k, r); return r; };
  const unir = (a, b) => { const ra = raiz(a), rb = raiz(b); if (ra !== rb) padre.set(ra, rb); };
  const nodo = (p) => (v === 'proto' ? nodoProto(p) : 'p' + p[0] + ',' + p[1]);
  const cables = lista.filter((e) => e.c === 'cable'), patas = [], puntos = [], hayTierra = v === 'esq' && lista.some((e) => nat(e, v) === 'tierra'), hayPuertos = lista.some((e) => esPuerto(e, v));
  cables.forEach((c) => { unir(nodo(c.a), nodo(c.b)); puntos.push(c.a, c.b); });
  lista.forEach((el) => {
    if (el.c === 'cable') return;
    const t = terminales(el, v), nom = nombres(el, v), c = deMB(el, v) ? 'microbit' : el.c, propio = nat(el, v);
    const ohm = el.ohm > 0 ? el.ohm : /Ω/.test(el.valor || '') ? leerOhm(el.valor) : NaN;   // resistencias y potenciómetros llevan su valor
    t.forEach((p, i) => {
      const k = 'e' + el.id + '|' + nom[i]; unir(k, nodo(p)); puntos.push(p);
      if (propio === 'tierra' || (hayTierra && c === 'microbit' && nom[i] === 'GND')) unir(k, 'TIERRA');
      if (hayPuertos && c === 'microbit') unir(k, 'MB|' + nom[i]);   // los pines sueltos con el mismo nombre son un mismo punto (y el de la placa, si está)
      if (!patas.some((x) => x.k === k)) patas.push(Object.assign({ k, el: el.id, c, pin: nom[i] }, ohm > 0 ? { ohm } : {}));
    });
  });
  if (v === 'esq') puntos.forEach((p) => cables.forEach((c) => { if (enCable(p, c)) unir(nodo(p), nodo(c.a)); }));
  const grupos = new Map();
  patas.forEach((x) => { const r = raiz(x.k), o = Object.assign({}, x); delete o.k; if (!grupos.has(r)) grupos.set(r, []); grupos.get(r).push(o); });
  return [...grupos.values()].filter((g) => todas || g.length >= 2);
}

/* ---------- Lienzo ---------- */
const svg = $('#lienzo'), gMundo = $('#mundo'), gCont = $('#g-contenido'), gSobre = $('#g-sobre');
function verVista() { const v = V[vista]; gMundo.setAttribute('transform', `translate(${N(v.x)},${N(v.y)}) scale(${N(v.k * 1000) / 1000})`); }
function pintar() { gCont.innerHTML = contenido(vista, false); pintarSobre(); }
// Caja de un nodo SVG en sus propias coordenadas. Como getBBox, pero de los dibujos de Wokwi cuenta solo lo que se ve
// (su data-lim): getBBox incluye lo recortado y lo invisible.
function cajaDom(nodo) {
  const lims = [...nodo.querySelectorAll('[data-lim]')]; if (!lims.length) return nodo.getBBox();
  const base = nodo.getScreenCTM(), mats = lims.map((n) => (base ? base.inverse().multiply(n.getScreenCTM()) : null));
  lims.forEach((n) => n.setAttribute('display', 'none'));
  const b = nodo.getBBox(); lims.forEach((n) => n.removeAttribute('display'));
  let x0 = b.x, y0 = b.y, x1 = b.x + b.width, y1 = b.y + b.height, vacia = !b.width && !b.height;
  lims.forEach((n, i) => { const m = mats[i], l = n.dataset.lim.split(',').map(Number); if (!m) return;
    [[l[0], l[1]], [l[2], l[1]], [l[0], l[3]], [l[2], l[3]]].forEach(([x, y]) => { const px = m.a * x + m.c * y + m.e, py = m.b * x + m.d * y + m.f;
      if (vacia) { x0 = x1 = px; y0 = y1 = py; vacia = false; } else { x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); } }); });
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}
const cajaDe = (id, m) => {   // caja de un elemento en coordenadas del mundo
  const g = gCont.querySelector(`[data-id="${id}"]`); if (!g) return null;
  const b = cajaDom(g); return [b.x - m, b.y - m, b.width + 2 * m, b.height + 2 * m];
};
function pinPunto(id, pinN) { const el = porId(id); if (!el) return null; const i = nombres(el).indexOf(pinN); return i >= 0 ? terminales(el)[i] : null; }
function pintarSobre() {
  const k = V[vista].k, uno = elSel(); let s = '';
  const marco = (c, extra) => (c ? `<rect x="${N(c[0])}" y="${N(c[1])}" width="${N(c[2])}" height="${N(c[3])}" fill="none" stroke="#111" pointer-events="none" ${extra}/>` : '');
  const anillo = (p) => (p ? `<circle cx="${p[0]}" cy="${p[1]}" r="${N(9.5 / Math.min(k, 1.4))}" fill="none" stroke="#111" stroke-width="${N(2.6 / k)}" pointer-events="none"/><circle cx="${p[0]}" cy="${p[1]}" r="${N(13.5 / Math.min(k, 1.4))}" fill="none" stroke="#111" stroke-width="${N(1 / k)}" pointer-events="none"/>` : '');
  if (resalte) {   // elementos que señala un aviso
    resalte.els.forEach((id) => { s += marco(cajaDe(id, 7 / k), `stroke-width="${N(3 / k)}"`); });
    if (resalte.pin) resalte.els.forEach((id) => { const el = porId(id); if (el && esMB(el)) s += anillo(pinPunto(id, resalte.pin)); });
  }
  sel.forEach((id) => { s += marco(cajaDe(id, 4 / k), `stroke-width="${N(1 / k)}" stroke-dasharray="${N(4 / k)} ${N(3 / k)}"`); });
  if (uno && def(uno).n === 2) for (const h of ['a', 'b']) s += `<rect data-h="${h}" x="${N(uno[h][0] - 5 / k)}" y="${N(uno[h][1] - 5 / k)}" width="${N(10 / k)}" height="${N(10 / k)}" fill="#fff" stroke="#111" stroke-width="${N(1.6 / k)}" style="cursor:move"/>`;
  if (pinSel && sel.has(pinSel.el)) s += anillo(pinPunto(pinSel.el, pinSel.pin));
  if (arr && arr.tipo === 'marco') { const x = Math.min(arr.p0[0], arr.p1[0]), y = Math.min(arr.p0[1], arr.p1[1]); s += marco([x, y, Math.abs(arr.p1[0] - arr.p0[0]), Math.abs(arr.p1[1] - arr.p0[1])], `stroke-width="${N(1 / k)}" stroke-dasharray="${N(3 / k)} ${N(3 / k)}"`).replace('fill="none"', 'fill="#000" fill-opacity=".05"'); }
  if (pend) {
    if (!igual(pend.a, pend.b)) s += `<g opacity=".5" pointer-events="none">${dibujar(Object.assign({ id: '_' }, pend.el, { a: pend.a, b: pend.b }), vista, true)}</g>`;
    s += `<circle cx="${pend.a[0]}" cy="${pend.a[1]}" r="${N(4 / k)}" fill="none" stroke="#111" stroke-width="${N(1.4 / k)}" pointer-events="none"/>`;
  }
  gSobre.innerHTML = s;
}
const aMundo = (e) => { const o = svg.getBoundingClientRect(), v = V[vista]; return [(e.clientX - o.left - v.x) / v.k, (e.clientY - o.top - v.y) / v.k]; };
// Ajuste: grilla en el esquemático; agujeros y bornes de los elementos sueltos en la protoboard
function ajustar(p, omitir) {
  if (vista === 'esq') return [Math.round(p[0] / G) * G, Math.round(p[1] / G) * G];
  let mejor = null, dm = 13;
  const probar = (q) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < dm) { dm = d; mejor = q; } };
  placa(colsP()).agujeros.forEach(probar);
  els().forEach((el) => { if (el.id !== omitir && def(el).n === 'libre') terminales(el).forEach(probar); });
  return mejor ? mejor.slice() : [Math.round(p[0] / 10) * 10, Math.round(p[1] / 10) * 10];
}
function anclar(el, p) {   // dónde queda un elemento de un clic: huellas fijas sobre los agujeros, sueltos cada 10 px, esquemático en la grilla
  const d = def(el);
  if (d.ancla) return d.ancla(p, el);
  return vista === 'esq' ? [Math.round(p[0] / G) * G, Math.round(p[1] / G) * G] : [Math.round(p[0] / 10) * 10, Math.round(p[1] / 10) * 10];
}
function encuadrar() {
  const o = svg.getBoundingClientRect(); if (!o.width) return;
  let b = cajaDom(gCont);
  if (!b.width && !b.height) b = { x: -260, y: -160, width: 520, height: 320 };
  if (vista === 'proto' && E.proto.els.length < 3) b = { x: b.x - 150, y: b.y - 60, width: b.width + 300, height: b.height + 230 };   // aire para los elementos sueltos
  const m = 40, k = Math.max(0.25, Math.min(vista === 'esq' ? 1.6 : 1.15, (o.width - 2 * m) / b.width, (o.height - 2 * m) / b.height));
  Object.assign(V[vista], { k, x: o.width / 2 - (b.x + b.width / 2) * k, y: o.height / 2 - (b.y + b.height / 2) * k });
  verVista(); pintarSobre();
}

/* ---------- Cambios, deshacer y guardado ---------- */
const datos = () => JSON.stringify({ titulo: E.titulo, resEstilo: E.resEstilo, estilo, esq: E.esq, proto: E.proto });
function marcar() { hist.push(datos()); if (hist.length > 80) hist.shift(); futuro.length = 0; botonesHist(); }
function botonesHist() { $('#h-deshacer').disabled = !hist.length; $('#h-rehacer').disabled = !futuro.length; }
let tGuardar = null, tAvisos = null;
function cambio() {
  pintar();
  clearTimeout(tGuardar); tGuardar = setTimeout(() => { try { localStorage.setItem(CLAVE, datos()); } catch (e) {} }, 400);
  clearTimeout(tAvisos); tAvisos = setTimeout(revisarAhora, 200);
}
function volver(de, a) {
  if (!de.length) return;
  a.push(datos()); E = limpiar(JSON.parse(de.pop()));
  sel = new Set([...sel].filter((id) => porId(id))); pinSel = null; pend = null; resalte = null;
  $('#n-circ').value = E.titulo; $('#s-res').value = E.resEstilo; $('#s-cols').value = String(colsP()); botonesHist(); cambio(); inspector();
}
// Valida un circuito abierto o recuperado. Los del formato anterior (solo «t») pasan al componente equivalente de la base.
function limpiar(o) {
  const e = vacio(); if (!o || typeof o !== 'object') return e;
  e.titulo = typeof o.titulo === 'string' ? o.titulo : ''; e.resEstilo = o.resEstilo === 'zigzag' ? 'zigzag' : 'iec';
  e.proto.cols = o.proto && +o.proto.cols === 60 ? 60 : 30;
  const par = (p) => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number' && isFinite(n));
  for (const v of ['esq', 'proto']) e[v].els = ((o[v] && o[v].els) || []).map((el) => {
    if (!el || !par(el.a)) return null;
    let c = COMP.get(el.c);
    if (!c || !c[v]) c = COMP.get(NAT[v][el.t]);   // formato anterior, o un id que ya no está en la base
    if (!c || !defDe(c, v) || (defDe(c, v).n === 2 && !par(el.b))) return null;
    const n = Object.assign({}, el, { id: el.id || uid(), c: c.id }); if (c[v].f === 'nativo') n.t = c[v].t; else delete n.t;
    return n;
  }).filter(Boolean);
  return e;
}
function cargar(o) {
  if (o && (o.estilo === 'linea' || o.estilo === 'real') && o.estilo !== estilo) ponerEstilo(o.estilo, true);   // el circuito trae su estilo (no cambia el preferido)
  E = limpiar(o); hist.length = 0; futuro.length = 0; sel = new Set(); pinSel = null; resalte = null;
  $('#n-circ').value = E.titulo; $('#s-res').value = E.resEstilo; $('#s-cols').value = String(colsP()); botonesHist();
  V.esq.listo = V.proto.listo = false; cambiarVista(vista); cambio();
}

/* ---------- Crear, mover, girar, borrar ---------- */
function rotuloNuevo(c) {
  const d = defDe(c, vista);
  if (vista !== 'esq' || !c.pref || c.id === 'cable' || (d.n !== 2 && !d.rotAt)) return '';
  const usados = new Set(els().map((e) => e.rotulo)); let n = 1; while (usados.has(c.pref + n)) n++; return c.pref + n;
}
function nuevo(cid) {
  const c = COMP.get(cid), fo = c[vista], el = { id: uid(), c: cid, rotulo: rotuloNuevo(c) };
  if (fo.f === 'nativo') el.t = fo.t;
  if (c.valor) el.valor = c.valor;
  if (el.t === 'resistencia') { el.ohm = leerOhm(c.valor || '') || 220; el.tol = 5; if (!el.valor) el.valor = textoOhm(el.ohm); }
  if (cid === 'cable') el.color = colorNuevo[vista];
  if (el.t === 'microbit' || el.t === 'mbpin') el.ver = versionDibujo();
  if (el.t === 'mbpin') el.pin = c.mb || 'P0';
  return el;
}
function agregar(el) { marcar(); els().push(el); return el; }
function conecta(p, propio) {   // ¿hay otro elemento que llegue a este punto?
  return els().some((el) => el.id !== propio && (terminales(el).some((q) => igual(p, q)) || (el.c === 'cable' && enCable(p, el))));
}
function terminar(b) {
  const p = pend; pend = null;
  if (igual(p.a, b)) { pintarSobre(); return; }
  const el = agregar(Object.assign(p.el, { a: p.a, b }));
  if (el.c === 'cable') {
    if (vista === 'esq' && !conecta(b, el.id)) pend = { el: nuevo('cable'), a: b.slice(), b: b.slice(), modo: 'clic' };   // se sigue trazando
  } else { sel = new Set([el.id]); herramienta('sel'); }
  cambio(); inspector();
}
// Cables (no elegidos) enganchados a los terminales de los elementos que se van a mover o girar: los acompañan
function pegadosDe(ids) {
  const out = [], mov = els().filter((e) => ids.has(e.id) && e.c !== 'cable').map((el) => ({ el, t: terminales(el).map((q) => q.slice()) }));
  els().forEach((c) => { if (c.c !== 'cable' || ids.has(c.id)) return; for (const k of ['a', 'b']) for (const m of mov) { const i = m.t.findIndex((q) => igual(q, c[k])); if (i >= 0) { out.push({ c, k, el: m.el, i }); break; } } });
  return out;
}
const seguir = (peg) => peg.forEach((g) => { const t = terminales(g.el)[g.i]; if (t) g.c[g.k] = t.slice(); });
function borrar() { if (!sel.size) return; marcar(); E[vista].els = els().filter((e) => !sel.has(e.id)); sel = new Set(); pinSel = null; cambio(); inspector(); }
function duplicar() {
  const lista = elegidos(); if (!lista.length) return;
  marcar(); const nuevos = new Set();
  lista.forEach((el) => {
    const d = def(el), paso = vista === 'proto' && d.n !== 'libre' ? [G, 0] : [G, G], c = JSON.parse(JSON.stringify(el));
    c.id = uid(); c.a = [c.a[0] + paso[0], c.a[1] + paso[1]]; if (c.b) c.b = [c.b[0] + paso[0], c.b[1] + paso[1]];
    if (d.ancla) c.a = d.ancla(c.a, c);
    if (c.rotulo && vista === 'esq') c.rotulo = rotuloNuevo(comp(c)) || c.rotulo;
    els().push(c); nuevos.add(c.id);
  });
  sel = nuevos; pinSel = null; cambio(); inspector();
}
const giraSolo = (el) => { const d = def(el); return !!d.rota || (esMB(el) && vista === 'proto') || (d.n === 2 && vista === 'esq' && el.c !== 'cable'); };
function rotar() {   // R: los de un clic giran sobre su ancla; los de dos patas del esquemático, un cuarto de vuelta sobre A
  const lista = elegidos().filter(giraSolo); if (!lista.length) return;
  marcar(); const peg = pegadosDe(new Set(lista.map((e) => e.id)));
  lista.forEach((el) => {
    const d = def(el);
    if (esMB(el) && vista === 'proto') el.arriba = !el.arriba;
    else if (d.rota) el.rot = ((el.rot || 0) + 1) % d.rota;
    else el.b = [el.a[0] - (el.b[1] - el.a[1]), el.a[1] + (el.b[0] - el.a[0])];
  });
  seguir(peg); cambio(); inspector();
}
function herramienta(h) {
  herr = h; pend = null;
  svg.classList.toggle('crear', h !== 'sel');
  $('#h-sel').classList.toggle('act', h === 'sel'); $('#h-cable').classList.toggle('act', h === 'cable');
  document.querySelectorAll('.comp').forEach((b) => b.classList.toggle('act', b.dataset.c === h));
  const c = COMP.get(h), d = c && defDe(c, vista);
  $('#pista').textContent = h === 'sel' ? 'Clic: elegir · arrastrar: mover · fondo o Mayús+clic: elegir varios · R: girar · Supr: borrar · rueda: zoom · botón derecho: desplazar'
    : d.n === 2 ? c.nombre + ': arrastrá (o hacé clic y clic) de un punto a otro.' + (h === 'cable' && vista === 'esq' ? ' Sigue trazando hasta Esc o doble clic.' : '') + ' Esc: cancelar.'
    : c.nombre + ': hacé clic donde va.' + (d.n === 'fijo' ? ' Se acomoda sola sobre los agujeros.' : '') + (d.rota ? ' Después, R la gira.' : '') + ' Esc: cancelar.';
  pintarSobre();
}
// Pin de una micro:bit que está bajo el puntero (su borne o su rótulo)
function pinCerca(el, p) {
  const d = def(el), t = terminales(el), z = d.zonas ? d.zonas(el) : [], nom = nombres(el); let m = 12, r = null;
  t.forEach((q, i) => { for (const u of [q, z[i]]) if (u) { const dd = Math.hypot(u[0] - p[0], u[1] - p[1]); if (dd < m) { m = dd; r = nom[i]; } } });
  return r;
}

/* ---------- Ratón ---------- */
const modalAbierto = () => $('#m-res').classList.contains('abierto');
svg.addEventListener('contextmenu', (e) => e.preventDefault());
svg.addEventListener('pointerdown', (e) => {
  if (modalAbierto()) return;
  svg.focus({ preventScroll: true }); $('#m-ej').hidden = true;
  const p = aMundo(e);
  if (e.button === 2 || e.button === 1 || espacio) { arr = { tipo: 'vista', x: e.clientX, y: e.clientY, vx: V[vista].x, vy: V[vista].y }; svg.classList.add('mano'); svg.setPointerCapture(e.pointerId); return; }
  if (e.button !== 0) return;
  svg.setPointerCapture(e.pointerId);
  if (herr !== 'sel') {
    const d = defDe(COMP.get(herr), vista);
    if (d.n !== 2) {   // un clic: símbolos de una o tres patas, bloques, huellas fijas y elementos sueltos
      const el = nuevo(herr); el.a = anclar(el, p); agregar(el);
      sel = new Set([el.id]); pinSel = null; herramienta('sel'); cambio(); inspector();
      if (nat(el) === 'texto') { const i = $('#i-valor'); if (i) { i.focus(); i.select(); } }
      return;
    }
    if (pend && pend.modo === 'clic') { terminar(ajustar(p)); return; }
    const a = ajustar(p); pend = { el: nuevo(herr), a, b: a.slice(), modo: 'arrastre', x: e.clientX, y: e.clientY };
    pintarSobre(); return;
  }
  const h = e.target.closest && e.target.closest('[data-h]'), g = e.target.closest && e.target.closest('[data-id]');
  if (h && elSel()) { arr = { tipo: 'extremo', h: h.dataset.h, movido: false }; return; }
  const placaPin = !g && els().find((x) => esMB(x) && pinCerca(x, p)), id = g ? g.dataset.id : placaPin ? placaPin.id : null;
  if (id) {
    if (e.shiftKey) { if (sel.has(id)) sel.delete(id); else sel.add(id); pinSel = null; pintarSobre(); inspector(); return; }
    const yaElegido = sel.size === 1 && sel.has(id);
    if (!sel.has(id)) { sel = new Set([id]); pinSel = null; }
    const el = porId(id);
    if (esMB(el) && sel.size === 1) { const pn = pinCerca(el, p); if (pn) pinSel = { el: id, pin: pn }; }
    arr = { tipo: 'mover', p0: p, orig: elegidos().map((x) => ({ el: x, a: x.a.slice(), b: x.b ? x.b.slice() : null })), pegados: pegadosDe(sel), movido: false, yaElegido };
    pintarSobre(); inspector(); return;
  }
  if (!e.shiftKey) { sel = new Set(); pinSel = null; }
  if (resFijo) { resFijo = null; resalte = resHover; pintarAvisos(); }
  arr = { tipo: 'marco', p0: p, p1: p, x: e.clientX, y: e.clientY };
  pintarSobre(); inspector();
});
svg.addEventListener('pointermove', (e) => {
  const p = aMundo(e);
  if (pend) { pend.b = ajustar(p); pintarSobre(); return; }
  if (!arr) return;
  if (arr.tipo === 'vista') { V[vista].x = arr.vx + e.clientX - arr.x; V[vista].y = arr.vy + e.clientY - arr.y; verVista(); return; }
  if (arr.tipo === 'marco') { arr.p1 = p; pintarSobre(); return; }
  if (arr.tipo === 'extremo') {
    const el = elSel(); if (!el) return;
    const q = ajustar(p, el.id); if (igual(q, el[arr.h])) return;
    if (!arr.movido) { marcar(); arr.movido = true; }
    el[arr.h] = q; pintar(); return;
  }
  const d0 = [p[0] - arr.p0[0], p[1] - arr.p0[1]]; let dx, dy;
  if (arr.orig.length === 1) {
    const o = arr.orig[0], q = def(o.el).n === 2 ? ajustar([o.a[0] + d0[0], o.a[1] + d0[1]], o.el.id) : anclar(o.el, [o.a[0] + d0[0], o.a[1] + d0[1]]);
    dx = q[0] - o.a[0]; dy = q[1] - o.a[1];
  } else { const paso = vista === 'esq' || arr.orig.some((o) => def(o.el).n !== 'libre') ? G : 10; dx = Math.round(d0[0] / paso) * paso; dy = Math.round(d0[1] / paso) * paso; }
  if (!arr.movido && !dx && !dy) return;
  if (!arr.movido) { marcar(); arr.movido = true; }
  arr.orig.forEach((o) => { o.el.a = [o.a[0] + dx, o.a[1] + dy]; if (o.b) o.el.b = [o.b[0] + dx, o.b[1] + dy]; else if (arr.orig.length > 1 && def(o.el).ancla) o.el.a = anclar(o.el, o.el.a); });
  seguir(arr.pegados); pintar();
});
svg.addEventListener('pointerup', (e) => {
  svg.classList.remove('mano');
  if (pend && pend.modo === 'arrastre') {
    if (Math.hypot(e.clientX - pend.x, e.clientY - pend.y) > 6) terminar(ajustar(aMundo(e))); else pend.modo = 'clic';
    return;
  }
  const a = arr; arr = null; if (!a) return;
  if (a.tipo === 'marco') {   // elegir lo que toca el rectángulo
    if (Math.hypot(e.clientX - a.x, e.clientY - a.y) > 5) {
      const x0 = Math.min(a.x, e.clientX), x1 = Math.max(a.x, e.clientX), y0 = Math.min(a.y, e.clientY), y1 = Math.max(a.y, e.clientY);
      gCont.querySelectorAll('[data-id]').forEach((g) => { const r = g.getBoundingClientRect(); if (r.right >= x0 && r.left <= x1 && r.bottom >= y0 && r.top <= y1) sel.add(g.dataset.id); });
    }
    pintarSobre(); inspector(); return;
  }
  if (a.movido) { cambio(); inspector(); }
  else if (a.tipo === 'mover' && a.yaElegido) { const el = elSel(); if (el && nat(el) === 'resistencia' && !pinSel) abrirRes(); }   // clic sobre una resistencia ya elegida
});
svg.addEventListener('dblclick', (e) => {
  if (pend) { pend = null; pintarSobre(); return; }
  const bajo = document.elementFromPoint(e.clientX, e.clientY), g = bajo && bajo.closest && bajo.closest('#g-contenido [data-id]'); if (!g) return;
  sel = new Set([g.dataset.id]); const el = elSel(); pintarSobre(); inspector();
  if (nat(el) === 'resistencia') abrirRes(); else { const i = $('#i-valor') || $('#i-rotulo'); if (i) { i.focus(); i.select(); } }
});
svg.addEventListener('wheel', (e) => {
  e.preventDefault();
  const o = svg.getBoundingClientRect(), v = V[vista], mx = e.clientX - o.left, my = e.clientY - o.top, k = Math.max(0.25, Math.min(5, v.k * Math.exp(-e.deltaY * 0.0015)));
  v.x = mx - (mx - v.x) * k / v.k; v.y = my - (my - v.y) * k / v.k; v.k = k; verVista(); pintarSobre();
}, { passive: false });

/* ---------- Teclado ---------- */
const enCampo = () => { const a = document.activeElement || {}; return /TEXTAREA|SELECT/.test(a.tagName || '') || (a.tagName === 'INPUT' && !/checkbox|radio|button|file/.test(a.type)); };   // ¿se está escribiendo en un campo?
window.addEventListener('keydown', (e) => {
  if (modalAbierto()) { if (e.key === 'Escape') cerrarRes(false); if (e.key === 'Enter') cerrarRes(true); return; }
  const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if ((ctrl && k === 'k') || (e.key === '/' && !enCampo())) { e.preventDefault(); $('#q').focus(); $('#q').select(); return; }
  if (ctrl && k === 'z' && !enCampo()) { e.preventDefault(); if (e.shiftKey) volver(futuro, hist); else volver(hist, futuro); return; }
  if (ctrl && k === 'y' && !enCampo()) { e.preventDefault(); volver(futuro, hist); return; }
  if (e.key === 'Escape') {
    if (document.activeElement === $('#q')) { if ($('#q').value) { $('#q').value = ''; q = ''; catalogo(); } else $('#q').blur(); return; }
    if (enCampo()) document.activeElement.blur();
    $('#m-ej').hidden = true;
    if (pend) { pend = null; pintarSobre(); }
    else if (herr !== 'sel') { herramienta('sel'); inspector(); }
    else if (sel.size || pinSel || resFijo) { sel = new Set(); pinSel = null; resFijo = null; resalte = resHover; pintarAvisos(); pintarSobre(); inspector(); }   // Esc de nuevo: suelta lo elegido
    return;
  }
  if (enCampo()) return;
  if (ctrl && k === 'd') { e.preventDefault(); duplicar(); return; }
  if (ctrl && k === 'a') { e.preventDefault(); sel = new Set(els().map((x) => x.id)); pinSel = null; pintarSobre(); inspector(); return; }
  if (e.key === ' ') { espacio = true; e.preventDefault(); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); borrar(); return; }
  if (ctrl) return;
  if (k === 'c') { herramienta('cable'); return; }
  if (k === 'r') { rotar(); return; }
  const fl = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] }[k], lista = elegidos();
  if (fl && lista.length) {
    e.preventDefault(); marcar(); const peg = pegadosDe(sel);
    const paso = vista === 'esq' || lista.some((x) => def(x).n !== 'libre') ? G : 10;
    lista.forEach((el) => { el.a = [el.a[0] + fl[0] * paso, el.a[1] + fl[1] * paso]; if (el.b) el.b = [el.b[0] + fl[0] * paso, el.b[1] + fl[1] * paso]; else if (def(el).ancla) el.a = anclar(el, el.a); });
    seguir(peg); cambio(); inspector();
  }
});
window.addEventListener('keyup', (e) => { if (e.key === ' ') espacio = false; });

/* ---------- Catálogo con buscador ---------- */
let q = '', soloTk = false, soloMk = false, resFijo = null, resHover = null;
const CLAVE_CATS = 'fisicabit_circuito_cats';
const abiertasMk = new Set();   // con el filtro de MakeCode las categorías se muestran abiertas
let abiertas; try { abiertas = new Set(JSON.parse(localStorage.getItem(CLAVE_CATS) || 'null') || [CATEGORIAS[0].id]); } catch (e) { abiertas = new Set([CATEGORIAS[0].id]); }
function icono(c) {   // miniatura dibujada con la misma función que el lienzo
  const fo = c[vista], rl = vista === 'proto' ? realDe(c) : null, el = { id: '_', c: c.id, a: [0, 0], b: [(rl && rl.icoL) || 64, 0], ohm: leerOhm(c.valor || '') || 220, tol: 5, color: colorNuevo[vista], ver: 'v2' };
  if (fo.f === 'nativo') { el.t = fo.t; if (fo.t === 'texto') el.valor = 'Abc'; }
  return `<svg xmlns="${NS}" data-ico="1"><g>${dibujar(el, vista, true)}</g></svg>`;
}
const itemCat = (c) => { const otra = !enVista(c, vista);
  return `<button class="comp${otra ? ' otra' : ''}${herr === c.id ? ' act' : ''}" data-c="${esc(c.id)}">${otra ? '<svg></svg>' : icono(c)}<span>${esc(c.nombre)}${otra ? `<small>solo en ${vista === 'esq' ? 'la protoboard' : 'el esquemático'}</small>` : c.parte && parte(c.parte) ? '<small class="mk">con bloques en MakeCode</small>' : ''}</span></button>`; };
function catalogo() {
  const box = $('#catalogo'), vale = (c) => c.id !== 'cable' && (c.esq || c.proto) && (!soloTk || c.tk) && (!soloMk || (c.parte && parte(c.parte))); let h = '';
  if (q.trim()) {
    const r = buscar(q, vista).filter(vale);
    h = r.length ? `<div class="cat-res">${r.length} resultado${r.length === 1 ? '' : 's'}</div><div class="cat-l">${r.map(itemCat).join('')}</div>`
      : `<div class="cat-vacio">No hay componentes con «${esc(q.trim())}».<br>Probá con otra palabra: el nombre, para qué sirve o el código (por ejemplo «temperatura», «distancia», «555»).</div>`;
  } else {
    if (soloMk) CATEGORIAS.forEach((k) => abiertasMk.add(k.id));
    const cats = CATEGORIAS.concat(LISTA.some((c) => !CATEGORIAS.some((k) => k.id === c.cat)) ? [{ id: '', nombre: 'Otros' }] : []);
    cats.forEach((k) => {
      const l = LISTA.filter((c) => (k.id ? c.cat === k.id : !CATEGORIAS.some((x) => x.id === c.cat)) && enVista(c, vista) && vale(c)); if (!l.length) return;
      const ab = soloMk ? abiertasMk.has(k.id) : abiertas.has(k.id);
      h += `<button class="cat-g${ab ? ' abierta' : ''}" data-g="${esc(k.id)}"><i>${ab ? '▾' : '▸'}</i><b>${esc(k.nombre)}</b><span>${l.length}</span></button>` + (ab ? `<div class="cat-l">${l.map(itemCat).join('')}</div>` : '');
    });
  }
  box.innerHTML = h; box.classList.toggle('mosaico', vista === 'proto');   // en la protoboard, mosaico de dos columnas con la miniatura grande
  box.querySelectorAll('svg[data-ico]').forEach((s) => {   // encuadre de cada miniatura
    const b = cajaDom(s.firstChild), m = 3, w = Math.max(b.width, vista === 'proto' ? 30 : 44), hh = Math.max(b.height, 24);
    s.setAttribute('viewBox', `${N(b.x + b.width / 2 - w / 2 - m)} ${N(b.y + b.height / 2 - hh / 2 - m)} ${N(w + 2 * m)} ${N(hh + 2 * m)}`);
  });
  $('#cat-total').textContent = LISTA.filter((c) => enVista(c, vista) && vale(c)).length + ' en esta vista';
}
$('#catalogo').addEventListener('click', (e) => {
  const g = e.target.closest('.cat-g'), b = e.target.closest('.comp');
  if (g) { const id = g.dataset.g, ab = soloMk ? abiertasMk : abiertas; if (ab.has(id)) ab.delete(id); else ab.add(id); try { localStorage.setItem(CLAVE_CATS, JSON.stringify([...abiertas])); } catch (er) {} catalogo(); return; }
  if (!b) return;
  const c = COMP.get(b.dataset.c);
  if (!enVista(c, vista)) cambiarVista(vista === 'esq' ? 'proto' : 'esq');   // está solo en la otra vista: se pasa a ella
  compMirado = null; herramienta(herr === c.id ? 'sel' : c.id); inspector();
});
$('#catalogo').addEventListener('mouseover', (e) => { const b = e.target.closest('.comp'), id = b ? b.dataset.c : null; if (id !== compMirado) { compMirado = id; inspector(); } });
$('#catalogo').addEventListener('mouseleave', () => { if (compMirado) { compMirado = null; inspector(); } });
$('#q').oninput = (e) => { q = e.target.value; catalogo(); };
$('#solo-tk').onchange = (e) => { soloTk = e.target.checked; catalogo(); };
$('#solo-mk').onchange = (e) => { soloMk = e.target.checked; abiertasMk.clear(); catalogo(); };

/* ---------- Ficha del componente ---------- */
const coma = (n) => String(n).replace('.', ',');
const ROLES = { gnd: 'masa (GND)', aout: 'salida analógica', dout: 'salida digital', din: 'entrada digital', pwm: 'entrada de control (PWM)', io: 'datos, ida y vuelta', sda: 'I2C · datos (SDA)', scl: 'I2C · reloj (SCL)', sck: 'SPI · reloj (SCK)', miso: 'SPI · MISO', mosi: 'SPI · MOSI', cs: 'SPI · selección (CS)', 'fuente-': 'negativo', pas: '—' };
function rolTxt(p) {
  if (p.rol === 'vcc') return 'alimentación' + (p.v ? ' · ' + coma(p.v[0]) + (p.v[1] !== p.v[0] ? '–' + coma(p.v[1]) : '') + ' V' : '') + (p.i ? ' · ' + p.i + ' mA' : '');
  if (p.rol === 'carga') return 'potencia' + (p.i ? ' · ' + p.i + ' mA' : '');
  if (p.rol === 'led') return 'LED' + (p.vf ? ' · ≈ ' + coma(p.vf) + ' V' : '') + (p.i ? ' · ' + p.i + ' mA' : '');
  if (p.rol === 'fuente+') return 'positivo' + (p.v ? ' · ' + coma(p.v) + ' V' : '');
  return ROLES[p.rol] || p.rol || '—';
}
function fichaHTML(c, conNombre) {
  const v = versionDibujo(), enDibujo = !!refMB(); let h = '<div class="ficha">';
  if (conNombre) h += `<p class="tipo">${esc(c.nombre)}</p>`;
  if (c.desc) h += `<p>${esc(c.desc)}</p>`;
  if (c.fisica) h += `<div class="fis"><b>En física</b><br>${esc(c.fisica)}</div>`;
  if ((c.datos || []).length) h += `<div class="sub">Datos</div><table>${c.datos.map(([k, x]) => `<tr><td>${esc(k)}</td><td>${esc(x)}</td></tr>`).join('')}</table>`;
  if (c.id !== 'microbit' && c.pines.some((p) => p.rol && p.rol !== 'pas')) h += `<div class="sub">Patas</div><table>${c.pines.map((p) => `<tr><td class="pn">${esc(p.n)}</td><td>${esc(rolTxt(p))}</td></tr>`).join('')}</table>`;
  if (/^https?:\/\//.test(c.hoja || '')) h += `<a class="btn hoja" href="${esc(c.hoja)}" target="_blank" rel="noopener">Hoja de datos ↗</a>`;
  const pt = c.parte ? parte(c.parte) : null;
  if (pt) {   // sensor de la extensión FisicaBit de MakeCode: la conexión y los bloques, tal como están en la extensión
    h += `<div class="sub"><span>En MakeCode + FisicaBit</span></div><p class="mk-n">Es el mismo sensor que dibuja el simulador de MakeCode cuando se usan sus bloques. Así lo conecta:</p>` +
      `<table>${pt.pines.map((q) => `<tr><td class="pn">${esc(q.n)}</td><td>→ <b>${esc(q.destino || 'sin conectar')}</b>${q.param ? '<br><span style="color:#555">el pin se elige en el bloque</span>' : ''}</td></tr>`).join('')}</table>`;
    if (pt.bloques.length) h += `<div class="sub">Bloques que lo usan</div><ul class="blq">${pt.bloques.map((b) => `<li>${esc(b.texto)}</li>`).join('')}</ul>`;
    h += `<div class="grupo-btn"><button class="btn chico" data-armar="${esc(pt.id)}" title="Arma el circuito con la micro:bit y este sensor conectado como en MakeCode">Armar esta conexión</button>` +
      (pt.programa ? `<a class="btn chico" target="_blank" rel="noopener" href="${esc(enlaceMakeCode('../', pt.titulo + ' · FisicaBit', pt.programa))}" title="Abre el editor de MakeCode del sitio con un programa que lee este sensor y lo envía a fisicabit.com">Programarlo en MakeCode ↗</a>` : '') + '</div>';
  }
  if (c.id !== 'microbit') {
    const r = recomendar(c.id, v); if (pt) r.pines = [];   // la conexión ya está arriba
    if (r.pines.length || r.avisos.length) {
      h += `<div class="sub"><span>En la micro:bit</span>${enDibujo ? `<span>${v.toUpperCase()} (la del dibujo)</span>` : `<span class="vers">${VERSIONES.map((x) => `<button class="btn chico${x.id === v ? ' act' : ''}" data-ver="${x.id}">${x.id.toUpperCase()}</button>`).join('')}</span>`}</div>`;
      if (r.pines.length) h += `<table>${r.pines.map((p) => `<tr><td class="pn">${esc(p.pin)}</td><td>→ <b>${esc(p.a)}</b>${p.nota ? `<br><span style="color:#555">${esc(p.nota)}</span>` : ''}</td></tr>`).join('')}</table>`;
      if (r.avisos.length) h += `<ul>${r.avisos.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
    }
  }
  h += '</div>';
  if (c.mb && conNombre) h += pinHTML(c.mb, v);   // en el catálogo: para qué sirve ese pin
  return h;
}
function pinHTML(pinN, ver) {   // para qué sirve un pin de la micro:bit según la versión
  const i = infoPin(pinN, ver), ul = (cls, l) => (l && l.length ? `<ul class="${cls}">${l.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '');
  return `<div class="ficha" id="pin-ficha"><p class="pin-t">${esc(i.titulo)}</p><p class="pin-r">${esc(i.resumen)} · micro:bit ${ver.toUpperCase()}</p>` +
    (i.sirve.length ? '<div class="sub">Sirve para</div>' + ul('si', i.sirve) : '') + (i.noSirve.length ? '<div class="sub">No sirve para</div>' + ul('no', i.noSirve) : '') + (i.notas.length ? '<div class="sub">A tener en cuenta</div>' + ul('nt', i.notas) : '') + '</div>';
}

/* ---------- Inspector ---------- */
const TONO_CSS = { rojo: '#e03131', verde: '#2f9e44', amarillo: '#f5c518', azul: '#2f6fde', blanco: '#ffffff', negro: '#2b2b2b' };
function inspector() {
  const box = $('#insp'), lista = elegidos(), el = lista.length === 1 ? lista[0] : null;
  const enlazarVers = () => box.querySelectorAll('[data-ver]').forEach((b) => { b.onclick = () => { verFicha = b.dataset.ver; inspector(); }; });
  if (compMirado && COMP.get(compMirado)) { box.innerHTML = '<div class="tit">Componente</div>' + fichaHTML(COMP.get(compMirado), true); enlazarVers(); return; }
  if (lista.length > 1) {
    box.innerHTML = `<div class="tit">Varios elementos</div><p class="tipo">${lista.length} elegidos</p><p class="nota">Arrastrá para moverlos juntos; los cables enganchados los acompañan.</p>
      <div class="grupo-btn"><button class="btn chico" id="i-rotar">Girar</button><button class="btn chico" id="i-dup">Duplicar</button><button class="btn chico" id="i-borrar">Eliminar</button></div>`;
    $('#i-rotar').onclick = rotar; $('#i-dup').onclick = duplicar; $('#i-borrar').onclick = borrar; return;
  }
  if (!el) {
    const c = herr !== 'sel' && herr !== 'cable' ? COMP.get(herr) : null;
    if (c) { box.innerHTML = '<div class="tit">Para colocar</div>' + fichaHTML(c, true); enlazarVers(); return; }
    box.innerHTML = `<div class="tit">${vista === 'esq' ? 'Esquemático' : 'Protoboard'}</div>
      <p class="nota">Buscá un componente a la izquierda (tecla <b>/</b>) y ${vista === 'esq' ? '<b>arrastrá de un punto a otro</b>; los bloques y los símbolos de tres patas van con un clic.' : '<b>arrastrá de un agujero a otro</b>; los integrados, módulos y elementos sueltos van con un clic.'}</p>
      <p class="nota">Al pasar por el catálogo se ve la <b>ficha</b> de cada componente: datos, patas, hoja de datos y cómo conectarlo a la micro:bit.</p>
      <p class="nota">Hacé <b>doble clic en una resistencia</b> para darle el valor: las bandas de color salen solas.</p>
      <p class="nota">Con una <b>micro:bit</b> en el dibujo, tocá uno de sus pines para ver para qué sirve, y mirá los <b>Avisos</b>: marcan lo que no va a funcionar.</p>`;
    return;
  }
  const c = comp(el), d = def(el), propio = nat(el), esRes = propio === 'resistencia', mb = esMB(el);
  const conRotulo = propio !== 'texto' && (d.n === 2 || !!d.rotAt), conValor = propio === 'texto' || (el.c !== 'cable' && (vista === 'esq' ? d.n === 2 || d.rota === 4 : esRes || /Ω/.test(c.valor || '')));
  let h = `<div class="tit">Elemento elegido</div><p class="tipo">${esc(c.nombre)}</p>`;
  if (conRotulo) h += `<label class="c">Rótulo</label><input type="text" id="i-rotulo" value="${esc(el.rotulo || '')}" placeholder="${vista === 'esq' ? 'R1, LED1…' : 'opcional'}">`;
  if (conValor) h += `<label class="c">${propio === 'texto' ? 'Texto' : 'Valor'}</label><input type="text" id="i-valor" value="${esc(el.valor || '')}" placeholder="con su unidad">`;
  if (esRes) h += `<svg id="i-res" viewBox="0 0 300 92" xmlns="${NS}" style="display:block;width:100%;height:64px;margin-top:8px">${resGrande(el.ohm || 0, el.tol || 5)}</svg><button class="btn ancho" id="i-codigo" style="margin-top:4px">Código de colores…</button>`;
  if (el.c === 'cable') h += `<label class="c">Color del cable</label><div class="colores">${Object.keys(CABLES).map((k) => `<button class="col${(el.color || 'negro') === k ? ' sel' : ''}" data-c="${k}" title="${k}" style="background:${CABLES[k]}"></button>`).join('')}</div>`;
  const tonos = vista === 'proto' ? tonosDe(el.c) : null;
  if (tonos) h += `<label class="c">${propio === 'led' ? 'Color del LED' : 'Color'}</label><div class="colores">${tonos.map((k) => `<button class="col tono${(el.tono || tonos[0]) === k ? ' sel' : ''}" data-t="${k}" title="${k}" style="background:${TONO_CSS[k]}"></button>`).join('')}</div>${real() ? '' : '<p class="nota" style="margin-top:4px">El color se ve en el estilo Realista.</p>'}`;
  if (propio === 'interruptor') h += `<label class="chk"><input type="checkbox" id="i-cerrado"${el.cerrado ? ' checked' : ''}> Cerrado (deja pasar la corriente)</label>`;
  if (mb) {
    const ver = el.ver || 'v2', pn = nombres(el);
    h += `<label class="c">Versión</label><select id="i-ver">${VERSIONES.map((x) => `<option value="${x.id}"${x.id === ver ? ' selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select>
      <label class="c">Conexión</label><select id="i-ext"><option value="">Simple (5 anillos)</option><option value="1"${el.ext ? ' selected' : ''}>Con extensor (todos los pines)</option></select>`;
    if (vista === 'proto') h += `<label class="chk"><input type="checkbox" id="i-arriba"${el.arriba ? ' checked' : ''}> Conector hacia arriba</label>`;
    h += `<label class="c">Pines · tocá uno para ver para qué sirve</label><div class="chips">${pn.map((p) => `<button class="chip${caps(p, ver).potencia ? ' pot' : ''}${pinSel && pinSel.el === el.id && pinSel.pin === p ? ' sel' : ''}" data-pin="${p}">${p}</button>`).join('')}</div>`;
    if (el.ext && vista === 'proto') h += `<p class="nota" style="margin-top:6px">En el extensor: ■ comparte la pantalla · ○ comparte un botón · ◆ bus I2C.</p>`;
    h += pinSel && pinSel.el === el.id ? pinHTML(pinSel.pin, ver) : '';
  }
  const puerto = esPuerto(el);
  if (puerto) {
    const placa = primeraMB(), ver = versionDibujo(), pn = pinDe(el), orden = ['3V', 'GND'].concat(EXTENSOR.filter((p) => !potencia(p)).sort((a, b) => +a.slice(1) - +b.slice(1)));
    h += `<label class="c">Pin</label><select id="i-pin">${orden.map((p) => `<option value="${p}"${p === pn ? ' selected' : ''}>${p}${potencia(p) || ANILLOS.includes(p) ? '' : ' (con extensor)'}</option>`).join('')}</select>`;
    h += placa ? `<p class="nota" style="margin-top:6px">Es el mismo punto que el pin ${esc(pn)} de la micro:bit del dibujo.</p>`
      : `<label class="c">Versión de la micro:bit</label><select id="i-pver">${VERSIONES.map((x) => `<option value="${x.id}"${x.id === ver ? ' selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select>`;
    h += `<p class="nota" style="margin-top:6px">Los pines sueltos con el mismo nombre son un mismo punto, aunque no haya un cable entre ellos.</p>` + pinHTML(pn, ver);
  }
  h += `<div class="grupo-btn">${d.n === 2 && el.c !== 'cable' ? `<button class="btn chico" id="i-invertir" title="Intercambia los dos extremos (cambia la polaridad)">Invertir</button>` : ''}${giraSolo(el) ? '<button class="btn chico" id="i-rotar" title="Girar (R)">Girar</button>' : ''}<button class="btn chico" id="i-dup">Duplicar</button><button class="btn chico" id="i-borrar">Eliminar</button></div>`;
  if (el.c !== 'cable' && propio !== 'texto') h += fichaHTML(c, false);
  box.innerHTML = h; enlazarVers();
  const campo = (id, k) => { const i = $(id); if (!i) return; let marcado = false; i.oninput = () => { if (!marcado) { marcar(); marcado = true; } el[k] = i.value; if (k === 'valor' && esRes) { const v = leerOhm(i.value); if (v > 0) el.ohm = v; } cambio(); if (esRes && $('#i-res')) $('#i-res').innerHTML = resGrande(el.ohm || 0, el.tol || 5); }; };
  campo('#i-rotulo', 'rotulo'); campo('#i-valor', 'valor');
  box.querySelectorAll('.col:not(.tono)').forEach((b) => { b.onclick = () => { marcar(); el.color = b.dataset.c; colorNuevo[vista] = el.color; cambio(); inspector(); }; });
  box.querySelectorAll('.tono').forEach((b) => { b.onclick = () => { marcar(); el.tono = b.dataset.t; cambio(); inspector(); }; });
  if ($('#i-cerrado')) $('#i-cerrado').onchange = (e) => { marcar(); el.cerrado = e.target.checked; cambio(); };
  if (mb) {
    // al cambiar la placa, los cables enganchados siguen al pin con el mismo nombre
    const conCables = (fn) => { marcar(); const antes = terminales(el).map((p) => p.slice()), na = nombres(el), peg = [];
      els().forEach((k) => { if (k.c === 'cable') for (const e of ['a', 'b']) { const i = antes.findIndex((p) => igual(p, k[e])); if (i >= 0) peg.push({ k, e, n: na[i] }); } });
      fn(); const nd = nombres(el), td = terminales(el);
      peg.forEach((g) => { const i = nd.indexOf(g.n); if (i >= 0) g.k[g.e] = td[i].slice(); });
      if (pinSel && !nd.includes(pinSel.pin)) pinSel = null;
      cambio(); inspector(); };
    $('#i-ver').onchange = (e) => conCables(() => { el.ver = e.target.value; });
    $('#i-ext').onchange = (e) => conCables(() => { el.ext = !!e.target.value; });
    if ($('#i-arriba')) $('#i-arriba').onchange = (e) => conCables(() => { el.arriba = e.target.checked; });
    box.querySelectorAll('.chip').forEach((b) => { b.onclick = () => { pinSel = pinSel && pinSel.pin === b.dataset.pin && pinSel.el === el.id ? null : { el: el.id, pin: b.dataset.pin }; pintarSobre(); inspector(); }; });
  }
  if (puerto) {
    // el componente acompaña al pin elegido, así el nombre del elemento siempre dice qué es
    $('#i-pin').onchange = (e) => { marcar(); el.pin = e.target.value; el.c = el.pin === '3V' ? 'mb-3v' : el.pin === 'GND' ? 'mb-gnd' : 'mb-pin'; cambio(); inspector(); };
    if ($('#i-pver')) $('#i-pver').onchange = (e) => { marcar(); for (const v of ['esq', 'proto']) E[v].els.forEach((x) => { if (deMB(x, v)) x.ver = e.target.value; }); cambio(); inspector(); };
  }
  if ($('#i-invertir')) $('#i-invertir').onclick = () => { marcar(); [el.a, el.b] = [el.b, el.a]; cambio(); };
  if ($('#i-rotar')) $('#i-rotar').onclick = rotar;
  if ($('#i-codigo')) $('#i-codigo').onclick = abrirRes;
  $('#i-dup').onclick = duplicar; $('#i-borrar').onclick = borrar;
}

/* ---------- Avisos de compatibilidad con la micro:bit ---------- */
function revisarAhora() {
  pintarVinculo();
  const mb = refMB(), antes = avisos.length;
  try { avisos = mb ? revisar(redes(), mb.ver || 'v2') : []; } catch (e) { avisos = []; console.error(e); }
  if (resFijo) resFijo = avisos.find((a) => a.titulo === resFijo.titulo && a.texto === resFijo.texto) || null;
  resHover = null; resalte = resFijo;
  const b = $('#h-avisos'); b.hidden = !mb; b.textContent = 'Avisos ' + avisos.length; b.classList.toggle('act', avisos.some((a) => a.nivel === 'error'));
  if (!mb) avisosAbierto = false; else if (avisos.length > antes) avisosAbierto = true;
  pintarAvisos(); pintarSobre();
}
function pintarAvisos() {
  const box = $('#avisos'), mb = refMB(); box.hidden = !avisosAbierto || !mb; if (box.hidden) return;
  const ICO = { error: '✕', aviso: '▲', info: '●' };
  box.innerHTML = `<div class="av-cab"><span>Avisos · micro:bit ${(mb.ver || 'v2').toUpperCase()}</span><button class="btn chico" id="av-cerrar">Cerrar</button></div>` +
    (avisos.length ? avisos.map((a, i) => `<div class="av ${a.nivel}${resFijo === a ? ' fijo' : ''}" data-i="${i}"><i>${ICO[a.nivel] || '●'}</i><b>${esc(a.titulo)}</b><span>${esc(a.texto)}</span></div>`).join('')
      : '<div class="av-ok">✓ No se encontraron problemas de compatibilidad con la micro:bit.</div>');
  $('#av-cerrar').onclick = () => { avisosAbierto = false; resFijo = resHover = resalte = null; pintarAvisos(); pintarSobre(); };
  box.querySelectorAll('.av').forEach((n) => {
    const a = avisos[+n.dataset.i];
    n.onmouseenter = () => { resHover = a; resalte = a; pintarSobre(); };
    n.onmouseleave = () => { resHover = null; resalte = resFijo; pintarSobre(); };
    n.onclick = () => { resFijo = resFijo === a ? null : a; resalte = resHover || resFijo; sel = new Set(resFijo ? a.els.filter((id) => porId(id)) : []); const m = resFijo && a.pin && a.els.map((id) => porId(id)).find((x) => x && esMB(x)); pinSel = m ? { el: m.id, pin: a.pin } : null; pintarAvisos(); pintarSobre(); inspector(); };
  });
}
$('#h-avisos').onclick = () => { avisosAbierto = !avisosAbierto; pintarAvisos(); };

/* ---------- Cuadro del código de colores ---------- */
let R = null;   // { ohm, tol }
function resGrande(ohm, tol) {
  const b = bandas(ohm), cols = [BANDA[b.d1][1], BANDA[b.d2][1], colorMult(b.m)[1], colorTol(tol)[1]];
  return `<path d="M8,46 H292" stroke="#111" stroke-width="3" stroke-linecap="round"/><rect x="62" y="18" width="176" height="56" rx="24" fill="#fff" stroke="#111" stroke-width="2.5"/>` +
    [88, 116, 144, 196].map((x, i) => `<rect x="${x}" y="19.5" width="17" height="53" fill="${cols[i]}" stroke="#111" stroke-width="1"/>`).join('');
}
function pintarRes(deCampo) {
  const b = bandas(R.ohm);
  $('#r-vista').innerHTML = resGrande(R.ohm, R.tol);
  $('#r-texto').textContent = textoOhm(R.ohm) + ' ± ' + R.tol + ' %';
  if (!deCampo) $('#r-valor').value = textoOhm(R.ohm).replace(' Ω', '').replace(' ', '');
  const fila = (id, lista, elegido, alElegir) => {
    $(id).innerHTML = lista.map((c, i) => `<button class="col${i === elegido ? ' sel' : ''}" data-i="${i}" title="${esc(c[2] || c[0])}" style="background:${c[1]}"></button>`).join('');
    $(id).querySelectorAll('.col').forEach((bt) => { bt.onclick = () => { alElegir(+bt.dataset.i); pintarRes(false); }; });
  };
  const digitos = BANDA.map((c, i) => [c[0], c[1], c[0] + ' · ' + i]);
  fila('#r-b1', digitos, b.d1, (i) => { R.ohm = valorDeBandas(i, b.d2, b.m); });
  fila('#r-b2', digitos, b.d2, (i) => { R.ohm = valorDeBandas(b.d1, i, b.m); });
  const mults = BANDA.map((c, i) => [c[0], c[1], c[0] + ' · ×' + textoOhm(Math.pow(10, i)).replace(' Ω', '').replace('Ω', '')]).concat([[ORO[0], ORO[1], 'dorado · ×0,1'], [PLATA[0], PLATA[1], 'plateado · ×0,01']]);
  fila('#r-b3', mults, b.m === -1 ? 10 : b.m === -2 ? 11 : b.m, (i) => { R.ohm = valorDeBandas(b.d1, b.d2, i === 10 ? -1 : i === 11 ? -2 : i); });
  fila('#r-b4', TOLS.map(([t, c]) => [c[0], c[1], c[0] + ' · ± ' + t + ' %']), TOLS.findIndex((x) => x[0] === R.tol), (i) => { R.tol = TOLS[i][0]; });
}
function abrirRes() {
  const el = elSel(); if (!el || nat(el) !== 'resistencia' || R) return;
  R = { ohm: el.ohm || 220, tol: el.tol || 5 };
  $('#m-res').classList.add('abierto'); pintarRes(false);
  setTimeout(() => { $('#r-valor').focus(); $('#r-valor').select(); }, 30);
}
function cerrarRes(aceptar) {
  const el = elSel();
  if (aceptar && el && R) { marcar(); el.ohm = R.ohm; el.tol = R.tol; el.valor = textoOhm(R.ohm); cambio(); inspector(); estado('Resistencia de ' + textoOhm(R.ohm) + ' ± ' + R.tol + ' %.'); }
  R = null; $('#m-res').classList.remove('abierto');
}
$('#r-valor').oninput = (e) => { const v = leerOhm(e.target.value); if (v > 0) { R.ohm = v; pintarRes(true); } };
$('#r-rapidos').innerHTML = ['100', '220', '330', '470', '1k', '2.2k', '4.7k', '10k', '47k', '100k', '1M'].map((v) => `<button class="btn chico" data-v="${v}">${v.replace('.', ',')}</button>`).join('');
$('#r-rapidos').querySelectorAll('button').forEach((b) => { b.onclick = () => { R.ohm = leerOhm(b.dataset.v); pintarRes(false); }; });
$('#r-aceptar').onclick = () => cerrarRes(true); $('#r-cancelar').onclick = () => cerrarRes(false); $('#r-cerrar').onclick = () => cerrarRes(false);
$('#m-res').addEventListener('pointerdown', (e) => { if (e.target === $('#m-res')) cerrarRes(false); });

/* ---------- Exportar ---------- */
// SVG autocontenido de una pestaña: fondo blanco, recortado al dibujo, sin grilla ni avisos
function svgDe(v, css) {
  if (!E[v].els.length) return null;
  const tmp = document.createElementNS(NS, 'svg'), g = document.createElementNS(NS, 'g');
  tmp.style.cssText = 'position:absolute; left:-9999px; top:0; width:10px; height:10px; visibility:hidden';
  const dentro = contenido(v, true);
  g.innerHTML = dentro; tmp.appendChild(g); document.body.appendChild(tmp);
  const b = cajaDom(g); tmp.remove();
  const m = 16, x = Math.floor(b.x - m), y = Math.floor(b.y - m), w = Math.ceil(b.width + 2 * m), h = Math.ceil(b.height + 2 * m);
  const sim = v === 'proto' ? simbolosDe(dentro) : '';   // los dibujos de Wokwi que usa van adentro: el SVG no depende de la página
  return { w, h, svg: `<svg xmlns="${NS}"${sim ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : ''} width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}">${css ? `<style>${css}</style>` : ''}${sim ? `<defs>${sim}</defs>` : ''}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>${dentro}</svg>` };
}
// Montserrat incrustada para que el PNG salga con la tipografía del sitio (si no hay red, queda Arial)
let fuenteLista = null;
function fuenteCSS() {
  if (fuenteLista) return fuenteLista;
  const tope = new Promise((r) => setTimeout(() => r(''), 3500));
  const bajarla = (async () => {
    try {
      const css = await (await fetch('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&display=swap')).text();
      const caras = [...css.matchAll(/\/\* latin \*\/\s*@font-face\s*{[^}]*font-weight:\s*(\d+)[^}]*src:\s*url\(([^)]+)\)[^}]*}/g)];
      const b64 = {}; let out = '';
      for (const c of caras) {
        if (!b64[c[2]]) { const u = new Uint8Array(await (await fetch(c[2])).arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); b64[c[2]] = btoa(s); }
        out += `@font-face{font-family:Montserrat;font-weight:${c[1]};src:url(data:font/woff2;base64,${b64[c[2]]}) format('woff2');}`;
      }
      return out;
    } catch (e) { return ''; }
  })();
  fuenteLista = Promise.race([bajarla, tope]); return fuenteLista;
}
async function exportarPNG(v = vista) {
  if (v === 'proto' && real()) await asegurarArte();
  const r = svgDe(v, await fuenteCSS()); if (!r) return null;
  const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(r.svg);
  await img.decode(); await new Promise((ok) => setTimeout(ok, 60));
  const c = document.createElement('canvas'); c.width = r.w * 2; c.height = r.h * 2;
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}
const nombreArchivo = () => (E.titulo || 'circuito').toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '-').replace(/^-|-$/g, '') || 'circuito';
function bajar(url, nombre) { const a = document.createElement('a'); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(() => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); a.remove(); }, 1500); estado('Descargado: ' + nombre); }
const sufijo = () => (vista === 'esq' ? '-esquematico' : '-protoboard');
$('#b-svg').onclick = () => { const r = svgDe(vista); if (!r) { estado('Todavía no hay nada dibujado.', true); return; } bajar(URL.createObjectURL(new Blob([r.svg], { type: 'image/svg+xml' })), nombreArchivo() + sufijo() + '.svg'); };
$('#b-png').onclick = async () => { const u = await exportarPNG(); if (!u) { estado('Todavía no hay nada dibujado.', true); return; } bajar(u, nombreArchivo() + sufijo() + '.png'); };
$('#b-insertar').onclick = async () => {
  const png = await exportarPNG(); if (!png) { estado('Todavía no hay nada dibujado.', true); return; }
  try { window.parent.FbitProtocolo.recibir({ tipo: 'circuito', vista: vista === 'esq' ? 'esquematico' : 'protoboard', png, titulo: E.titulo || '' }); estado('Insertado en el protocolo.'); }
  catch (e) { estado('No se pudo insertar: el protocolo no está abierto.', true); }
};

/* ---------- Ejemplos ---------- */
const hoyo = (c, fila) => [colX(c), FILAS[fila] != null ? FILAS[fila] : RIELES[fila]];
function armar(titulo, hacer) {   // arma un circuito con ayudantes que ubican cada pata por su nombre
  const o = { titulo, esq: { els: [] }, proto: { els: [], cols: 30 } };
  const lado = (v) => {
    const pon = (c, a, extra) => { const k = COMP.get(c); if (!k || !k[v]) return null; const el = Object.assign({ id: uid(), c, a }, extra); if (k[v].f === 'nativo') el.t = k[v].t; if (k.valor && !el.valor) el.valor = k.valor; o[v].els.push(el); return el; };
    const pata = (el, n) => { if (!el) return null; const i = nombres(el, v).indexOf(n); return i < 0 ? null : terminales(el, v)[i].slice(); };
    const cable = (color, ...pts) => { for (let i = 1; i < pts.length; i++) if (pts[i - 1] && pts[i]) o[v].els.push({ id: uid(), c: 'cable', t: 'cable', a: pts[i - 1].slice(), b: pts[i].slice(), color }); };
    return { pon, pata, cable };
  };
  hacer(lado('esq'), lado('proto'));
  return o;
}
const R220 = { valor: '220 Ω', ohm: 220, tol: 5 }, R10K = { valor: '10 kΩ', ohm: 10000, tol: 5 };
const EJEMPLOS = [
  { nombre: 'LED con resistencia en P0', nota: 'La salida más simple: encender y apagar un LED.', hacer: () => armar('LED con resistencia en P0', (e, p) => {
    const m = e.pon('microbit', [-60, -160], { ver: 'v2' }), P0 = e.pata(m, 'P0'), GND = e.pata(m, 'GND');
    e.pon('resistencia', [-40, 0], Object.assign({ b: [-40, 100], rotulo: 'R1' }, R220)); e.pon('led', [40, 100], { b: [40, 0], rotulo: 'LED1' });
    e.cable('negro', P0, [-40, 0]); e.cable('negro', [-40, 100], [40, 100]); e.cable('negro', [40, 0], GND);
    const mb = p.pon('microbit', [140, 430], { ver: 'v2', arriba: true });
    p.pon('resistencia', hoyo(20, 'h'), Object.assign({ b: hoyo(16, 'h') }, R220)); p.pon('led', hoyo(16, 'g'), { b: hoyo(15, 'g') });
    p.cable('rojo', p.pata(mb, 'P0'), hoyo(20, 'j')); p.cable('negro', hoyo(15, 'j'), p.pata(mb, 'GND'));
  }) },
  { nombre: 'LDR en divisor de tensión a P1', nota: 'Medir luz: la tensión del punto medio se lee como entrada analógica.', hacer: () => armar('LDR en divisor a P1', (e, p) => {
    const m = e.pon('microbit', [-60, -160], { ver: 'v2' }), V3 = e.pata(m, '3V'), GND = e.pata(m, 'GND'), P1 = e.pata(m, 'P1');
    e.pon('ldr', [120, -20], { b: [120, 60], rotulo: 'LDR1' }); e.pon('resistencia', [120, 60], Object.assign({ b: [120, 140], rotulo: 'R1' }, R10K));
    e.cable('negro', V3, [20, -20], [120, -20]); e.cable('negro', GND, [40, -40], [200, -40], [200, 140], [120, 140]); e.cable('negro', P1, [-20, 60], [120, 60]);
    const mb = p.pon('microbit', [140, 430], { ver: 'v2', arriba: true });
    p.pon('resistencia', hoyo(15, 'f'), Object.assign({ b: hoyo(8, 'f'), rotulo: 'R1' }, R10K)); p.pon('ldr', hoyo(11, 'h'), { b: hoyo(15, 'h'), rotulo: 'LDR1' });
    p.cable('negro', p.pata(mb, 'GND'), hoyo(8, 'j')); p.cable('rojo', p.pata(mb, '3V'), hoyo(11, 'j')); p.cable('amarillo', p.pata(mb, 'P1'), hoyo(15, 'j'));
  }) },
  { nombre: 'Ultrasonido HC-SR04P con extensor', nota: 'Distancia con el sensor de 3,3 V en los pines que usa MakeCode: TRIG en P8 y ECHO en P12.', hacer: () => armar('Ultrasonido con extensor', (e, p) => {
    const id = COMP.has('hc-sr04p') ? 'hc-sr04p' : 'hc-sr04';
    const m = e.pon('microbit', [0, -120], { ver: 'v2', ext: true }), s = e.pon(id, [-300, -120], { rot: 1, rotulo: 'U1' });
    const T = e.pata(s, 'TRIG'), EC = e.pata(s, 'ECHO'), P8 = e.pata(m, 'P8'), P12 = e.pata(m, 'P12');
    e.cable('negro', e.pata(s, 'VCC'), e.pata(m, '3V')); e.cable('negro', e.pata(s, 'GND'), e.pata(m, 'GND'));
    if (T && P8) e.cable('negro', T, [T[0] - 20, T[1]], [T[0] - 20, P8[1]], P8);
    if (EC && P12) e.cable('negro', EC, [EC[0] - 40, EC[1]], [EC[0] - 40, 160], [P12[0] + 20, 160], [P12[0] + 20, P12[1]], P12);
    const mb = p.pon('microbit', [110, 480], { ver: 'v2', ext: true, arriba: true }), u = p.pon(id, hoyo(12, 'g'));
    const col = (n) => { const q = p.pata(u, n); return q ? [q[0], FILAS.j] : null; };
    p.cable('rojo', col('VCC'), p.pata(mb, '3V')); p.cable('negro', col('GND'), p.pata(mb, 'GND')); p.cable('amarillo', col('TRIG'), p.pata(mb, 'P8')); p.cable('azul', col('ECHO'), p.pata(mb, 'P12'));
  }) },
  { nombre: 'Servo con pilas aparte', nota: 'El servo se alimenta con 4 pilas y comparte el negativo con la micro:bit; la señal sale de P0.', hacer: () => armar('Servo con pilas aparte', (e, p) => {
    const pilas = COMP.has('portapilas-4aa') ? 'portapilas-4aa' : 'portapilas-2aa';
    const m = e.pon('microbit', [-60, -160], { ver: 'v2' }), s = e.pon('servo', [140, 0], { rotulo: 'M1' }), S = e.pata(s, 'SEÑAL'), GND = e.pata(m, 'GND');
    e.pon(pilas, [60, 20], { b: [60, 120], rotulo: 'B1' });
    e.cable('negro', [60, 20], e.pata(s, 'V+')); e.cable('negro', [60, 120], [100, 120], [100, 40], e.pata(s, 'GND')); e.cable('negro', GND, [40, 120], [60, 120]);
    if (S) e.cable('negro', e.pata(m, 'P0'), [-40, 160], [S[0] + 20, 160], [S[0] + 20, S[1]], S);
    const mb = p.pon('microbit', [100, 440], { ver: 'v2', arriba: true }), sv = p.pon('servo', [380, 450], { rot: 1 }), b = p.pon(pilas, [600, 450], { rot: 1 });
    p.cable('rojo', p.pata(b, '+'), hoyo(28, 2)); p.cable('negro', p.pata(b, '−'), hoyo(30, 3)); p.cable('rojo', p.pata(sv, 'V+'), hoyo(20, 2)); p.cable('negro', p.pata(sv, 'GND'), hoyo(18, 3));
    p.cable('negro', p.pata(mb, 'GND'), hoyo(5, 3)); p.cable('amarillo', p.pata(mb, 'P0'), p.pata(sv, 'SEÑAL'));
  }) },
];
// Circuito de un sensor de la extensión de MakeCode, conectado como lo dibuja el simulador: la protoboard se arma
// con esas conexiones y el esquemático se genera a partir de ella (así las dos vistas dicen lo mismo).
const compDeParte = (pid) => LISTA.find((c) => c.parte === pid && c.proto && c.esq) || null;
function ejemploParte(pid) {
  const pt = parte(pid), c = compDeParte(pid); if (!pt || !c) return null;
  const conExt = pt.pines.some((q) => q.destino && !ANILLOS.includes(q.destino)), izq = Math.ceil(Math.max(0, (pt.pines.find((k) => k.n === c.pines[0].n) || pt.pines[0]).x) * G / pt.paso / G);
  const o = armar(c.nombre + ' · como en MakeCode', (e, p) => {
    const mb = p.pon('microbit', conExt ? [110, 480] : [140, 430], { ver: 'v2', ext: conExt, arriba: true }), u = p.pon(c.id, hoyo(Math.max(4, izq + 2), 'g'), { rotulo: 'U1' });
    let k = 0; const COL = ['amarillo', 'azul', 'verde', 'naranja'];
    pt.pines.forEach((q) => { if (!q.destino) return; const a = p.pata(u, q.n), b = p.pata(mb, q.destino); if (a && b) p.cable(q.destino === '3V' ? 'rojo' : q.destino === 'GND' ? 'negro' : COL[k++ % COL.length], [a[0], FILAS.j], b); });
  });
  const antes = E, vAntes = vista; E = limpiar(o); vista = 'proto';
  try { o.proto.els = E.proto.els; o.esq.els = aEsquematico().els; } catch (er) { console.error(er); } finally { E = antes; vista = vAntes; }
  return o;
}
function abrirEjemplo(o, nombre) {
  if (!o) return false;
  if ((E.esq.els.length || E.proto.els.length) && !confirm('¿Abrir «' + nombre + '»? Reemplaza el circuito actual (guardalo antes si lo querés conservar).')) return false;
  cargar(o); estado('Ejemplo: ' + nombre + '.'); return true;
}
function armarParte(pid) { const c = compDeParte(pid); if (!c) return false; const ok = abrirEjemplo(ejemploParte(pid), c.nombre + ' como en MakeCode'); if (ok) { cambiarVista('proto'); compMirado = null; inspector(); } return ok; }
function pintarEjemplos() {
  const mk = partes().filter((pt) => compDeParte(pt.id));
  $('#m-ej').innerHTML = EJEMPLOS.map((x, i) => `<button data-i="${i}">${esc(x.nombre)}<small>${esc(x.nota)}</small></button>`).join('') +
    (mk.length ? '<div class="ej-t">Sensores de MakeCode + FisicaBit</div>' + mk.map((pt) => `<button data-p="${esc(pt.id)}">${esc(compDeParte(pt.id).nombre)}<small>Conectado como lo dibuja el simulador de MakeCode: ${esc(pt.conexion)}.</small></button>`).join('') : '');
}
pintarEjemplos();
$('#h-ejemplos').onclick = () => { $('#m-ej').hidden = !$('#m-ej').hidden; };
$('#m-ej').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return; $('#m-ej').hidden = true;
  if (b.dataset.p) armarParte(b.dataset.p); else abrirEjemplo(EJEMPLOS[+b.dataset.i].hacer(), EJEMPLOS[+b.dataset.i].nombre);
});
$('#insp').addEventListener('click', (e) => { const b = e.target.closest('[data-armar]'); if (b) armarParte(b.dataset.armar); });

/* ---------- Archivo ---------- */
$('#b-nuevo').onclick = () => { if ((E.esq.els.length || E.proto.els.length) && !confirm('¿Empezar un circuito vacío? Se pierde el actual si no lo guardaste.')) return; cargar(vacio()); estado('Circuito nuevo.'); };
$('#b-guardar').onclick = () => bajar(URL.createObjectURL(new Blob([JSON.stringify(Object.assign({ formato: 'fisicabit-circuito-2' }, JSON.parse(datos())))], { type: 'application/json' })), nombreArchivo() + '.circuito.json');
$('#b-abrir').onclick = () => $('#f-abrir').click();
$('#f-abrir').onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const d = JSON.parse(await f.text()); if (!/^fisicabit-circuito-[12]$/.test(d.formato || '')) throw new Error('no es un circuito de fisicabit');
    const pedidos = ((d.esq && d.esq.els) || []).length + ((d.proto && d.proto.els) || []).length; cargar(d);
    const quedan = E.esq.els.length + E.proto.els.length;
    estado('Circuito abierto: ' + f.name + (quedan < pedidos ? ' (' + (pedidos - quedan) + ' elemento(s) no se reconocieron)' : ''), quedan < pedidos);
  } catch (er) { estado('No se pudo abrir: ' + er.message, true); }
};

/* ---------- Vínculo entre el esquemático y la protoboard ----------
   Las dos vistas se comparan por sus redes; cualquiera de las dos puede generar la otra. */
const sinCables = (v) => E[v].els.filter((e) => e.c !== 'cable' && nat(e, v) !== 'texto');
const rolDe = (c, pinN) => { const k = COMP.get(c === 'microbit' ? '' : c), p = k && k.pines.find((x) => x.n === pinN); return p ? p.rol : ''; };
const nombreEl = (el) => el.rotulo || comp(el).nombre;
const OTRA = { esq: 'proto', proto: 'esq' }, VISTA_TXT = { esq: 'el esquemático', proto: 'la protoboard' }, DE_VISTA = { esq: 'del esquemático', proto: 'de la protoboard' };
// Empareja los elementos de las dos vistas: mismo componente y rótulo; después, mismo componente, por orden
function emparejar() {
  const A = sinCables('esq').filter((e) => comp(e).proto), B = sinCables('proto').filter((e) => comp(e).esq), pares = [], libresB = new Set(B);
  const pinClave = (e, v) => (esPuerto(e, v) ? pinDe(e) : '');   // dos pines sueltos de la micro:bit solo son el mismo si nombran el mismo pin
  const tomar = (a, igualRot) => { for (const b of libresB) if (b.c === a.c && pinClave(a, 'esq') === pinClave(b, 'proto') && (!igualRot || (b.rotulo || '') === (a.rotulo || ''))) { libresB.delete(b); pares.push([a, b]); return true; } return false; };
  const quedan = A.filter((a) => !tomar(a, true)), solosA = quedan.filter((a) => !tomar(a, false));
  return { pares, solosA, solosB: [...libresB] };
}
function vinculo() {
  if (!sinCables('esq').length || !sinCables('proto').length) return { igual: null, vacio: true, difs: [] };
  const { pares, solosA, solosB } = emparejar(), difs = [], clave = { esq: new Map(), proto: new Map() }, rot = new Map();
  solosA.forEach((a) => difs.push(nombreEl(a) + ' está en el esquemático y no en la protoboard.'));
  solosB.forEach((b) => difs.push(nombreEl(b) + ' está en la protoboard y no en el esquemático.'));
  pares.forEach(([a, b], i) => {
    const na = new Set(nombres(a, 'esq')), comunes = new Set(nombres(b, 'proto').filter((n) => na.has(n)));   // solo las patas que existen en las dos vistas
    clave.esq.set(a.id, { k: 'k' + i, comunes }); clave.proto.set(b.id, { k: 'k' + i, comunes }); rot.set('k' + i, deMB(a, 'esq') ? '' : nombreEl(a));
  });
  const rotulo = (s) => { const [k, pinN] = s.split('\u0001'); return rot.get(k) ? rot.get(k) + ' (' + pinN + ')' : pinN; };
  const conj = (v) => redes(v).map((r) => r.map((x) => { const q = clave[v].get(x.el); return q && q.comunes.has(x.pin) ? q.k + '\u0001' + x.pin : null; }).filter(Boolean).sort()).filter((r) => r.length >= 2);
  const R = { esq: conj('esq'), proto: conj('proto') };
  for (const v of ['esq', 'proto']) {
    const deOtra = new Map(); R[OTRA[v]].forEach((r) => r.forEach((s) => deOtra.set(s, r)));
    R[v].forEach((r) => { const o = deOtra.get(r[0]) || [], faltan = r.slice(1).filter((s) => !o.includes(s)); faltan.forEach((s) => difs.push(rotulo(r[0]) + ' está unido a ' + rotulo(s) + ' solo en ' + VISTA_TXT[v] + '.')); });
  }
  const firma = (l) => l.map((r) => r.join('+')).sort().join(' | ');
  if (!difs.length && firma(R.esq) !== firma(R.proto)) difs.push('Las conexiones no coinciden.');
  return { igual: !difs.length, vacio: false, difs: [...new Set(difs)] };
}
// Medida real de un elemento ya ubicado (lo que ocupa su dibujo, con rótulos, más sus terminales)
let gMedir = null;
function medir(el, v) {
  if (!gMedir) { const s = document.createElementNS(NS, 'svg'); s.style.cssText = 'position:absolute; left:-9999px; top:0; width:10px; height:10px; visibility:hidden'; gMedir = document.createElementNS(NS, 'g'); s.appendChild(gMedir); document.body.appendChild(s); }
  gMedir.innerHTML = dibujar(el, v, true); const b = cajaDom(gMedir); gMedir.innerHTML = '';
  let x0 = b.x, y0 = b.y, x1 = b.x + b.width, y1 = b.y + b.height;
  terminales(el, v).forEach((p) => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
  return { x0, y0, x1, y1 };
}
// Lista de conexiones de una vista, lista para armar la otra: elementos nuevos (mismo componente, rótulo, valor…) y
// redes con su clase: '+' positivo, '+2' segundo positivo, '-' masa, 's' señal.
function conexiones(desde) {
  const hacia = OTRA[desde], dest = new Map(), fuera = [], sinPata = [], els = [];
  sinCables(desde).forEach((s) => {
    const c = comp(s);
    if (!c[hacia]) { if (nat(s, desde) !== 'tierra') fuera.push(nombreEl(s)); return; }
    const el = { id: uid(), c: s.c }; if (c[hacia].f === 'nativo') el.t = c[hacia].t;
    ['rotulo', 'valor', 'ohm', 'tol', 'ver', 'ext', 'cerrado', 'tono', 'pin'].forEach((k) => { if (s[k] != null && s[k] !== '') el[k] = s[k]; });
    dest.set(s.id, el); els.push(el);
  });
  const esTierra = (x) => { const s = porId(x.el, desde); return !!s && nat(s, desde) === 'tierra'; };
  const crudas = redes(desde, true).map((r) => ({
    pos: r.some((x) => (x.c === 'microbit' && x.pin === '3V') || rolDe(x.c, x.pin) === 'fuente+'), neg: r.some((x) => (x.c === 'microbit' && x.pin === 'GND') || rolDe(x.c, x.pin) === 'fuente-' || esTierra(x)),
    placa: r.some((x) => x.c === 'microbit' && (x.pin === '3V' || x.pin === 'GND')),
    patas: r.map((x) => { const el = dest.get(x.el); if (!el) return null; if (!nombres(Object.assign({ a: [0, 0], b: [100, 0] }, el), hacia).includes(x.pin)) { sinPata.push(nombreEl(el) + ' (' + x.pin + ')'); return null; } return { el, pin: x.pin }; }).filter(Boolean),
  })).filter((r) => r.patas.length >= 2);
  const primero = (l) => l.slice().sort((p, q) => q.placa - p.placa)[0];
  const P = crudas.filter((r) => r.pos), M = crudas.filter((r) => r.neg && !r.pos), p1 = primero(P), p2 = P.find((r) => r !== p1), m = primero(M);
  crudas.forEach((r) => { r.clase = r === p1 ? '+' : r === p2 ? '+2' : r === m ? '-' : 's'; });
  return { els, redes: crudas, fuera, sinPata };
}
// Orden de los elementos siguiendo las conexiones de señal: primero lo que toca a la placa, y quedan cerca los que se unen
function ordenar(lista, nets) {
  const vec = new Map(lista.map((e) => [e, []]));
  nets.filter((r) => r.clase === 's').forEach((r) => r.patas.forEach((p) => r.patas.forEach((q) => { if (p.el !== q.el && vec.has(p.el) && vec.has(q.el) && !vec.get(p.el).includes(q.el)) vec.get(p.el).push(q.el); })));
  const dePlaca = new Set(), enPos = new Set(), fuentes = (e) => comp(e).pines.some((p) => p.rol === 'fuente+');
  nets.forEach((r) => { const placa = r.patas.some((p) => p.el.t === 'microbit' || p.el.t === 'mbpin'); r.patas.forEach((p) => { if (r.clase === 's' && placa) dePlaca.add(p.el); if (r.clase[0] === '+') enPos.add(p.el); }); });
  const out = [], visto = new Set(), bajar = (e) => { if (visto.has(e) || !vec.has(e)) return; visto.add(e); out.push(e); vec.get(e).slice().sort((a, b) => vec.get(a).length - vec.get(b).length).forEach(bajar); };
  const resto = lista.filter((e) => !fuentes(e));   // las fuentes quedan para el final
  resto.filter((e) => dePlaca.has(e)).concat(resto.filter((e) => enPos.has(e)), resto, lista).forEach(bajar);
  return out;
}
const COLORES_SENAL = ['amarillo', 'azul', 'verde', 'naranja', 'gris'];
const cab = (a, b, color) => ({ id: uid(), c: 'cable', t: 'cable', a: [a[0], a[1]], b: [b[0], b[1]], color });
// Red de exactamente dos patas entre dos elementos: se pueden poner en serie directa, sin cable ni pista
const enSerie = (nets, x, y) => nets.find((r) => r.patas.length === 2 && ((r.patas[0].el === x && r.patas[1].el === y) || (r.patas[0].el === y && r.patas[1].el === x))) || null;
const pataDe = (r, el) => r.patas.find((p) => p.el === el).pin;

/* ---------- Esquemático → protoboard ----------
   Sobre la placa: columnas de izquierda a derecha, una libre entre pieza y pieza. Las de dos patas van junto al canal,
   en la mitad de abajo (o en la de arriba si se unen a las patas de arriba de un integrado); dos en serie comparten columna.
   Fuera de la placa: fuentes a la izquierda; micro:bit y demás sueltos abajo, cerca de lo que conectan.
   Alimentación por los rieles; cada señal, con puentes de un color. */
function aProtoboard() {
  const N = conexiones('esq'), nets = N.redes, cables = [];
  const D = (el) => def(el, 'proto'), suelto = (el) => D(el).n === 'libre', canal = (el) => comp(el).proto.f === 'dip' || el.t === 'pulsador';
  const enPlaca = ordenar(N.els.filter((e) => !suelto(e)), nets);
  // 1. Mitad de cada pieza de dos patas: arriba si toca más patas de arriba de los integrados que de abajo
  const arribaDip = (el, pn) => { const ps = comp(el).pines, i = ps.findIndex((p) => p.n === pn); return comp(el).proto.f === 'dip' && i >= Math.ceil(ps.length / 2); };
  const mitadDe = new Map();
  enPlaca.forEach((el) => {
    if (D(el).n !== 2) { mitadDe.set(el, canal(el) ? 'x' : 'f'); return; }
    let pts = 0; nets.forEach((r) => { if (r.patas.some((p) => p.el === el)) r.patas.forEach((p) => { if (p.el !== el && comp(p.el).proto.f === 'dip') pts += arribaDip(p.el, p.pin) ? 1 : -1; }); });
    mitadDe.set(el, pts > 0 ? 'a' : 'f');
  });
  const FILA_P = { f: ['f', 'h'], a: ['e', 'c'] }, FILA_R = { h: 'g', e: 'd', c: 'b' };   // filas de las piezas y fila que tapa su rótulo (el de la fila f cae sobre el canal)
  const tramos = {}, cubre = (fila, c1, c2) => (tramos[fila] || []).some(([x, y]) => c1 <= y && c2 >= x), tender = (fila, c1, c2) => (tramos[fila] = tramos[fila] || []).push([Math.min(c1, c2), Math.max(c1, c2)]);
  // 2. Columnas
  const cur = { f: 2, a: 2 }, prev = { f: null, a: null };
  const siguiente = (k, m) => { for (let j = k + 1; j < enPlaca.length; j++) { const x = mitadDe.get(enPlaca[j]); if (x === m || x === 'x' || (m === 'f' && D(enPlaca[j]).n !== 2)) return enPlaca[j]; } return null; };
  enPlaca.forEach((el, k) => {
    const d = D(el), fo = comp(el).proto, m = mitadDe.get(el);
    if (d.n === 2) {
      const nm = nombres(Object.assign({ a: [0, 0], b: [20, 0] }, el), 'proto'), largo = el.t === 'resistencia' || el.t === 'diodo' || fo.f === 'axial' ? 4 : (d.alto || 0) > 13 ? 2 : 1;
      const sig = siguiente(k, m), pv = prev[m], rp = pv ? enSerie(nets, pv.el, el) : null, rs = sig && D(sig).n === 2 && mitadDe.get(sig) === m ? enSerie(nets, el, sig) : null;
      // En el estilo realista, las piezas que van de pie (LED, zumbador) quedan junto al canal y las acostadas una fila más allá, para que no se tapen
      const rl = real() && m === 'f' ? realDe(comp(el)) : null, pref = real() && m === 'f' ? (rl && rl.wokwi && rl.alto > 30 ? 'f' : 'h') : FILA_P[m][0];
      const dePie = !!rl && rl.wokwi && rl.alto > 30, pIzq0 = rs ? nm.find((n) => n !== pataDe(rs, el)) : nm[0];
      let cIzq = cur[m], fila = pref, pIzq = pIzq0;
      if (rp && pv.pDer === pataDe(rp, pv.el) && (!rs || pataDe(rs, el) !== pataDe(rp, el))) { cIzq = pv.cDer; fila = pv.fila === pref ? FILA_P[m].find((f) => f !== pref) : pref; pIzq = pataDe(rp, el); }   // en serie: comparte la columna con la anterior
      if (real()) {   // que una pieza de pie no tape a las de la otra mitad (ni al revés): se corre hasta tener lugar
        const choca = (c) => cubre(fila, c, c + largo) || (dePie && fila === 'f' && ['e', 'd', 'c'].some((f) => cubre(f, c - 1, c + largo + 1)));
        if (choca(cIzq)) { if (cIzq !== cur[m]) { cIzq = cur[m]; fila = pref; pIzq = pIzq0; } while (choca(cIzq) && cIzq < 58) cIzq++; }
        if (dePie && fila === 'f') ['e', 'd', 'c'].forEach((f) => tender(f, cIzq - 1, cIzq + largo + 1));
      }
      const cDer = cIzq + largo, izq = hoyo(cIzq, fila), der = hoyo(cDer, fila);
      el.a = nm[0] === pIzq ? izq : der; el.b = nm[0] === pIzq ? der : izq;
      tender(fila, cIzq, cDer); if (el.rotulo && FILA_R[fila]) tender(FILA_R[fila], cIzq, cDer);   // ni puentes por encima de la pieza ni de su rótulo
      prev[m] = { el, cDer, fila, pDer: nm.find((n) => n !== pIzq) }; cur[m] = cDer + 2;
    } else if (canal(el)) {
      const ancho = fo.f === 'dip' ? Math.ceil(comp(el).pines.length / 2) : 3, c = Math.max(cur.f, cur.a);
      el.a = hoyo(c, 'e'); cur.f = cur.a = c + ancho + 1; prev.f = prev.a = null;
    } else if (real()) {   // el dibujo realista es más grande que la huella: se le deja su lugar (lo alto tapa también la mitad de arriba)
      const n = d.term(Object.assign({ a: [0, 0] }, el)).length, b = medir(Object.assign({}, el, { a: hoyo(10, 'f'), rotulo: '' }), 'proto');
      const izq = Math.max(0, Math.ceil((colX(10) - b.x0 - 10) / G)), der = Math.max(0, Math.ceil((b.x1 - colX(10 + n - 1) - 10) / G)), alta = FILAS.f - b.y0 > 50, libre = alta ? Math.max(cur.f, cur.a) : cur.f;
      const c = Math.max(2, libre + izq - (libre <= 2 ? 2 : 0));
      el.a = hoyo(c, 'f'); cur.f = c + n + der + 1; prev.f = null; if (alta) { cur.a = cur.f; prev.a = null; ['a', 'b', 'c', 'd', 'e'].forEach((f) => tender(f, c - izq, c + n - 1 + der)); }
    } else {
      const n = d.term(Object.assign({ a: [0, 0] }, el)).length, w = fo.f === 'modulo' ? Math.max(fo.w || 0, (n - 1) * G + 18) : 0, extra = Math.max(0, Math.ceil(((w - (n - 1) * G) / 2 - 8) / G));
      const alta = (fo.f === 'modulo' ? Math.max(fo.h || 40, 40) : el.t === 'potenciometro' ? 52 : 30) > 50, c = alta ? Math.max(cur.f, cur.a) : cur.f;   // un cuerpo alto pasa el canal y tapa la mitad de arriba
      el.a = hoyo(c + extra, 'f'); cur.f = c + extra * 2 + n + 1; if (alta) { cur.a = cur.f; prev.a = null; } prev.f = null;
    }
  });
  const cols = Math.max(cur.f, cur.a) <= 30 ? 30 : 60, anchoPlaca = colX(cols) + 40;
  // 3. Agujeros ocupados y nodo (columna y mitad) de cada pata
  const usados = new Set(), clave = (p) => p[0] + ',' + p[1], ocupar = (p) => { usados.add(clave(p)); return p; };
  enPlaca.forEach((el) => terminales(el, 'proto').forEach(ocupar));
  const nodoDe = (p) => { const c = Math.round((p[0] - 40) / G) + 1, f = FILA_Y.indexOf(p[1]); return f < 0 || c < 1 || c > cols ? null : { col: c, mitad: f < 5 ? 'a' : 'f' }; };
  const puntos = (pt) => { const t = terminales(pt.el, 'proto'), nm = nombres(pt.el, 'proto'); return t.filter((_, i) => nm[i] === pt.pin); };
  // 4. Elementos sueltos: fuentes a la izquierda, a la altura de los rieles de abajo; el resto abajo, cerca de sus conexiones
  const deseado = (el) => { const xs = []; nets.forEach((r) => { if (r.patas.some((p) => p.el === el)) r.patas.forEach((p) => { if (!suelto(p.el)) puntos(p).forEach((q) => xs.push(q[0])); }); }); return xs.length ? xs.reduce((u, w) => u + w, 0) / xs.length : anchoPlaca / 2; };
  let yIzq = 372; const abajo = [];
  N.els.filter(suelto).forEach((el) => {
    const fuente = el.t !== 'microbit' && comp(el).pines.some((p) => p.rol === 'fuente+');
    if (el.t === 'microbit') el.arriba = true; else if (D(el).rota === 2) el.rot = 1;   // bornes hacia arriba, del lado de la placa
    el.a = [0, 0]; const b = medir(el, 'proto');
    if (fuente) { el.a = [Math.floor((-40 - b.x1) / 10) * 10, Math.ceil((yIzq - b.y0) / 10) * 10]; yIzq = el.a[1] + b.y1 + 30; }   // desde la altura de los rieles de abajo, hacia abajo
    else abajo.push({ el, b, x: deseado(el) });
  });
  let tope = -Infinity;
  abajo.sort((p, q) => p.x - q.x).forEach((it) => {
    const w = it.b.x1 - it.b.x0, izq = Math.max(it.x - w / 2, tope + 40);
    it.el.a = [Math.round((izq - it.b.x0) / 10) * 10, Math.ceil((440 - it.b.y0) / 10) * 10]; tope = it.el.a[0] + it.b.x1;
  });
  // 5. Cables
  const FIL = { f: ['j', 'i', 'g', 'h', 'f'], a: ['a', 'b', 'd', 'c', 'e'] };
  const hueco = (col, mitad, evitar, cerca) => { const l = cerca ? FIL[mitad].slice().sort((x, y) => Math.abs(FILAS[x] - 190) - Math.abs(FILAS[y] - 190)) : FIL[mitad]; for (const f of l) { const p = hoyo(col, f); if (f !== evitar && !usados.has(clave(p)) && !cubre(f, col, col)) return ocupar(p); } return ocupar(hoyo(col, l[0])); };
  function puente(n1, n2, color) {   // une dos medias columnas: por una misma fila si está despejada; si no, en diagonal
    const c1 = Math.min(n1.col, n2.col), c2 = Math.max(n1.col, n2.col);
    if (n1.mitad === n2.mitad) for (const f of FIL[n1.mitad]) {
      let libre = !cubre(f, c1, c2); for (let c = c1; c <= c2 && libre; c++) if (usados.has(clave(hoyo(c, f)))) libre = false;
      if (libre) { tender(f, c1, c2); cables.push(cab(ocupar(hoyo(n1.col, f)), ocupar(hoyo(n2.col, f)), color)); return; }
    }
    const cruza = n1.mitad !== n2.mitad, p = hueco(n1.col, n1.mitad, null, cruza), q = hueco(n2.col, n2.mitad, cruza ? null : Object.keys(FILAS).find((f) => FILAS[f] === p[1]), cruza); cables.push(cab(p, q, color));
  }
  const rielUsado = [new Set(), new Set(), new Set(), new Set()], enUso = [false, false, false, false];
  function riel(i, x, yOtro) {   // agujero libre del riel más cercano a x; si el cable cruza el riel vecino, ese agujero queda reservado
    let mejor = null; const vecino = i ^ 1;
    for (let c = 2; c <= cols - 2; c++) if (enRiel(c) && !rielUsado[i].has(c) && (mejor == null || Math.abs(colX(c) - x) < Math.abs(colX(mejor) - x))) mejor = c;
    if (mejor == null) mejor = 2;
    rielUsado[i].add(mejor); enUso[i] = true;
    if ((RIELES[vecino] - RIELES[i]) * (yOtro - RIELES[vecino]) > 0) rielUsado[vecino].add(mejor);
    return hoyo(mejor, i);
  }
  let nColor = 0; const dosPos = nets.some((r) => r.clase === '+2');
  nets.forEach((r) => {
    const color = r.clase[0] === '+' ? 'rojo' : r.clase === '-' ? 'negro' : COLORES_SENAL[nColor++ % COLORES_SENAL.length], nd = [], sueltos = [];
    r.patas.forEach((pt) => {
      const pts = puntos(pt); if (!pts.length) return;
      if (suelto(pt.el)) { sueltos.push(pts[0]); return; }
      const n = nodoDe(pts.slice().sort((u, w) => w[1] - u[1])[0]); if (n && !nd.some((x) => x.col === n.col && x.mitad === n.mitad)) nd.push(n);   // patas unidas por dentro: alcanza con una
    });
    nd.sort((u, w) => u.col - w.col); sueltos.sort((u, w) => u[0] - w[0]);
    const nA = nd.filter((n) => n.mitad === 'a'), nF = nd.filter((n) => n.mitad === 'f');
    if (r.clase !== 's' && nd.length + sueltos.length >= 2) {   // alimentación: por los rieles (abajo, salvo que la red solo toque la mitad de arriba)
      const rAbajo = r.clase === '+' ? 2 : r.clase === '+2' ? 0 : 3, rArriba = r.clase === '+' ? (dosPos ? 2 : 0) : r.clase === '+2' ? 0 : 1;
      nd.forEach((n) => { const p = hueco(n.col, n.mitad); cables.push(cab(p, riel(n.mitad === 'f' ? rAbajo : rArriba, p[0], p[1]), color)); });
      sueltos.forEach((p) => cables.push(cab(p, riel(nA.length && !nF.length ? rArriba : rAbajo, p[0], p[1]), color)));
    } else {   // señal: cadena de puentes en cada mitad, un solo cruce del canal, y los bornes sueltos a la columna más cercana
      for (let i = 1; i < nA.length; i++) puente(nA[i - 1], nA[i], color);
      for (let i = 1; i < nF.length; i++) puente(nF[i - 1], nF[i], color);
      if (nA.length && nF.length) { let par = null; nA.forEach((u) => nF.forEach((w) => { if (!par || Math.abs(u.col - w.col) < Math.abs(par[0].col - par[1].col)) par = [u, w]; })); puente(par[0], par[1], color); }
      const base = nF.length ? nF : nA;
      if (base.length) sueltos.forEach((p) => { const n = base.slice().sort((u, w) => Math.abs(colX(u.col) - p[0]) - Math.abs(colX(w.col) - p[0]))[0]; cables.push(cab(p, hueco(n.col, n.mitad), color)); });
      else for (let i = 1; i < sueltos.length; i++) cables.push(cab(sueltos[i - 1], sueltos[i], color));
    }
  });
  if (!dosPos && enUso[0] && enUso[2]) cables.push(cab(hoyo(cols, 0), hoyo(cols, 2), 'rojo'));    // los dos rieles + son la misma red
  if (enUso[1] && enUso[3]) cables.push(cab(hoyo(cols - 1, 1), hoyo(cols - 1, 3), 'negro'));       // y los dos rieles −
  return { els: N.els.concat(cables), cols, fuera: N.fuera, sinPata: N.sinPata };
}

/* ---------- Protoboard → esquemático (trazado por pistas) ----------
   La micro:bit arriba a la izquierda; debajo, una pista horizontal por red (el positivo primero); debajo, la fila de
   componentes; la masa, al fondo. Cada pata baja o sube a su pista por un tramo vertical que nadie más usa. */
function aEsquematico() {
  const N = conexiones('proto'), nets = N.redes, cables = [], g20 = (n, f) => Math[f](n / G) * G;
  const D = (el) => def(el, 'esq'), placa = N.els.find((e) => e.t === 'microbit') || null, fila = ordenar(N.els.filter((e) => e !== placa), nets);
  // rótulos automáticos para lo que no tenía (R1, LED1…)
  N.els.forEach((el) => { const c = comp(el), d = D(el); if (el.rotulo || !c.pref || (d.n !== 2 && !d.rotAt)) return; const usados = new Set(N.els.map((e) => e.rotulo)); let n = 1; while (usados.has(c.pref + n)) n++; el.rotulo = c.pref + n; });
  // 1. Series directas entre vecinos de dos patas, y de qué lado queda cada pata
  const serie = new Map();   // red → true
  fila.forEach((el, k) => {
    if (D(el).n !== 2) return;
    const nm = nombres(Object.assign({ a: [0, 0], b: [100, 0] }, el), 'esq'), ant = fila[k - 1], sig = fila[k + 1];
    const rp = ant && D(ant).n === 2 && ant.pDer ? enSerie(nets, ant, el) : null, rs = sig && D(sig).n === 2 ? enSerie(nets, el, sig) : null;
    let pIzq = nm[0];
    if (rp && ant.pDer === pataDe(rp, ant) && (!rs || pataDe(rs, el) !== pataDe(rp, el))) { pIzq = pataDe(rp, el); serie.set(rp, true); el.pegado = true; }
    else if (rs) pIzq = nm.find((n) => n !== pataDe(rs, el));
    el.pIzq = pIzq; el.pDer = nm.find((n) => n !== pIzq);
  });
  // 2. Plan de cada elemento en coordenadas propias: por dónde sale cada pata conectada hacia su pista
  const pistas = nets.filter((r) => !serie.has(r)), haciaAbajo = (r, el) => el === placa || r.clase === '-';
  function plan(el) {
    const d = D(el); el.a = [0, 0]; if (d.n === 2) { el.a = [el.pIzq === nombres(Object.assign({ a: [0, 0], b: [100, 0] }, el), 'esq')[0] ? 0 : 100, 0]; el.b = [100 - el.a[0], 0]; }
    const t = terminales(el, 'esq'), nm = nombres(el, 'esq'), b = medir(el, 'esq'), caja = { x0: g20(b.x0, 'floor'), y0: g20(b.y0, 'floor'), x1: g20(b.x1, 'ceil'), y1: g20(b.y1, 'ceil') };
    const cx = (Math.min(...t.map((p) => p[0])) + Math.max(...t.map((p) => p[0]))) / 2;
    const lado = (p) => (d.n === 2 ? (p[0] < 50 ? 'L' : 'R') : el.t === 'microbit' && !el.ext ? 'B' : d.rota === 4 ? (Math.abs(p[0]) > Math.abs(p[1]) ? (p[0] < 0 ? 'L' : 'R') : p[1] < 0 ? 'T' : 'B') : p[0] < cx ? 'L' : 'R');
    const sal = [], vert = [];   // salidas: { p, x, red, abajo } · tramos verticales ya tomados: { x, y, abajo }
    const choca = (x, y, abajo, propio) => t.some((q) => q !== propio && q[0] === x && (abajo ? q[1] > y : q[1] < y)) || vert.some((w) => w.x === x && (w.abajo === abajo || (abajo ? w.y > y : w.y < y)));
    const pend = [];
    pistas.forEach((r) => r.patas.forEach((pt) => { if (pt.el !== el) return; const i = nm.indexOf(pt.pin); if (i >= 0) pend.push({ p: t[i], red: r, abajo: haciaAbajo(r, el) }); }));
    pend.sort((u, w) => (u.abajo !== w.abajo ? u.abajo - w.abajo : u.abajo ? w.p[1] - u.p[1] : u.p[1] - w.p[1]));   // primero las que suben, desde arriba; las que bajan, desde abajo
    let kL = 0, kR = 0;
    pend.forEach((s) => {
      const l = lado(s.p), recto = d.n === 2 || l === 'L' || l === 'R' || (l === 'T' && !s.abajo) || (l === 'B' && s.abajo);
      if (recto && !choca(s.p[0], s.p[1], s.abajo, s.p)) s.x = s.p[0];
      else if (l === 'L') { do { kL++; s.x = caja.x0 - G * kL; } while (choca(s.x, s.p[1], s.abajo)); }
      else { do { kR++; s.x = caja.x1 + G * kR; } while (choca(s.x, s.p[1], s.abajo)); }
      vert.push({ x: s.x, y: s.p[1], abajo: s.abajo }); sal.push(s);
    });
    return { el, caja, sal, x0: caja.x0 - G * kL, x1: caja.x1 + G * kR };
  }
  // 3. Ubicación: la placa en el origen; la fila, a su derecha
  const pl = placa ? plan(placa) : null, planes = fila.map(plan);
  const arriba = pistas.filter((r) => r.clase !== '-' && r.patas.length >= 2).sort((a, b) => (a.clase[0] === '+' ? 0 : 1) - (b.clase[0] === '+' ? 0 : 1));
  const yPistas = (pl ? pl.caja.y1 : -G) + 2 * G, yFila = yPistas + arriba.length * G + G;
  const yDe = new Map(arriba.map((r, i) => [r, yPistas + i * G]));
  const mover = (p, dx, dy) => { p.el.a = [p.el.a[0] + dx, p.el.a[1] + dy]; if (p.el.b) p.el.b = [p.el.b[0] + dx, p.el.b[1] + dy]; p.sal.forEach((s) => { s.p = [s.p[0] + dx, s.p[1] + dy]; s.x += dx; }); p.y1 = p.caja.y1 + dy; };
  let cur = pl ? pl.x1 + 3 * G : 0, yFondo = yFila;
  if (pl) mover(pl, 0, 0);
  planes.forEach((p, k) => {
    const pegado = p.el.pegado && k > 0, dx = pegado ? planes[k - 1].el[planes[k - 1].el.pIzq === nombres(planes[k - 1].el, 'esq')[0] ? 'b' : 'a'][0] + 2 * G - 0 : g20(cur - p.x0, 'ceil');
    mover(p, dx, yFila - p.caja.y0 + (D(p.el).n === 2 ? 0 : 0)); cur = p.x1 + dx + 3 * G; yFondo = Math.max(yFondo, p.y1);
    if (pegado) { const ant = planes[k - 1].el, q = ant[ant.pIzq === nombres(ant, 'esq')[0] ? 'b' : 'a']; cables.push(cab(q, [q[0] + 2 * G, q[1]], 'negro')); }
  });
  // las de dos patas quedan todas a la misma altura
  const y2 = Math.max(yFila + 2 * G, ...planes.filter((p) => D(p.el).n === 2).map((p) => p.el.a[1]));
  planes.forEach((p) => { if (D(p.el).n === 2 && p.el.a[1] !== y2) { const dy = y2 - p.el.a[1]; mover(p, 0, dy); yFondo = Math.max(yFondo, p.y1); } });
  cables.forEach((c) => { c.a[1] = c.b[1] = y2; });
  const yMasa = g20(yFondo, 'ceil') + 2 * G;
  // 4. Cables: salida de cada pata, tramo vertical hasta su pista y la pista
  const enPista = new Map();
  (pl ? [pl] : []).concat(planes).forEach((p) => p.sal.forEach((s) => {
    const y = s.red.clase === '-' ? yMasa : yDe.get(s.red); if (y == null) return;
    const color = s.red.clase[0] === '+' ? 'rojo' : 'negro';
    if (s.x !== s.p[0]) cables.push(cab(s.p, [s.x, s.p[1]], color));
    cables.push(cab([s.x, s.p[1]], [s.x, y], color));
    if (!enPista.has(s.red)) enPista.set(s.red, { y, xs: [], color }); enPista.get(s.red).xs.push(s.x);
  }));
  enPista.forEach((t) => { const a = Math.min(...t.xs), b = Math.max(...t.xs); if (b > a) cables.push(cab([a, t.y], [b, t.y], t.color)); });
  N.els.forEach((el) => { delete el.pIzq; delete el.pDer; delete el.pegado; });
  return { els: N.els.concat(cables), fuera: N.fuera, sinPata: N.sinPata };
}

function generar(desde = vista, sinPreguntar) {
  const hacia = OTRA[desde];
  if (!sinCables(desde).length) { estado('No hay nada dibujado en ' + VISTA_TXT[desde] + '.', true); return null; }
  if (!sinPreguntar && E[hacia].els.length && !confirm('Se reemplaza el dibujo ' + DE_VISTA[hacia] + ' por uno generado a partir ' + DE_VISTA[desde] + '. ¿Seguir?')) return null;
  const guardada = vista; vista = desde; let r;
  try { r = desde === 'esq' ? aProtoboard() : aEsquematico(); } finally { vista = guardada; }
  marcar();
  E[hacia].els = r.els; if (hacia === 'proto') { E.proto.cols = r.cols; $('#s-cols').value = String(r.cols); }
  V[hacia].listo = false; cambiarVista(hacia); cambio();
  const v = vinculo(), n = r.els.filter((e) => e.c !== 'cable').length, lista = (l) => [...new Set(l)].join(', ');
  const msj = (hacia === 'proto' ? 'Protoboard generada' : 'Esquemático generado') + ': ' + n + ' componente' + (n === 1 ? '' : 's') + (v.igual ? ', mismas conexiones ✓' : '') + '.' +
    (r.fuera.length ? ' No van en ' + VISTA_TXT[hacia] + ': ' + lista(r.fuera) + '.' : '') + (r.sinPata.length ? ' Sin pata en ' + VISTA_TXT[hacia] + ': ' + lista(r.sinPata) + '.' : '') + (v.igual === false ? ' Revisá el indicador «Vistas distintas».' : '');
  estado(msj, v.igual === false);
  // La barra de estado es angosta: el resultado se lee entero un rato en la línea de ayuda del lienzo
  const pista = $('#pista'), antes = pista.textContent; pista.textContent = msj; pista.classList.add('fuerte');
  setTimeout(() => { pista.classList.remove('fuerte'); if (pista.textContent === msj) pista.textContent = antes; }, 9000);
  return v;
}
function pintarVinculo() {   // indicador permanente junto a las pestañas
  const v = vinculo(), b = $('#b-vinc'), m = $('#m-vinc');
  $('#b-generar').textContent = vista === 'esq' ? 'Generar protoboard →' : '← Generar esquemático';
  $('#b-generar').disabled = !sinCables(vista).length;
  b.hidden = v.vacio; if (v.vacio) { m.hidden = true; return; }
  b.textContent = v.igual ? 'Vistas iguales ✓' : 'Vistas distintas'; b.classList.toggle('act', !v.igual);
  b.title = v.igual ? 'El esquemático y la protoboard tienen las mismas conexiones.' : v.difs.slice(0, 6).join('\n');
  m.innerHTML = v.igual ? '<div class="vinc-ok">✓ El esquemático y la protoboard tienen los mismos componentes y las mismas conexiones.</div>'
    : '<div class="vinc-t">Qué difiere</div>' + v.difs.slice(0, 12).map((t) => `<div class="vinc-d">${esc(t)}</div>`).join('') + (v.difs.length > 12 ? `<div class="vinc-d">… y ${v.difs.length - 12} más.</div>` : '') +
      '<div class="vinc-p">Para dejarlas iguales, generá una vista a partir de la otra.</div>';
}
$('#b-generar').onclick = async () => { if (vista === 'esq' && real() && !wokwiListo()) { estado('Cargando los dibujos…'); await asegurarArte(); } generar(vista); };
$('#b-vinc').onclick = () => { $('#m-vinc').hidden = !$('#m-vinc').hidden; };

/* ---------- Barra ---------- */
function cambiarVista(v) {
  vista = v; sel = new Set(); pend = null; pinSel = null; compMirado = null; resFijo = resHover = resalte = null;
  $('#tab-esq').classList.toggle('act', v === 'esq'); $('#tab-proto').classList.toggle('act', v === 'proto');
  $('#grilla').style.display = v === 'esq' ? '' : 'none'; $('#s-res').hidden = v !== 'esq'; $('#s-cols').hidden = v !== 'proto'; $('#p-estilo').hidden = v !== 'proto';
  if (v === 'proto' && real()) asegurarArte();
  if (herr !== 'sel' && !(COMP.get(herr) && COMP.get(herr)[v])) herr = 'sel';
  catalogo(); herramienta(herr); pintar(); inspector(); verVista();
  if (!V[v].listo) { V[v].listo = true; encuadrar(); }
  revisarAhora();
}
$('#tab-esq').onclick = () => cambiarVista('esq'); $('#tab-proto').onclick = () => cambiarVista('proto');
// Dibujos de Wokwi Elements: se cargan una sola vez, al entrar por primera vez a la protoboard realista
let arteP = null;
function asegurarArte() {
  if (!arteP) arteP = cargarWokwi($('#defs-arte')).then((ok) => {
    if (ok) { cacheReal.clear(); if (vista === 'proto') { catalogo(); pintar(); inspector(); if (!V.proto.tocado) encuadrar(); } }
    else if (real()) { ponerEstilo('linea', true); estado('No se pudieron cargar los dibujos realistas: la protoboard queda en estilo Línea.', true); }
    return ok;
  });
  return arteP;
}
function ponerEstilo(e, sinRecordar) {
  estilo = e === 'linea' ? 'linea' : 'real';
  if (!sinRecordar) try { localStorage.setItem(CLAVE_ESTILO, estilo); } catch (er) {}
  $('#e-real').classList.toggle('act', real()); $('#e-linea').classList.toggle('act', !real());
  if (vista === 'proto') { if (real()) asegurarArte(); catalogo(); inspector(); }
  cambio();
}
$('#e-real').onclick = () => ponerEstilo('real'); $('#e-linea').onclick = () => ponerEstilo('linea');
$('#h-sel').onclick = () => { herramienta('sel'); inspector(); }; $('#h-cable').onclick = () => { herramienta(herr === 'cable' ? 'sel' : 'cable'); inspector(); };
$('#h-deshacer').onclick = () => volver(hist, futuro); $('#h-rehacer').onclick = () => volver(futuro, hist);
$('#h-encuadrar').onclick = encuadrar;
$('#s-res').onchange = (e) => { marcar(); E.resEstilo = e.target.value; cambio(); catalogo(); };
$('#s-cols').onchange = (e) => {   // al achicar la placa, las huellas fijas vuelven a entrar
  marcar(); E.proto.cols = +e.target.value === 60 ? 60 : 30;
  E.proto.els.forEach((el) => { const d = def(el, 'proto'); if (d.ancla) el.a = d.ancla(el.a, el); });
  cambio(); encuadrar();
};
{ let marcado = false; $('#n-circ').oninput = (e) => { if (!marcado) { marcar(); marcado = true; } E.titulo = e.target.value; cambio(); }; $('#n-circ').onblur = () => { marcado = false; }; }
window.addEventListener('resize', () => pintarSobre());
document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.con-menu')) { $('#m-ej').hidden = true; $('#m-vinc').hidden = true; } });

/* ---------- Inicio ---------- */
if (EMBED) { $('#b-insertar').hidden = false; $('#b-abrir').hidden = true; $('#b-guardar').hidden = true; $('#b-sitio').hidden = true; $('#marca').classList.add('sola'); }   // dentro del protocolo no se sale del editor
try { const g = localStorage.getItem(CLAVE); if (g) { const o = JSON.parse(g); if (o && (o.estilo === 'linea' || o.estilo === 'real')) estilo = o.estilo; E = limpiar(o); if (E.esq.els.length || E.proto.els.length) estado('Se recuperó el circuito en el que estabas trabajando.'); } } catch (e) {}
$('#n-circ').value = E.titulo; $('#s-res').value = E.resEstilo; $('#s-cols').value = String(colsP()); botonesHist();
$('#e-real').classList.toggle('act', real()); $('#e-linea').classList.toggle('act', !real());
cambiarVista('esq');
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { catalogo(); pintar(); });

/* ---------- Sensores de la extensión FisicaBit de MakeCode ----------
   Se leen de la extensión (copia del sitio y, si hay red, GitHub). Los que ya están en la base toman su dibujo;
   los que no, se agregan solos al catálogo con lo que la extensión dice de ellos. */
function compAuto(pt) {
  const izq = pt.pines.filter((q) => q.rol === 'vcc' || q.rol === 'gnd').map((q) => q.n), der = pt.pines.filter((q) => q.rol !== 'vcc' && q.rol !== 'gnd').map((q) => q.n);
  return { id: 'fb-' + pt.id, nombre: pt.titulo, cat: 'sensores', alias: 'makecode fisicabit extension sensor ' + pt.id, tk: false, pref: 'U', parte: pt.id, auto: true,
    desc: 'Sensor de la extensión FisicaBit de MakeCode. Se dibuja igual que en el simulador.', datos: [],
    pines: pt.pines.map((q) => (q.rol === 'vcc' ? { n: q.n, rol: 'vcc', v: [3, 3.6], i: 10 } : q.rol === 'gnd' ? { n: q.n, rol: 'gnd' } : { n: q.n, rol: q.rol === 'io' ? 'io' : 'pas' })),
    esq: { f: 'bloque', txt: pt.titulo, izq, der }, proto: { f: 'modulo', txt: pt.titulo, w: Math.max(60, pt.pines.length * G + 20), h: 44 } };
}
let parteInicial = new URLSearchParams(location.search).get('parte');
function alLlegarPartes() {
  verPartes++; cacheReal.clear();
  partes().forEach((pt) => {
    if (LISTA.some((c) => c.parte === pt.id && !c.auto)) return;
    const c = compAuto(pt), viejo = COMP.get(c.id);
    if (viejo) { Object.assign(viejo, c); cacheDef.delete(c.id + '|esq'); cacheDef.delete(c.id + '|proto'); } else { COMP.set(c.id, c); LISTA.push(c); }
  });
  catalogo(); pintar(); inspector(); pintarEjemplos();
  if (parteInicial && compDeParte(parteInicial)) { const pid = parteInicial; parteInicial = null; armarParte(pid); }   // llegó desde MakeCode: «Ver el circuito»
}
cargarPartes(alLlegarPartes);

// Para pruebas y para la página que la incrusta
const aVista = (v) => (v === 'protoboard' || v === 'proto' ? 'proto' : v === 'esquematico' || v === 'esq' ? 'esq' : vista);
window.__circuitos = {
  get estado() { return E; }, get vista() { return vista; }, get elegido() { return [...sel][0] || null; }, get elegidos() { return [...sel]; }, get pin() { return pinSel; },
  exportarPNG: (v) => exportarPNG(aVista(v)), exportarSVG: (v) => { const r = svgDe(aVista(v)); return r ? r.svg : null; },
  cargar, cambiarVista, encuadrar, bandas, leerOhm, textoOhm,
  get estilo() { return estilo; }, ponerEstilo, arteListo: () => asegurarArte(), cajaDom,
  // cuánto se aparta de su agujero la peor pata del dibujo de Wokwi de un componente (null si no usa uno o no se ajusta por patas)
  ajuste: (id, rot) => { const c = COMP.get(id), r = c && c.proto ? realDe(c) : null, d = c && c.proto ? defDe(c, 'proto') : null; if (!r || !r.wokwi || !r.resto) return null; const el = { c: id, a: d.ancla ? d.ancla([240, 220]) : [240, 220], b: [260, 220], rot: rot ? 1 : 0 }; return N(r.resto(el, d.n === 2 ? [el.a, el.b] : d.term(el))); },
  usaWokwi: (id) => { const c = COMP.get(id), r = c && c.proto ? realDe(c) : null; return !!(r && r.wokwi); },
  miniatura: (id, v = vista) => { const c = COMP.get(id), ant = vista; if (!c || !c[v]) return null; vista = v; try { return icono(c); } finally { vista = ant; } },
  vinculo, generar: (desde, sinPreguntar) => generar(aVista(desde), sinPreguntar), redesTodas: (v) => redes(aVista(v), true),
  redes: (v) => redes(aVista(v)), avisos: () => { revisarAhora(); return avisos; }, buscar: (t) => buscar(t, vista).map((c) => c.id),
  componentes: () => LISTA.map((c) => c.id), ejemplo: (i) => cargar(EJEMPLOS[i].hacer()), ejemplos: EJEMPLOS.map((x) => x.nombre),
  partes, ejemploParte, armarParte: (pid) => { const o = ejemploParte(pid); if (o) { cargar(o); cambiarVista('proto'); } return !!o; }, partesListas: () => cargarPartes(),
  pata: (id, n) => { const el = porId(id); if (!el) return null; const i = nombres(el).indexOf(n); return i < 0 ? null : terminales(el)[i]; },
  patas: (id) => { const el = porId(id); return el ? nombres(el).map((n, i) => ({ n, p: terminales(el)[i] })) : []; },
  nombresBandas: (ohm, tol = 5) => { const b = bandas(ohm); return [BANDA[b.d1][0], BANDA[b.d2][0], colorMult(b.m)[0], colorTol(tol)[0]]; },
  aPantalla: (p, v = vista) => { const o = svg.getBoundingClientRect(); return [o.left + V[v].x + p[0] * V[v].k, o.top + V[v].y + p[1] * V[v].k]; },
  agujero: hoyo,
};
