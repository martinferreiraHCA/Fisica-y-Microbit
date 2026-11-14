// Ficha de armado: portada con el conjunto y sus llamadas (A, B, C…),
// y manual de ensamblado con la lista de piezas y un cuadro por paso.
import * as THREE from 'three';

export const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const VISTA = [1, -1.25, 0.95];
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const texto = (s) => esc(s).replace(/\n/g, '<br>');
const f1 = (n) => (Math.round(n * 10) / 10).toString();
const pausa = () => new Promise((r) => setTimeout(r, 0));

function relleno(doc, p, nueva) {
  if (nueva && doc.resaltar) return { color: doc.acento, trama: false };
  if (p.relleno === 'gris') return { color: '#e3e3e3', trama: false };
  if (p.relleno === 'acento') return { color: doc.acento, trama: false };
  if (p.relleno === 'puntos') return { color: '#ffffff', trama: true };
  return { color: '#ffffff', trama: false };
}
const opcionesArte = (doc, extra) => Object.assign({ linea: doc.linea || 1.8, sombra: doc.sombra ? 0.16 : 0, tinta: '#111111' }, extra);

/* ---------- Figura de un paso: piezas anteriores armadas + piezas nuevas entrando ---------- */
export function figuraPaso(d, i, arte, w, h) {
  const doc = d.doc;
  const items = [], flechas = [];
  d.partes.forEach((p, k) => {
    if (p.paso > i) return;
    const nueva = p.paso === i, r = relleno(doc, p, nueva && i > 0);
    items.push({ geometry: p.geometry, matrix: nueva ? p.mExp : p.mFinal, color: r.color, trama: r.trama, id: Math.min(254, k + 1) });
    if (nueva && p.cExp.distanceTo(p.cFinal) > 0.5) flechas.push([p.cExp, p.cFinal, Math.min(254, k + 1)]);
  });
  const paso = d.pasos[i];
  const art = arte.dibujar(items, opcionesArte(doc, { w, h, dir: paso.vista || d.vistaPortada || VISTA, margen: 0.07 }));
  let svg = '';
  const vistos = [];
  flechas.forEach(([a, b, id]) => {
    let A = art.proyectar(a), B = art.proyectar(b);
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]); if (L < 14) return;
    {   // la flecha sale del borde de la pieza (hacia donde se mueve) y llega a donde ese borde termina
      const vx = (B[0] - A[0]) / L, vy = (B[1] - A[1]) / L; let s = 0;
      for (let q = 0; q < 3000; q++) { const x = Math.round(A[0] + vx * q), y = Math.round(A[1] + vy * q); if (x < 0 || y < 0 || x >= art.w || y >= art.h) break; if (art.ids[y * art.w + x] === id) s = q; else if (q - s > 6) break; }
      if (s > 0) { A = [A[0] + vx * (s + 7), A[1] + vy * (s + 7)]; B = [A[0] + vx * (L - 7), A[1] + vy * (L - 7)]; }
    }
    if (vistos.some((q) => Math.hypot(q[0] - A[0], q[1] - A[1]) < 6 && Math.hypot(q[2] - B[0], q[3] - B[1]) < 6)) return;
    vistos.push([A[0], A[1], B[0], B[1]]);
    const ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L, t = 11;
    const P = [B[0] - ux * 2, B[1] - uy * 2];
    svg += `<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="${f1(P[0] - ux * t)}" y2="${f1(P[1] - uy * t)}" stroke="#111" stroke-width="2" stroke-dasharray="7 6" stroke-linecap="round"/>` +
           `<path d="M${f1(P[0])},${f1(P[1])} L${f1(P[0] - ux * t - uy * 5)},${f1(P[1] - uy * t + ux * 5)} L${f1(P[0] - ux * t + uy * 5)},${f1(P[1] - uy * t - ux * 5)} Z" fill="#111"/>`;
  });
  return { art, svg };
}
function figuraHtml(fig, clase) {
  const a = fig.art;
  return `<div class="fig ${clase || ''}" style="aspect-ratio:${a.w}/${a.h}"><img src="${a.canvas.toDataURL('image/png')}" alt="">` +
         `<svg viewBox="0 0 ${a.w} ${a.h}" xmlns="http://www.w3.org/2000/svg">${fig.svg || ''}</svg></div>`;
}

/* ---------- Portada: conjunto armado con llamadas ---------- */
function portada(d, arte, altoMm) {
  const doc = d.doc, W = 1500, H = Math.round(1500 * altoMm / 184);
  const items = d.partes.map((p, k) => { const r = relleno(doc, p, false); return { geometry: p.geometry, matrix: p.mFinal, color: r.color, trama: r.trama, id: Math.min(254, k + 1) }; });
  const art = arte.dibujar(items, opcionesArte(doc, { w: W, h: H, dir: d.vistaPortada || VISTA, margen: 0.15 }));
  // Llamadas: una por paso con piezas, apuntando al borde de sus piezas
  const llamadas = [];
  d.pasos.forEach((paso, i) => {
    const ids = new Set(); const caja = new THREE.Box3();
    d.partes.forEach((p, k) => { if (p.paso === i) { ids.add(Math.min(254, k + 1)); caja.union(p.cajaFinal); } });
    if (!ids.size) return;
    const c = art.proyectar(caja.getCenter(new THREE.Vector3()));
    const lado = c[0] < W / 2 ? -1 : 1;
    let hit = null;
    for (let dy = 0; dy < 90 && !hit; dy++) for (const s of dy ? [-1, 1] : [1]) {
      const y = Math.round(c[1] + s * dy); if (y < 0 || y >= H) continue;
      for (let k = 0; k < W; k++) { const x = lado < 0 ? k : W - 1 - k; if (ids.has(art.ids[y * W + x])) { hit = [x, y]; break; } }
      if (hit) break;
    }
    if (!hit) hit = [Math.round(c[0]), Math.round(c[1])];
    llamadas.push({ letra: paso.letra, lado, hit, y: hit[1] });
  });
  for (const lado of [-1, 1]) {   // separar las letras de un mismo lado
    const l = llamadas.filter((q) => q.lado === lado).sort((a, b) => a.y - b.y);
    for (let k = 1; k < l.length; k++) if (l[k].y - l[k - 1].y < 84) l[k].y = l[k - 1].y + 84;
  }
  let svg = '';
  llamadas.forEach((q) => {
    const xl = q.lado < 0 ? 62 : W - 62, x0 = xl - q.lado * 46, hx = q.hit[0] + q.lado * 10, hy = q.hit[1];
    const L = Math.hypot(hx - x0, hy - q.y) || 1, ux = (hx - x0) / L, uy = (hy - q.y) / L, t = 15;
    svg += `<text x="${xl}" y="${q.y + 17}" text-anchor="middle" font-size="50" font-weight="800" fill="#111">${esc(q.letra)}</text>` +
           `<line x1="${f1(x0)}" y1="${f1(q.y)}" x2="${f1(hx - ux * t)}" y2="${f1(hy - uy * t)}" stroke="#111" stroke-width="3.2" stroke-dasharray="0.01 8.5" stroke-linecap="round"/>` +
           `<path d="M${f1(hx)},${f1(hy)} L${f1(hx - ux * t - uy * 7)},${f1(hy - uy * t + ux * 7)} L${f1(hx - ux * t + uy * 7)},${f1(hy - uy * t - ux * 7)} Z" fill="#111"/>`;
  });
  // Decoración: círculo de acento detrás del último paso y dos ondas
  const ult = d.partes.filter((p) => p.paso === Math.max(...d.partes.map((q) => q.paso)));
  const cb = new THREE.Box3(); ult.forEach((p) => cb.union(p.cajaFinal));
  const cc = ult.length ? art.proyectar(cb.getCenter(new THREE.Vector3())) : [W * 0.6, H * 0.35];
  const onda = (x, y, col) => `<path d="M${x},${y} q16,-22 32,0 t32,0 t32,0 t32,0" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round"/>`;
  const fondo = `<svg class="deco" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">` +
    `<circle cx="${f1(Math.min(W - 300, Math.max(300, cc[0] + 70)))}" cy="${f1(Math.min(H - 300, Math.max(300, cc[1] - 20)))}" r="235" fill="${esc(doc.acento)}" opacity="0.55"/>` +
    onda(W * 0.07, H * 0.78, '#d9d9d9') + onda(W * 0.80, H * 0.60, '#d9d9d9') + `</svg>`;
  // Proporción del conjunto en la vista (ancho / alto), para repartir los cuadros del manual
  let x0 = W, x1 = 0, y0 = H, y1 = 0;
  for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) if (art.ids[y * W + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const forma = x1 > x0 && y1 > y0 ? (x1 - x0) / (y1 - y0) : 1;
  return { art, svg, fondo, forma, W, H };
}

/* ---------- Lista de piezas ---------- */
function listaPiezas(d, arte) {
  const grupos = new Map();
  d.partes.forEach((p) => {
    const k = p.geoId + '|' + p.nombre;
    if (!grupos.has(k)) grupos.set(k, { p, n: 0, nombre: p.nombre });
    grupos.get(k).n++;
  });
  let html = '';
  grupos.forEach((g) => {
    const r = relleno(d.doc, g.p, false);
    const art = arte.dibujar([{ geometry: g.p.geometry, matrix: g.p.mGiro, color: r.color, trama: r.trama, id: 1 }], opcionesArte(d.doc, { w: 230, h: 200, dir: VISTA, margen: 0.1, linea: 1.5 }));
    html += `<div class="bom-it"><img src="${art.canvas.toDataURL('image/png')}" alt=""><div><b>${g.n}×</b> ${esc(g.nombre)}</div></div>`;
  });
  return { html, n: grupos.size };
}

/* ---------- Reparto de los cuadros del manual ---------- */
// Elige columnas × filas para que las figuras salgan lo más grandes posible
// según la proporción del conjunto (forma = ancho / alto en la vista).
function repartir(n, altoMm, forma) {
  let mejor = null;
  for (const cols of [1, 2, 3, 4]) {
    const filas = Math.ceil(n / cols), pieMm = [13, 15, 19, 23][cols - 1];
    const anchoMm = (184 - 7 * (cols - 1)) / cols;
    let figMm = (altoMm - 4 * (filas - 1)) / filas - pieMm;
    if (figMm < 30) continue;
    figMm = Math.min(figMm, anchoMm * 1.7);
    const escala = Math.min(anchoMm / Math.max(0.2, forma), figMm);
    if (!mejor || escala > mejor.escala * 1.04) mejor = { cols, filas, anchoMm, figMm, escala };
  }
  return mejor || { cols: 3, filas: Math.ceil(n / 3), anchoMm: 56.6, figMm: 40 };
}

/* ---------- Páginas ---------- */
function cabecera(doc, derecha) {
  return `<div class="cab"><div class="cab-t"><b>${esc(doc.titulo)}</b> ${esc(doc.version)}</div><div class="cab-d">${esc(derecha)}</div></div>`;
}
function pie(doc, n, total) {
  const datos = [doc.autor, doc.fecha].filter(Boolean).map(esc).join(', ');
  return `<div class="pie"><span>${datos}</span><span class="pie-m">fisicabit · guías de armado</span><span>${n} / ${total}</span></div>`;
}
export async function construirFicha(d, arte, avisar) {
  const doc = d.doc, paginas = [];
  const pasos = d.pasos.map((p, i) => Object.assign({}, p, { i, n: d.partes.filter((q) => q.paso === i).length })).filter((p) => p.n > 0);
  if (!d.partes.length) return [];
  // Portada
  avisar && avisar('Dibujando la portada…'); await pausa();
  const cols = Math.min(4, Math.max(1, pasos.length)), filasCol = Math.ceil(pasos.length / 4);
  const largo = Math.max(0, ...pasos.map((p) => (p.texto || '').length));
  const altoCols = filasCol * (9 + Math.ceil(largo / (cols > 3 ? 34 : cols > 2 ? 48 : 75)) * 3.6);
  const altoHeroe = Math.max(110, Math.min(198, 231 - altoCols - (doc.descripcion ? 6 + Math.ceil(doc.descripcion.length / 120) * 4 : 0)));
  const por = portada(d, arte, altoHeroe);
  const caja = new THREE.Box3(); d.partes.forEach((p) => caja.union(p.cajaFinal));
  const t = caja.getSize(new THREE.Vector3());
  const columnas = pasos.map((p) => `<div class="col"><b>${esc(p.letra)}. ${esc(p.titulo)}</b><br>${texto(p.texto)}</div>`).join('');
  paginas.push(`<div class="hoja portada">
    <div class="por-cab">
      <div><h1><b>${esc(doc.titulo)}</b> ${esc(doc.version)}</h1><div class="regla"></div>
        <p class="por-sub">${esc(doc.subtitulo)}${doc.autor ? '<br>por <b>' + esc(doc.autor) + '</b>' + (doc.fecha ? ', ' + esc(doc.fecha) : '') : ''}</p></div>
      <div class="sello"><span>fisica<b>bit</b></span><small>guía de armado</small></div>
    </div>
    <div class="heroe" style="height:${f1(altoHeroe)}mm">${por.fondo}${figuraHtml({ art: por.art, svg: por.svg })}</div>
    ${doc.descripcion ? `<p class="por-desc">${texto(doc.descripcion)}</p>` : ''}
    <div class="cols" style="grid-template-columns:repeat(${cols},1fr)">${columnas}</div>
    <div class="por-med">Conjunto armado: ${Math.round(t.x)} × ${Math.round(t.y)} × ${Math.round(t.z)} mm · ${d.partes.length} pieza${d.partes.length === 1 ? '' : 's'}</div>
    <!--PIE--></div>`);
  // Manual: lista de piezas + un cuadro por paso + el armado final
  avisar && avisar('Dibujando las piezas…'); await pausa();
  const bom = doc.listaPiezas ? listaPiezas(d, arte) : null;
  const bomMm = bom ? 13 + Math.ceil(bom.n / 7) * 26 : 0;
  const celdas = pasos.map((p) => ({ paso: p })); celdas.push({ final: true });
  const forma = por.forma * 0.9;   // con las piezas entrando, el dibujo suele ser más alto
  let k = 0, pag = 0;
  while (k < celdas.length) {
    const alto = 244 - (pag === 0 ? bomMm : 0);
    const grupo = celdas.slice(k, k + 9); k += grupo.length;
    const r = repartir(grupo.length, alto, forma);
    const fw = Math.round(r.anchoMm * 12.7), fh = Math.round(r.figMm * 12.7);
    for (const c of grupo) {
      if (c.final) {
        avisar && avisar('Dibujando el armado final…'); await pausa();
        const fin = d.partes.map((p, q) => { const rl = relleno(doc, p, false); return { geometry: p.geometry, matrix: p.mFinal, color: rl.color, trama: rl.trama, id: Math.min(254, q + 1) }; });
        c.fig = { art: arte.dibujar(fin, opcionesArte(doc, { w: fw, h: fh, dir: d.vistaPortada || VISTA, margen: 0.07 })), svg: '' };
      } else {
        avisar && avisar('Dibujando el paso ' + c.paso.letra + '…'); await pausa();
        c.fig = figuraPaso(d, c.paso.i, arte, fw, fh);
      }
    }
    const html = grupo.map((c, j) => {
      const ult = c.final;
      return `<div class="celda${ult ? ' final' : ''}">${figuraHtml(c.fig)}
        <div class="cel-t"><span class="insignia">${ult ? '✓' : esc(c.paso.letra)}</span><div><b>${ult ? 'Armado final' : esc(c.paso.titulo)}</b>${ult ? '' : '<br>' + texto(c.paso.texto)}</div></div>
        ${(j + 1) % r.cols && j < grupo.length - 1 ? '<span class="sigue">»</span>' : ''}</div>`;
    }).join('');
    paginas.push(`<div class="hoja manual">${cabecera(doc, 'Manual de ensamblado')}
      ${pag === 0 && bom ? `<div class="bom"><div class="bom-t">Piezas</div><div class="bom-l">${bom.html}</div></div>` : ''}
      <div class="grilla" style="grid-template-columns:repeat(${r.cols},1fr)">${html}</div><!--PIE--></div>`);
    pag++;
  }
  return paginas.map((h, i) => h.replace('<!--PIE-->', pie(doc, i + 1, paginas.length)));
}
