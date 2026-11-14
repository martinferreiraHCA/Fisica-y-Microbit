// Editor de circuitos de fisicabit: un esquemático y una protoboard, dibujados en SVG.
// Todo elemento de dos terminales se crea entre dos puntos (A y B): el símbolo queda
// centrado y los terminales se estiran. Dibujo en blanco y negro; el único color son
// las bandas de las resistencias y los cables.

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const N = (n) => Math.round(n * 100) / 100;
const uid = () => Math.random().toString(36).slice(2, 9);
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
const caja = (x, y, w, h, rx = 0, fill = '#fff', sw = 2) => `<rect x="${N(x)}" y="${N(y)}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="#111" stroke-width="${sw}"/>`;
// Texto: o = { t: tamaño, w: peso, a: anclaje, c: color, deg: giro del grupo (para dejarlo derecho), halo: borde blanco }
function txt(s, x, y, o = {}) {
  const t = o.t || 11, giro = o.deg ? ` transform="rotate(${N(-o.deg)} ${N(x)} ${N(y)})"` : '';
  return `<text x="${N(x)}" y="${N(y + t * 0.36)}" font-family="Montserrat, Arial, sans-serif" font-size="${t}" font-weight="${o.w || 600}" fill="${o.c || '#111'}" text-anchor="${o.a || 'middle'}"${o.halo ? ' stroke="#fff" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke"' : ''}${giro}>${esc(s)}</text>`;
}
const pin = (x, y) => `<rect x="${N(x - 2.6)}" y="${N(y - 2.6)}" width="5.2" height="5.2" fill="#111"/>`;
const borne = (x, y) => `<circle cx="${N(x)}" cy="${N(y)}" r="4" fill="#fff" stroke="#111" stroke-width="1.6"/>`;

/* ---------- Componentes del esquemático ----------
   n: 2 = entre dos puntos · 1 = un punto. s = medio largo del símbolo; arr / aba = alto del símbolo
   hacia cada lado (para ubicar el rótulo). d(el, deg) dibuja el símbolo centrado en el origen. */
const RES_IEC = caja(-20, -7, 40, 14);
const RES_ZZ = linea('M-20,0 L-16.7,-7 L-10,7 L-3.3,-7 L3.3,7 L10,-7 L16.7,7 L20,0');
const resEsq = () => (E.resEstilo === 'zigzag' ? RES_ZZ : RES_IEC);
const flecha = (x1, y1, x2, y2, sw = 1.6) => {   // línea con punta abierta en (x2, y2)
  const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, p = 5;
  return linea(`M${x1},${y1} L${x2},${y2} M${N(x2 - ux * p - uy * p * 0.6)},${N(y2 - uy * p + ux * p * 0.6)} L${x2},${y2} L${N(x2 - ux * p + uy * p * 0.6)},${N(y2 - uy * p - ux * p * 0.6)}`, sw);
};
const medidor = (letraM) => ({ n: 2, s: 13, arr: 14, aba: 14, d: (el, deg) => circ(13) + txt(letraM, 0, 0, { t: 13, w: 800, deg }) });
const ESQ = {
  cable: { nombre: 'Cable', n: 2, s: 0, arr: 2, aba: 2, d: () => '' },
  resistencia: { nombre: 'Resistencia', pref: 'R', valor: '220 Ω', ohm: 220, n: 2, s: 20, arr: 8, aba: 8, d: () => resEsq() },
  pila: { nombre: 'Pila', pref: 'B', valor: '1,5 V', pol: 1, n: 2, s: 4, arr: 13, aba: 13, d: (el, deg) => linea('M-4,-12 V12') + linea('M4,-6 V6', 4.5) + txt('+', -13, -11, { t: 12, w: 700, deg }) },
  bateria: { nombre: 'Batería', pref: 'B', valor: '3 V', pol: 1, n: 2, s: 9, arr: 13, aba: 13, d: (el, deg) => linea('M-9,-12 V12 M3,-12 V12') + linea('M-3,-6 V6 M9,-6 V6', 4.5) + txt('+', -18, -11, { t: 12, w: 700, deg }) },
  fuente: { nombre: 'Fuente CC', pref: 'V', valor: '5 V', pol: 1, n: 2, s: 14, arr: 15, aba: 15, d: (el, deg) => circ(14) + txt('+', -6, 0, { t: 12, w: 700, deg }) + txt('−', 6.5, 0, { t: 12, w: 700, deg }) },
  led: { nombre: 'LED', pref: 'LED', pol: 1, n: 2, s: 8, arr: 22, aba: 9, d: () => forma('M-8,-8 V8 L8,0 Z') + linea('M8,-8 V8') + flecha(-2, -12, 4, -20) + flecha(5, -12, 11, -20) },
  diodo: { nombre: 'Diodo', pref: 'D', pol: 1, n: 2, s: 8, arr: 9, aba: 9, d: () => forma('M-8,-8 V8 L8,0 Z') + linea('M8,-8 V8') },
  lampara: { nombre: 'Lámpara', pref: 'L', n: 2, s: 12, arr: 13, aba: 13, d: () => circ(12) + linea('M-8.5,-8.5 L8.5,8.5 M-8.5,8.5 L8.5,-8.5') },
  interruptor: { nombre: 'Interruptor', pref: 'S', n: 2, s: 14, arr: 13, aba: 4, d: (el) => linea(el.cerrado ? 'M-14,0 L14,0' : 'M-14,0 L11,-12') + circ(2.6, -14, 0) + circ(2.6, 14, 0) },
  pulsador: { nombre: 'Pulsador', pref: 'S', n: 2, s: 12, arr: 17, aba: 4, d: () => linea('M-15,-7 H15 M0,-7 V-15 M-6,-15 H6') + circ(2.6, -12, 0) + circ(2.6, 12, 0) },
  capacitor: { nombre: 'Capacitor', pref: 'C', valor: '100 µF', n: 2, s: 4, arr: 13, aba: 13, d: () => linea('M-4,-12 V12 M4,-12 V12') },
  potenciometro: { nombre: 'Potenciómetro', pref: 'P', valor: '10 kΩ', n: 2, s: 20, arr: 15, aba: 15, d: () => resEsq() + flecha(-14, 14, 14, -14) },
  ldr: { nombre: 'LDR', pref: 'LDR', n: 2, s: 20, arr: 24, aba: 8, d: () => resEsq() + flecha(-14, -23, -7, -11) + flecha(-3, -23, 4, -11) },
  termistor: { nombre: 'Termistor', pref: 'NTC', n: 2, s: 20, arr: 15, aba: 14, d: () => resEsq() + linea('M-17,13 H-10 L12,-14', 1.6) },
  amperimetro: Object.assign(medidor('A'), { nombre: 'Amperímetro' }),
  voltimetro: Object.assign(medidor('V'), { nombre: 'Voltímetro' }),
  motor: Object.assign(medidor('M'), { nombre: 'Motor' }),
  zumbador: { nombre: 'Zumbador', pref: 'BZ', n: 2, s: 10.4, arr: 7, aba: 7, d: () => forma('M-12,6 A12,12 0 0 1 12,6 Z') },
  tierra: { nombre: 'Tierra', n: 1, term: (el) => [el.a],
    d: (el) => `<g transform="translate(${el.a[0]},${el.a[1]})"><rect x="-13" y="-2" width="26" height="25" fill="#000" fill-opacity="0"/>${linea('M0,0 V10 M-12,10 H12 M-8,15 H8 M-4,20 H4')}</g>` },
  texto: { nombre: 'Texto', valor: 'Texto', n: 1, term: () => [], d: (el) => txt(el.valor || 'Texto', el.a[0], el.a[1], { t: 13, a: 'start' }) },
  microbit: { nombre: 'micro:bit', n: 1, term: (el) => [1, 2, 3, 4, 5].map((i) => [el.a[0] + G * i, el.a[1] + 100]),
    d: (el) => {
      const [x, y] = el.a;
      return caja(x, y, 120, 80, 6) + txt('micro:bit', x + 60, y + 32, { t: 13, w: 800 }) +
        ['P0', 'P1', 'P2', '3V', 'GND'].map((p, i) => linea(`M${x + G * (i + 1)},${y + 80} V${y + 100}`) + txt(p, x + G * (i + 1), y + 70, { t: 8, w: 700 })).join('');
    } },
};

/* ---------- Protoboard: geometría ---------- */
const COLS = 30, colX = (c) => 40 + (c - 1) * G;
const FILAS = { a: 80, b: 100, c: 120, d: 140, e: 160, f: 220, g: 240, h: 260, i: 280, j: 300 };
const RIELES = [20, 40, 340, 360];   // +, −, +, −
const AGUJEROS = [];
for (let c = 1; c <= COLS; c++) Object.values(FILAS).forEach((y) => AGUJEROS.push([colX(c), y]));
for (let c = 2; c <= COLS; c++) if ((c - 2) % 6 !== 5) RIELES.forEach((y) => AGUJEROS.push([colX(c), y]));
const PLACA = (() => {
  let s = caja(0, -10, 660, 400, 9) + `<rect x="12" y="181" width="636" height="18" rx="3" fill="#f1f1f1" stroke="#999" stroke-width="1"/>`;
  [[9, 51], [329, 371]].forEach(([y1, y2]) => { s += `<path d="M52,${y1} H628 M52,${y2} H628" fill="none" stroke="#9a9a9a" stroke-width="1"/>`; });
  RIELES.forEach((y, k) => { const sg = k % 2 ? '−' : '+'; s += txt(sg, 22, y, { t: 13, w: 700 }) + txt(sg, 638, y, { t: 13, w: 700 }); });
  Object.entries(FILAS).forEach(([l, y]) => { s += txt(l, 22, y, { t: 9, c: '#555' }) + txt(l, 638, y, { t: 9, c: '#555' }); });
  [1, 5, 10, 15, 20, 25, 30].forEach((c) => { s += txt(c, colX(c), 66, { t: 8, c: '#555' }) + txt(c, colX(c), 314, { t: 8, c: '#555' }); });
  s += AGUJEROS.map(([x, y]) => `<rect x="${x - 2.6}" y="${y - 2.6}" width="5.2" height="5.2" fill="#fff" stroke="#6d6d6d" stroke-width="1"/>`).join('');
  return `<g pointer-events="none">${s}</g>`;
})();

/* ---------- Componentes de la protoboard ----------
   n: 2 = dos patas · 'fijo' = huella fija sobre agujeros · 'libre' = fuera de la placa. */
function cuerpoRes(el) {   // cuerpo con sus 4 bandas de color
  const b = bandas(el.ohm || 0), cols = [BANDA[b.d1][1], BANDA[b.d2][1], colorMult(b.m)[1], colorTol(el.tol || 5)[1]];
  return caja(-22, -7, 44, 14, 6, '#fff', 1.6) + [-15.5, -8.5, -1.5, 11.5].map((x, i) => `<rect x="${x}" y="-6.2" width="4.6" height="12.4" fill="${cols[i]}" stroke="#111" stroke-width="0.5"/>`).join('');
}
const PROTO = {
  cable: { nombre: 'Cable puente', n: 2 },
  resistencia: { nombre: 'Resistencia', valor: '220 Ω', ohm: 220, n: 2, alto: 10, d: (el) => cuerpoRes(el) },
  led: { nombre: 'LED', pol: 1, n: 2, alto: 12, d: () => forma('M7,-5.66 A9,9 0 1 0 7,5.66 Z', '#fff', 1.6) + circ(4.5, -0.6, 0, 'none', 1) },
  capacitor: { nombre: 'Capacitor', pol: 1, n: 2, alto: 13, d: () => circ(10, 0, 0, '#fff', 1.6) + `<path d="M5,-8.66 A10,10 0 0 1 5,8.66 Z" fill="#111"/>` },
  diodo: { nombre: 'Diodo', pol: 1, n: 2, alto: 8, d: () => caja(-13, -5, 26, 10, 2, '#fff', 1.6) + `<rect x="6.5" y="-5" width="3.6" height="10" fill="#111"/>` },
  ldr: { nombre: 'LDR', n: 2, alto: 13, d: () => circ(10, 0, 0, '#fff', 1.6) + linea('M-6,-5 H6 V-1.7 H-6 V1.7 H6 V5 H-6', 1.2) },
  zumbador: { nombre: 'Zumbador', pol: 1, n: 2, alto: 17, d: (el, deg) => circ(14, 0, 0, '#fff', 1.6) + circ(3, 0, 0, '#fff', 1.4) + txt('+', -9, 0, { t: 9, w: 700, deg }) },
  pulsador: { nombre: 'Pulsador', n: 'fijo', term: (el) => { const [x, y] = el.a; return [[x, y], [x + 2 * G, y], [x, y + 3 * G], [x + 2 * G, y + 3 * G]]; },
    d: (el) => { const [x, y] = el.a; return PROTO.pulsador.term(el).map((p) => pin(p[0], p[1])).join('') + linea(`M${x},${y} V${y + 6} M${x + 40},${y} V${y + 6} M${x},${y + 60} V${y + 54} M${x + 40},${y + 60} V${y + 54}`, 1.6) + caja(x - 5, y + 5, 50, 50, 3, '#fff', 1.6) + circ(11, x + 20, y + 30, '#fff', 1.6); } },
  potenciometro: { nombre: 'Potenciómetro', valor: '10 kΩ', n: 'fijo', term: (el) => [0, 1, 2].map((i) => [el.a[0] + G * i, el.a[1]]),
    d: (el) => { const [x, y] = el.a; return [0, 1, 2].map((i) => linea(`M${x + G * i},${y} V${y - 8}`, 1.6) + pin(x + G * i, y)).join('') + caja(x - 5, y - 52, 50, 46, 3, '#fff', 1.6) + circ(14, x + 20, y - 29, '#fff', 1.6) + linea(`M${x + 12},${y - 21} L${x + 28},${y - 37}`, 2.4); } },
  portapilas: { nombre: 'Portapilas', n: 'libre', term: (el) => [[el.a[0] + 150, el.a[1] + 20], [el.a[0] + 150, el.a[1] + 40]],
    d: (el) => {
      const [x, y] = el.a, cable = (yy, c) => `<path d="M${x + 120},${yy} H${x + 150}" stroke="#111" stroke-width="5" stroke-linecap="round"/><path d="M${x + 120},${yy} H${x + 150}" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`;
      return cable(y + 20, CABLES.rojo) + cable(y + 40, CABLES.negro) + caja(x, y, 120, 60, 5) +
        caja(x + 9, y + 8, 94, 19, 3, '#fff', 1.4) + caja(x + 103, y + 13, 5, 9, 1, '#fff', 1.4) + caja(x + 17, y + 33, 94, 19, 3, '#fff', 1.4) + caja(x + 12, y + 38, 5, 9, 1, '#fff', 1.4) +
        txt('+', x + 94, y + 17.5, { t: 11, w: 700 }) + txt('−', x + 20, y + 17.5, { t: 11, w: 700 }) + txt('+', x + 27, y + 42.5, { t: 11, w: 700 }) + txt('−', x + 101, y + 42.5, { t: 11, w: 700 }) +
        txt('+', x + 136, y + 9, { t: 12, w: 700 }) + txt('−', x + 136, y + 52, { t: 12, w: 700 }) + borne(x + 150, y + 20) + borne(x + 150, y + 40);
    } },
  // «arriba»: el conector de borde mira hacia arriba (cómodo cuando la placa va debajo de la protoboard)
  microbit: { nombre: 'micro:bit', n: 'libre', term: (el) => [30, 70, 110, 150, 190].map((px) => (el.arriba ? [el.a[0] + 220 - px, el.a[1] + 20] : [el.a[0] + px, el.a[1] + 150])),
    d: (el) => {
      const deg = el.arriba ? 180 : 0; let s = caja(0, 0, 220, 170, 14);
      s += `<rect x="95" y="11" width="30" height="15" rx="7.5" fill="none" stroke="#111" stroke-width="1.4"/><circle cx="104" cy="18.5" r="1.7" fill="#111"/><circle cx="116" cy="18.5" r="1.7" fill="#111"/>`;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) s += `<rect x="${110 - 2.5 + (i - 2) * 14}" y="${40 + j * 15}" width="5" height="9" rx="1.5" fill="#fff" stroke="#111" stroke-width="1"/>`;
      [[29, 'A'], [191, 'B']].forEach(([bx, l]) => { s += caja(bx - 13, 60, 26, 26, 3, '#fff', 1.4) + circ(7, bx, 73, '#fff', 1.4) + txt(l, bx, 50, { t: 10, w: 800, deg }); });
      s += `<path d="M0,128 H220" stroke="#111" stroke-width="1.2"/>`;
      [30, 70, 110, 150, 190].forEach((px, i) => {
        s += caja(px - 13, 133, 26, 37, 0, '#fff', 1.4) + circ(7.5, px, 150, '#fff', 1.6) + txt(['0', '1', '2', '3V', 'GND'][i], px, 121, { t: 9, w: 800, deg });
        if (i < 4) s += `<path d="M${px + 16},140 V170 M${px + 20},140 V170 M${px + 24},140 V170" stroke="#777" stroke-width="1"/>`;
      });
      return `<g transform="translate(${el.a[0]},${el.a[1]})${el.arriba ? ' rotate(180 110 85)' : ''}">${s}</g>`;
    } },
  motor: { nombre: 'Motor', n: 'libre', term: (el) => [[el.a[0] - 10, el.a[1] + 40], [el.a[0] + 10, el.a[1] + 40]],
    d: (el) => { const [x, y] = el.a; return linea(`M${x - 10},${y + 20} V${y + 40} M${x + 10},${y + 20} V${y + 40}`, 1.6) + caja(x - 3.5, y - 35, 7, 13, 1, '#fff', 1.6) + circ(24, x, y) + txt('M', x, y, { t: 15, w: 800 }) + borne(x - 10, y + 40) + borne(x + 10, y + 40); } },
};
const T = { esq: ESQ, proto: PROTO };

/* ---------- Estado ---------- */
const vacio = () => ({ titulo: '', resEstilo: 'iec', esq: { els: [] }, proto: { els: [] } });
let E = vacio();
let vista = 'esq', sel = null, herr = 'sel', pend = null, arr = null, espacio = false;
const V = { esq: { x: 0, y: 0, k: 1 }, proto: { x: 0, y: 0, k: 1 } };
const colorNuevo = { esq: 'negro', proto: 'rojo' };
const hist = [], futuro = [];
const els = () => E[vista].els;
const elSel = () => els().find((e) => e.id === sel) || null;
const def = (el, v = vista) => T[v][el.t];
const terminales = (el, v = vista) => (def(el, v).n === 2 ? [el.a, el.b] : def(el, v).term(el));
const igual = (p, q) => Math.abs(p[0] - q[0]) < 0.5 && Math.abs(p[1] - q[1]) < 0.5;
function estado(t, err) { const e = $('#estado'); e.textContent = t; e.className = err ? 'err' : ''; }

/* ---------- Dibujo de un elemento ---------- */
function rotulos(el, v, d, deg) {
  const t1 = el.rotulo || '', t2 = v === 'esq' && el.t !== 'cable' ? el.valor || '' : '';
  if (!t1 && !t2) return '';
  const [ax, ay] = el.a, [bx, by] = el.b, L = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / L, uy = (by - ay) / L;
  const mx = (ax + bx) / 2, my = (ay + by) / 2, horiz = Math.abs(ux) >= Math.abs(uy);
  let nx = -uy, ny = ux;
  if (horiz ? ny > 0 : nx < 0) { nx = -nx; ny = -ny; }   // horizontal: arriba · vertical: a la derecha
  const haciaArr = nx * uy - ny * ux > 0;   // ¿la normal elegida apunta al «arriba» del símbolo?
  const alto = v === 'proto' ? d.alto || 6 : null;
  const h1 = (alto != null ? alto : haciaArr ? d.arr : d.aba) + (Math.abs(ux * uy) > 0.2 ? 6 : 0), h2 = alto != null ? alto : haciaArr ? d.aba : d.arr;
  const halo = v === 'proto';
  if (horiz) return (t1 ? txt(t1, mx + nx * (h1 + 9), my + ny * (h1 + 9), { t: 11, w: 700, halo }) : '') + (t2 ? txt(t2, mx - nx * (h2 + 10), my - ny * (h2 + 10), { t: 10.5 }) : '');
  const x = mx + nx * (h1 + 7), dos = t1 && t2;
  return (t1 ? txt(t1, x, my - (dos ? 7 : 0), { t: 11, w: 700, a: 'start', halo }) : '') + (t2 ? txt(t2, x, my + (dos ? 7 : 0), { t: 10.5, a: 'start' }) : '');
}
function dibujar(el, v, exp) {
  const d = T[v][el.t]; let s;
  if (d.n === 2) {
    const [ax, ay] = el.a, [bx, by] = el.b, L = Math.hypot(bx - ax, by - ay) || 0.01, deg = Math.atan2(by - ay, bx - ax) * 180 / Math.PI, Lr = N(L);
    let dentro;
    if (el.t === 'cable') {
      const c = CABLES[el.color] || CABLES.negro;
      dentro = v === 'esq' ? `<path d="M0,0 H${Lr}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`
        : `<path d="M0,0 H${Lr}" stroke="#111" stroke-width="6.4" stroke-linecap="round"/><path d="M0,0 H${Lr}" stroke="${c}" stroke-width="3.8" stroke-linecap="round"/>`;
    } else if (v === 'esq') {
      const a1 = Math.max(0, L / 2 - d.s);
      dentro = linea(`M0,0 H${N(a1)} M${N(L - a1)},0 H${Lr}`) + `<g transform="translate(${N(L / 2)},0)">${d.d(el, deg)}</g>`;
    } else dentro = linea(`M0,0 H${Lr}`, 1.6) + pin(0, 0) + pin(L, 0) + `<g transform="translate(${N(L / 2)},0)">${d.d(el, deg)}</g>`;
    const toque = exp ? '' : `<path d="M0,0 H${Lr}" stroke="#000" stroke-opacity="0" stroke-width="15" stroke-linecap="round"/>`;
    s = `<g transform="translate(${N(ax)},${N(ay)}) rotate(${N(deg)})">${toque}${dentro}</g>` + rotulos(el, v, d, deg);
  } else {
    s = d.d(el);
    if (v === 'proto' && el.rotulo) { const o = { pulsador: [20, -10], potenciometro: [20, -62], portapilas: [60, -10], microbit: [110, -10], motor: [0, -46] }[el.t]; s += txt(el.rotulo, el.a[0] + o[0], el.a[1] + o[1], { t: 11, w: 700, halo: true }); }
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
  const cables = lista.filter((e) => e.t === 'cable');
  return pts.filter((p) => cuenta.get(p[0] + ',' + p[1]) >= 3 || cables.some((c) => enCable(p, c))).map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.6" fill="#111"/>`).join('');
}
const ORDEN = { libre: 0, fijo: 1, 2: 2 };
function contenido(v, exp) {
  let l = E[v].els;
  if (v === 'proto') l = l.slice().sort((p, q) => (p.t === 'cable' ? 3 : ORDEN[PROTO[p.t].n]) - (q.t === 'cable' ? 3 : ORDEN[PROTO[q.t].n]));
  return (v === 'proto' ? PLACA : '') + l.map((el) => dibujar(el, v, exp)).join('') + (v === 'esq' ? nodos(l) : '');
}

/* ---------- Lienzo ---------- */
const svg = $('#lienzo'), gMundo = $('#mundo'), gCont = $('#g-contenido'), gSobre = $('#g-sobre');
function verVista() { const v = V[vista]; gMundo.setAttribute('transform', `translate(${N(v.x)},${N(v.y)}) scale(${N(v.k * 1000) / 1000})`); }
function pintar() { gCont.innerHTML = contenido(vista, false); pintarSobre(); }
function pintarSobre() {
  const v = V[vista], k = v.k, el = elSel(); let s = '';
  if (el) {
    const g = gCont.querySelector(`[data-id="${el.id}"]`);
    if (g) {
      const r = g.getBoundingClientRect(), o = svg.getBoundingClientRect(), m = 4 / k;
      s += `<rect x="${N((r.left - o.left - v.x) / k - m)}" y="${N((r.top - o.top - v.y) / k - m)}" width="${N(r.width / k + 2 * m)}" height="${N(r.height / k + 2 * m)}" fill="none" stroke="#111" stroke-width="${N(1 / k)}" stroke-dasharray="${N(4 / k)} ${N(3 / k)}" pointer-events="none"/>`;
    }
    if (def(el).n === 2) for (const h of ['a', 'b']) s += `<rect data-h="${h}" x="${N(el[h][0] - 5 / k)}" y="${N(el[h][1] - 5 / k)}" width="${N(10 / k)}" height="${N(10 / k)}" fill="#fff" stroke="#111" stroke-width="${N(1.6 / k)}" style="cursor:move"/>`;
  }
  if (pend) {
    if (!igual(pend.a, pend.b)) s += `<g opacity=".5" pointer-events="none">${dibujar(Object.assign({ id: '_' }, pend.el, { a: pend.a, b: pend.b }), vista, true)}</g>`;
    s += `<circle cx="${pend.a[0]}" cy="${pend.a[1]}" r="${N(4 / k)}" fill="none" stroke="#111" stroke-width="${N(1.4 / k)}" pointer-events="none"/>`;
  }
  gSobre.innerHTML = s;
}
const aMundo = (e) => { const o = svg.getBoundingClientRect(), v = V[vista]; return [(e.clientX - o.left - v.x) / v.k, (e.clientY - o.top - v.y) / v.k]; };
// Ajuste: grilla en el esquemático; agujeros y bornes en la protoboard
function ajustar(p, omitir) {
  if (vista === 'esq') return [Math.round(p[0] / G) * G, Math.round(p[1] / G) * G];
  let mejor = null, dm = 13;
  const probar = (q) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < dm) { dm = d; mejor = q; } };
  AGUJEROS.forEach(probar);
  els().forEach((el) => { if (el.id !== omitir && PROTO[el.t].n === 'libre') PROTO[el.t].term(el).forEach(probar); });
  return mejor ? mejor.slice() : [Math.round(p[0] / 10) * 10, Math.round(p[1] / 10) * 10];
}
function ajustarAncla(t, p) {   // huellas fijas y elementos sueltos
  const d = T[vista][t];
  if (vista === 'esq') return ajustar(p);
  if (d.n === 'libre') return [Math.round(p[0] / 10) * 10, Math.round(p[1] / 10) * 10];
  const c = Math.max(1, Math.min(COLS - 2, Math.round((p[0] - 40) / G) + 1));
  if (t === 'pulsador') return [colX(c), FILAS.e];
  const ys = Object.values(FILAS); let y = ys[0]; ys.forEach((yy) => { if (Math.abs(yy - p[1]) < Math.abs(y - p[1])) y = yy; });
  return [colX(c), y];
}
function encuadrar() {
  const o = svg.getBoundingClientRect(); if (!o.width) return;
  let b = gCont.getBBox();
  if (!b.width && !b.height) b = { x: -260, y: -160, width: 520, height: 320 };
  const m = 46, k = Math.max(0.3, Math.min(vista === 'esq' ? 1.6 : 1.15, (o.width - 2 * m) / b.width, (o.height - 2 * m) / b.height));
  Object.assign(V[vista], { k, x: o.width / 2 - (b.x + b.width / 2) * k, y: o.height / 2 - (b.y + b.height / 2) * k });
  verVista(); pintarSobre();
}

/* ---------- Cambios, deshacer y guardado ---------- */
const datos = () => JSON.stringify({ titulo: E.titulo, resEstilo: E.resEstilo, esq: E.esq, proto: E.proto });
function marcar() { hist.push(datos()); if (hist.length > 80) hist.shift(); futuro.length = 0; botonesHist(); }
function botonesHist() { $('#h-deshacer').disabled = !hist.length; $('#h-rehacer').disabled = !futuro.length; }
let tGuardar = null;
function cambio() { pintar(); clearTimeout(tGuardar); tGuardar = setTimeout(() => { try { localStorage.setItem(CLAVE, datos()); } catch (e) {} }, 400); }
function volver(de, a) {
  if (!de.length) return;
  a.push(datos()); E = Object.assign(vacio(), JSON.parse(de.pop()));
  if (!elSel()) sel = null; pend = null;
  $('#n-circ').value = E.titulo; $('#s-res').value = E.resEstilo; botonesHist(); cambio(); inspector();
}
function limpiar(o) {   // valida un circuito abierto o recuperado
  const e = vacio(); if (!o || typeof o !== 'object') return e;
  e.titulo = typeof o.titulo === 'string' ? o.titulo : ''; e.resEstilo = o.resEstilo === 'zigzag' ? 'zigzag' : 'iec';
  const par = (p) => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number' && isFinite(n));
  for (const v of ['esq', 'proto']) e[v].els = ((o[v] && o[v].els) || []).filter((el) => el && T[v][el.t] && par(el.a) && (T[v][el.t].n !== 2 || par(el.b))).map((el) => Object.assign({}, el, { id: el.id || uid() }));
  return e;
}
function cargar(o) { E = limpiar(o); hist.length = 0; futuro.length = 0; $('#n-circ').value = E.titulo; $('#s-res').value = E.resEstilo; botonesHist(); V.esq.listo = V.proto.listo = false; cambiarVista(vista); cambio(); }

/* ---------- Crear, mover, borrar ---------- */
function rotuloNuevo(t) {
  const p = vista === 'esq' && ESQ[t].pref; if (!p) return '';
  const usados = new Set(els().map((e) => e.rotulo)); let n = 1; while (usados.has(p + n)) n++; return p + n;
}
function nuevo(t) {
  const d = T[vista][t], el = { id: uid(), t, rotulo: rotuloNuevo(t) };
  if (d.valor) el.valor = d.valor;
  if (d.ohm) { el.ohm = d.ohm; el.tol = 5; }
  if (t === 'cable') el.color = colorNuevo[vista];
  return el;
}
function agregar(el) { marcar(); els().push(el); return el; }
function conecta(p, propio) {   // ¿hay otro elemento que llegue a este punto?
  return els().some((el) => el.id !== propio && (terminales(el).some((q) => igual(p, q)) || (el.t === 'cable' && enCable(p, el))));
}
function terminar(b) {
  const p = pend; pend = null;
  if (igual(p.a, b)) { pintarSobre(); return; }
  const el = agregar(Object.assign(p.el, { a: p.a, b }));
  if (el.t === 'cable') {
    if (vista === 'esq' && !conecta(b, el.id)) pend = { el: nuevo('cable'), a: b.slice(), b: b.slice(), modo: 'clic' };   // se sigue trazando
  } else { sel = el.id; herramienta('sel'); }
  cambio(); inspector();
}
function borrar() { const el = elSel(); if (!el) return; marcar(); E[vista].els = els().filter((e) => e.id !== el.id); sel = null; cambio(); inspector(); }
function duplicar() {
  const el = elSel(); if (!el) return;
  const d = def(el), paso = vista === 'proto' && d.n !== 'libre' ? [G, 0] : [G, G], c = JSON.parse(JSON.stringify(el));
  c.id = uid(); c.a = [c.a[0] + paso[0], c.a[1] + paso[1]]; if (c.b) c.b = [c.b[0] + paso[0], c.b[1] + paso[1]];
  if (c.rotulo && vista === 'esq') c.rotulo = rotuloNuevo(c.t) || c.rotulo;
  agregar(c); sel = c.id; cambio(); inspector();
}
function herramienta(h) {
  herr = h; pend = null;
  svg.classList.toggle('crear', h !== 'sel');
  $('#h-sel').classList.toggle('act', h === 'sel'); $('#h-cable').classList.toggle('act', h === 'cable');
  document.querySelectorAll('.comp').forEach((b) => b.classList.toggle('act', b.dataset.t === h));
  const d = T[vista][h];
  $('#pista').textContent = h === 'sel' ? 'Clic: elegir · arrastrar: mover · manijas: mover un extremo · Supr: borrar · Ctrl+D: duplicar · rueda: zoom · botón derecho o barra espaciadora: desplazar'
    : d.n === 2 ? d.nombre + ': arrastrá (o hacé clic y clic) de un punto a otro.' + (h === 'cable' && vista === 'esq' ? ' Sigue trazando hasta Esc o doble clic.' : '') + ' Esc: cancelar.'
    : d.nombre + ': hacé clic donde va.' + (d.n === 'fijo' ? ' Se acomoda sola sobre los agujeros.' : '') + ' Esc: cancelar.';
  pintarSobre();
}

/* ---------- Ratón ---------- */
svg.addEventListener('contextmenu', (e) => e.preventDefault());
svg.addEventListener('pointerdown', (e) => {
  if ($('#m-res').classList.contains('abierto')) return;
  svg.focus({ preventScroll: true });
  const p = aMundo(e);
  if (e.button === 2 || e.button === 1 || espacio) { arr = { tipo: 'vista', x: e.clientX, y: e.clientY, vx: V[vista].x, vy: V[vista].y }; svg.classList.add('mano'); svg.setPointerCapture(e.pointerId); return; }
  if (e.button !== 0) return;
  svg.setPointerCapture(e.pointerId);
  if (herr !== 'sel') {
    const d = T[vista][herr];
    if (d.n !== 2) {   // un clic: tierra, texto, micro:bit, huellas fijas y elementos sueltos
      const el = agregar(Object.assign(nuevo(herr), { a: ajustarAncla(herr, p) }));
      sel = el.id; herramienta('sel'); cambio(); inspector();
      if (el.t === 'texto') { const i = $('#i-valor'); if (i) { i.focus(); i.select(); } }
      return;
    }
    if (pend && pend.modo === 'clic') { terminar(ajustar(p)); return; }
    const a = ajustar(p); pend = { el: nuevo(herr), a, b: a.slice(), modo: 'arrastre', x: e.clientX, y: e.clientY };
    pintarSobre(); return;
  }
  const h = e.target.closest && e.target.closest('[data-h]'), g = e.target.closest && e.target.closest('[data-id]');
  if (h && elSel()) { arr = { tipo: 'extremo', h: h.dataset.h, movido: false }; return; }
  if (g) {
    const yaElegido = sel === g.dataset.id; sel = g.dataset.id; const el = elSel(), d = def(el);
    let pegados = [];   // cables enganchados a un elemento suelto: lo acompañan
    if (vista === 'proto' && d.n === 'libre') { const t = d.term(el); els().forEach((c) => { if (c.t === 'cable') for (const k of ['a', 'b']) if (t.some((q) => igual(q, c[k]))) pegados.push({ c, k, o: c[k].slice() }); }); }
    arr = { tipo: 'mover', p0: p, a: el.a.slice(), b: el.b ? el.b.slice() : null, pegados, movido: false, yaElegido };
    pintarSobre(); inspector(); return;
  }
  sel = null; arr = { tipo: 'vista', x: e.clientX, y: e.clientY, vx: V[vista].x, vy: V[vista].y, fondo: true };
  pintarSobre(); inspector();
});
svg.addEventListener('pointermove', (e) => {
  const p = aMundo(e);
  if (pend) { pend.b = ajustar(p); pintarSobre(); return; }
  if (!arr) return;
  if (arr.tipo === 'vista') { V[vista].x = arr.vx + e.clientX - arr.x; V[vista].y = arr.vy + e.clientY - arr.y; if (arr.fondo) svg.classList.add('mano'); verVista(); return; }
  const el = elSel(); if (!el) return;
  if (arr.tipo === 'extremo') {
    const q = ajustar(p, el.id); if (igual(q, el[arr.h])) return;
    if (!arr.movido) { marcar(); arr.movido = true; }
    el[arr.h] = q; pintar(); return;
  }
  const d = def(el); let dx = p[0] - arr.p0[0], dy = p[1] - arr.p0[1];
  if (d.n === 2) { const q = ajustar([arr.a[0] + dx, arr.a[1] + dy], el.id); dx = q[0] - arr.a[0]; dy = q[1] - arr.a[1]; }
  else { const q = ajustarAncla(el.t, [arr.a[0] + dx, arr.a[1] + dy]); dx = q[0] - arr.a[0]; dy = q[1] - arr.a[1]; }
  if (!arr.movido && !dx && !dy) return;
  if (!arr.movido) { marcar(); arr.movido = true; }
  el.a = [arr.a[0] + dx, arr.a[1] + dy]; if (arr.b) el.b = [arr.b[0] + dx, arr.b[1] + dy];
  arr.pegados.forEach((g) => { g.c[g.k] = [g.o[0] + dx, g.o[1] + dy]; });
  pintar();
});
svg.addEventListener('pointerup', (e) => {
  svg.classList.remove('mano');
  if (pend && pend.modo === 'arrastre') {
    if (Math.hypot(e.clientX - pend.x, e.clientY - pend.y) > 6) terminar(ajustar(aMundo(e))); else pend.modo = 'clic';
    return;
  }
  const a = arr; arr = null; if (!a) return;
  if (a.movido) { cambio(); inspector(); }
  else if (a.tipo === 'mover' && a.yaElegido) { const el = elSel(); if (el && el.t === 'resistencia') abrirRes(); }   // clic sobre una resistencia ya elegida
});
svg.addEventListener('dblclick', (e) => {
  if (pend) { pend = null; pintarSobre(); return; }
  const bajo = document.elementFromPoint(e.clientX, e.clientY), g = bajo && bajo.closest && bajo.closest('#g-contenido [data-id]'); if (!g) return;
  sel = g.dataset.id; const el = elSel(); pintarSobre(); inspector();
  if (el.t === 'resistencia') abrirRes(); else { const i = $('#i-valor') || $('#i-rotulo'); if (i) { i.focus(); i.select(); } }
});
svg.addEventListener('wheel', (e) => {
  e.preventDefault();
  const o = svg.getBoundingClientRect(), v = V[vista], mx = e.clientX - o.left, my = e.clientY - o.top, k = Math.max(0.3, Math.min(5, v.k * Math.exp(-e.deltaY * 0.0015)));
  v.x = mx - (mx - v.x) * k / v.k; v.y = my - (my - v.y) * k / v.k; v.k = k; verVista(); pintarSobre();
}, { passive: false });

/* ---------- Teclado ---------- */
const enCampo = () => /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
window.addEventListener('keydown', (e) => {
  if ($('#m-res').classList.contains('abierto')) { if (e.key === 'Escape') cerrarRes(false); if (e.key === 'Enter') cerrarRes(true); return; }
  const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (ctrl && k === 'z' && !enCampo()) { e.preventDefault(); if (e.shiftKey) volver(futuro, hist); else volver(hist, futuro); return; }
  if (ctrl && k === 'y' && !enCampo()) { e.preventDefault(); volver(futuro, hist); return; }
  if (e.key === 'Escape') { if (enCampo()) document.activeElement.blur(); if (pend) { pend = null; pintarSobre(); } else herramienta('sel'); return; }
  if (enCampo()) return;
  if (ctrl && k === 'd') { e.preventDefault(); duplicar(); return; }
  if (e.key === ' ') { espacio = true; e.preventDefault(); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); borrar(); return; }
  if (k === 'c' && !ctrl) { herramienta('cable'); return; }
  const fl = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] }[k], el = elSel();
  if (fl && el) {
    e.preventDefault(); marcar();
    const d = def(el), paso = vista === 'proto' && d.n === 'libre' ? 10 : G;
    el.a = [el.a[0] + fl[0] * paso, el.a[1] + fl[1] * paso]; if (el.b) el.b = [el.b[0] + fl[0] * paso, el.b[1] + fl[1] * paso];
    if (d.n === 'fijo') el.a = ajustarAncla(el.t, el.a);
    cambio(); inspector();
  }
});
window.addEventListener('keyup', (e) => { if (e.key === ' ') espacio = false; });

/* ---------- Paleta ---------- */
function icono(t) {
  const d = T[vista][t], el = Object.assign({ id: '_', t, a: [0, 0], b: [64, 0], ohm: 220, tol: 5, color: colorNuevo[vista] }, d.valor && t === 'texto' ? { valor: 'Abc' } : {});
  return `<svg xmlns="${NS}" data-ico="1"><g>${dibujar(el, vista, true)}</g></svg>`;
}
function paleta() {
  const box = $('#paleta'); box.innerHTML = '';
  Object.keys(T[vista]).forEach((t) => {
    const b = document.createElement('button'); b.className = 'comp'; b.dataset.t = t; b.innerHTML = icono(t) + `<span>${esc(T[vista][t].nombre)}</span>`;
    b.onclick = () => herramienta(herr === t ? 'sel' : t); box.appendChild(b);
  });
  box.querySelectorAll('svg[data-ico]').forEach((s) => {   // encuadre de cada miniatura
    const b = s.firstChild.getBBox(), m = 3, w = Math.max(b.width, 40), h = Math.max(b.height, 26);
    s.setAttribute('viewBox', `${N(b.x + b.width / 2 - w / 2 - m)} ${N(b.y + b.height / 2 - h / 2 - m)} ${N(w + 2 * m)} ${N(h + 2 * m)}`);
  });
  $('#ayuda-paleta').innerHTML = vista === 'esq'
    ? 'Elegí un componente y <b>arrastrá de un punto a otro</b>: el símbolo queda en el medio y se orienta solo. Los puntos de unión aparecen solos.'
    : 'Elegí un componente y <b>arrastrá de un agujero a otro</b>. El pulsador y el potenciómetro van con un clic; el portapilas, la micro:bit y el motor quedan sueltos y se les enganchan cables.';
}

/* ---------- Inspector ---------- */
function inspector() {
  const box = $('#insp'), el = elSel();
  if (!el) {
    box.innerHTML = `<div class="tit">${vista === 'esq' ? 'Esquemático' : 'Protoboard'}</div><p class="nota">Hacé clic en un elemento para cambiar su rótulo, su valor o su color.</p>
      <p class="nota">${vista === 'esq' ? 'Las <b>resistencias</b> se editan con doble clic: se elige el valor y salen sus bandas de color.' : 'Hacé <b>doble clic en una resistencia</b> para darle el valor: las bandas de color se pintan solas.'}</p>
      <p class="nota">Con <b>Insertar</b> o <b>PNG</b> sale el dibujo de esta pestaña, recortado y sin la grilla.</p>`;
    return;
  }
  const d = def(el), esRes = el.t === 'resistencia', conValor = el.t === 'texto' || (el.t !== 'cable' && (vista === 'esq' ? d.n === 2 : esRes || el.t === 'potenciometro'));
  let h = `<div class="tit">Elemento elegido</div><p class="tipo">${esc(d.nombre)}</p>`;
  if (el.t !== 'texto' && !(vista === 'esq' && d.n === 1)) h += `<label class="c">Rótulo</label><input type="text" id="i-rotulo" value="${esc(el.rotulo || '')}" placeholder="${vista === 'esq' ? 'R1, LED1…' : 'opcional'}">`;
  if (conValor) h += `<label class="c">${el.t === 'texto' ? 'Texto' : 'Valor'}</label><input type="text" id="i-valor" value="${esc(el.valor || '')}" placeholder="con su unidad">`;
  if (esRes) h += `<svg id="i-res" viewBox="0 0 300 92" xmlns="${NS}" style="display:block;width:100%;height:64px;margin-top:8px">${resGrande(el.ohm || 0, el.tol || 5)}</svg><button class="btn ancho" id="i-codigo" style="margin-top:4px">Código de colores…</button>`;
  if (el.t === 'cable') h += `<label class="c">Color del cable</label><div class="colores">${Object.keys(CABLES).map((c) => `<button class="col${(el.color || 'negro') === c ? ' sel' : ''}" data-c="${c}" title="${c}" style="background:${CABLES[c]}"></button>`).join('')}</div>`;
  if (el.t === 'microbit' && vista === 'proto') h += `<label class="chk"><input type="checkbox" id="i-arriba"${el.arriba ? ' checked' : ''}> Conector hacia arriba</label>`;
  if (el.t === 'interruptor') h += `<label class="chk"><input type="checkbox" id="i-cerrado"${el.cerrado ? ' checked' : ''}> Cerrado (deja pasar la corriente)</label>`;
  h += `<div class="grupo-btn">${d.n === 2 && el.t !== 'cable' ? `<button class="btn chico" id="i-invertir" title="Intercambia los dos extremos${d.pol ? ' (cambia la polaridad)' : ''}">Invertir</button>` : ''}<button class="btn chico" id="i-dup">Duplicar</button><button class="btn chico" id="i-borrar">Eliminar</button></div>`;
  if (d.pol && vista === 'proto') h += `<p class="nota" style="margin-top:10px">${el.t === 'led' ? 'El lado plano es el cátodo (−).' : el.t === 'capacitor' ? 'La franja negra marca la pata negativa.' : el.t === 'diodo' ? 'La franja marca el cátodo.' : 'El + marca la pata positiva.'}</p>`;
  box.innerHTML = h;
  const campo = (id, k) => { const i = $(id); if (!i) return; let marcado = false; i.oninput = () => { if (!marcado) { marcar(); marcado = true; } el[k] = i.value; if (k === 'valor' && esRes) { const v = leerOhm(i.value); if (v > 0) el.ohm = v; } cambio(); if (esRes && $('#i-res')) $('#i-res').innerHTML = resGrande(el.ohm || 0, el.tol || 5); }; };
  campo('#i-rotulo', 'rotulo'); campo('#i-valor', 'valor');
  box.querySelectorAll('.col').forEach((b) => { b.onclick = () => { marcar(); el.color = b.dataset.c; colorNuevo[vista] = el.color; cambio(); inspector(); }; });
  if ($('#i-cerrado')) $('#i-cerrado').onchange = (e) => { marcar(); el.cerrado = e.target.checked; cambio(); };
  if ($('#i-arriba')) $('#i-arriba').onchange = (e) => { marcar(); el.arriba = e.target.checked; cambio(); };
  if ($('#i-invertir')) $('#i-invertir').onclick = () => { marcar(); [el.a, el.b] = [el.b, el.a]; cambio(); };
  if ($('#i-codigo')) $('#i-codigo').onclick = abrirRes;
  $('#i-dup').onclick = duplicar; $('#i-borrar').onclick = borrar;
}

/* ---------- Cuadro del código de colores ---------- */
let R = null;   // { ohm, tol, antes }
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
  const el = elSel(); if (!el || el.t !== 'resistencia' || R) return;
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
// SVG autocontenido de una pestaña: fondo blanco, recortado al dibujo, sin grilla
function svgDe(v, css) {
  if (v === 'esq' && !E.esq.els.length) return null;
  const tmp = document.createElementNS(NS, 'svg'), g = document.createElementNS(NS, 'g');
  tmp.style.cssText = 'position:absolute; left:-9999px; top:0; width:10px; height:10px; visibility:hidden';
  const guardada = vista; vista = v; const dentro = contenido(v, true); vista = guardada;
  g.innerHTML = dentro; tmp.appendChild(g); document.body.appendChild(tmp);
  const b = g.getBBox(); tmp.remove();
  const m = 16, x = Math.floor(b.x - m), y = Math.floor(b.y - m), w = Math.ceil(b.width + 2 * m), h = Math.ceil(b.height + 2 * m);
  return { w, h, svg: `<svg xmlns="${NS}" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}">${css ? `<style>${css}</style>` : ''}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>${dentro}</svg>` };
}
// Montserrat incrustada para que el PNG salga con la tipografía del sitio (si no hay red, queda Arial)
let fuenteLista = null;
function fuenteCSS() {
  if (fuenteLista) return fuenteLista;
  const tope = new Promise((r) => setTimeout(() => r(''), 3500));
  const bajar = (async () => {
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
  fuenteLista = Promise.race([bajar, tope]); return fuenteLista;
}
async function exportarPNG(v = vista) {
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

/* ---------- Archivo ---------- */
$('#b-nuevo').onclick = () => { if ((E.esq.els.length || E.proto.els.length) && !confirm('¿Empezar un circuito vacío? Se pierde el actual si no lo guardaste.')) return; cargar(vacio()); estado('Circuito nuevo.'); };
$('#b-guardar').onclick = () => bajar(URL.createObjectURL(new Blob([JSON.stringify(Object.assign({ formato: 'fisicabit-circuito-1' }, JSON.parse(datos())))], { type: 'application/json' })), nombreArchivo() + '.circuito.json');
$('#b-abrir').onclick = () => $('#f-abrir').click();
$('#f-abrir').onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const d = JSON.parse(await f.text()); if (d.formato !== 'fisicabit-circuito-1') throw new Error('no es un circuito de fisicabit'); cargar(d); estado('Circuito abierto: ' + f.name); }
  catch (er) { estado('No se pudo abrir: ' + er.message, true); }
};

/* ---------- Barra ---------- */
function cambiarVista(v) {
  vista = v; sel = null; pend = null;
  $('#tab-esq').classList.toggle('act', v === 'esq'); $('#tab-proto').classList.toggle('act', v === 'proto');
  $('#grilla').style.display = v === 'esq' ? '' : 'none'; $('#s-res').hidden = v !== 'esq';
  paleta(); herramienta('sel'); pintar(); inspector(); verVista();
  if (!V[v].listo) { V[v].listo = true; encuadrar(); }
}
$('#tab-esq').onclick = () => cambiarVista('esq'); $('#tab-proto').onclick = () => cambiarVista('proto');
$('#h-sel').onclick = () => herramienta('sel'); $('#h-cable').onclick = () => herramienta(herr === 'cable' ? 'sel' : 'cable');
$('#h-deshacer').onclick = () => volver(hist, futuro); $('#h-rehacer').onclick = () => volver(futuro, hist);
$('#h-encuadrar').onclick = encuadrar;
$('#s-res').onchange = (e) => { marcar(); E.resEstilo = e.target.value; cambio(); paleta(); herramienta(herr); };
{ let marcado = false; $('#n-circ').oninput = (e) => { if (!marcado) { marcar(); marcado = true; } E.titulo = e.target.value; cambio(); }; $('#n-circ').onblur = () => { marcado = false; }; }
window.addEventListener('resize', () => pintarSobre());

/* ---------- Inicio ---------- */
if (EMBED) { $('#b-insertar').hidden = false; $('#b-abrir').hidden = true; $('#b-guardar').hidden = true; }
try { const g = localStorage.getItem(CLAVE); if (g) { E = limpiar(JSON.parse(g)); if (E.esq.els.length || E.proto.els.length) estado('Se recuperó el circuito en el que estabas trabajando.'); } } catch (e) {}
$('#n-circ').value = E.titulo; $('#s-res').value = E.resEstilo; botonesHist();
cambiarVista('esq');
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { paleta(); herramienta(herr); pintar(); });

// Para pruebas y para la página que la incrusta
window.__circuitos = {
  get estado() { return E; }, get vista() { return vista; }, get elegido() { return sel; },
  exportarPNG: (v) => exportarPNG(v === 'protoboard' || v === 'proto' ? 'proto' : v === 'esquematico' || v === 'esq' ? 'esq' : vista),
  exportarSVG: (v) => { const r = svgDe(v === 'protoboard' || v === 'proto' ? 'proto' : v === 'esquematico' || v === 'esq' ? 'esq' : vista); return r ? r.svg : null; },
  cargar, cambiarVista, encuadrar, bandas, leerOhm, textoOhm,
  nombresBandas: (ohm, tol = 5) => { const b = bandas(ohm); return [BANDA[b.d1][0], BANDA[b.d2][0], colorMult(b.m)[0], colorTol(tol)[0]]; },
  aPantalla: (p, v = vista) => { const o = svg.getBoundingClientRect(); return [o.left + V[v].x + p[0] * V[v].k, o.top + V[v].y + p[1] * V[v].k]; },
  agujero: (c, fila) => [colX(c), FILAS[fila] != null ? FILAS[fila] : RIELES[fila]],
};
