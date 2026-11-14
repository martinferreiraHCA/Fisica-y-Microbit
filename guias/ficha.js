// Ficha de armado con la estética de fisicabit (blanco, negro y grises; bandas negras,
// cuadrados negros para los pasos, recuadros con borde): portada con el nombre de la
// práctica o sistema, el dispositivo armado y sus llamadas (A, B, C…), y manual de
// ensamblado con la lista de piezas y un cuadro por paso.
import * as THREE from 'three';

export const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const VISTA = [1, -1.25, 0.95];
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const texto = (s) => esc(s).replace(/\n/g, '<br>');
const f1 = (n) => (Math.round(n * 10) / 10).toString();
const pausa = () => new Promise((r) => setTimeout(r, 0));

// Todo en blanco, negro y grises: el resalte de las piezas nuevas también es un gris.
const GRISES = { claro: '#dedede', medio: '#b3b3b3', oscuro: '#7c7c7c' };
function relleno(doc, p, nueva) {
  if (nueva && doc.resalte && doc.resalte !== 'no') return doc.resalte === 'puntos' ? { color: '#ffffff', trama: true } : { color: GRISES[doc.resalte] || GRISES.medio, trama: false };
  if (p.relleno === 'gris') return { color: '#e6e6e6', trama: false };
  if (p.relleno === 'oscuro' || p.relleno === 'acento') return { color: '#8f8f8f', trama: false };
  if (p.relleno === 'puntos') return { color: '#ffffff', trama: true };
  return { color: '#ffffff', trama: false };
}
// Mide un bloque de la hoja ya maquetada (fuera de pantalla), en milímetros.
const MM = 25.4 / 96;
function medir(html, sel) {
  const caja = document.createElement('div');
  caja.style.cssText = 'position:absolute; left:-99999px; top:0; visibility:hidden; pointer-events:none';
  caja.innerHTML = html; document.body.appendChild(caja);
  const el = caja.querySelector(sel);
  const r = el ? { w: el.clientWidth * MM, h: el.clientHeight * MM, sobra: (el.scrollHeight - el.clientHeight) * MM } : { w: 184, h: 120, sobra: 0 };
  caja.remove(); return r;
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

/* ---------- Portada: dispositivo armado con llamadas (cuadrado negro + letra) ---------- */
function portada(d, arte, anchoMm, altoMm) {
  const doc = d.doc, W = 1500, H = Math.max(300, Math.round(1500 * altoMm / anchoMm));
  const items = d.partes.map((p, k) => { const r = relleno(doc, p, false); return { geometry: p.geometry, matrix: p.mFinal, color: r.color, trama: r.trama, id: Math.min(254, k + 1) }; });
  const art = arte.dibujar(items, opcionesArte(doc, { w: W, h: H, dir: d.vistaPortada || VISTA, margen: 0.15 }));
  // Llamadas: una por paso con piezas, apuntando al borde de sus piezas
  const llamadas = [];
  d.pasos.forEach((paso, i) => {
    // La llamada apunta a la pieza más grande del paso (el centro del grupo puede caer en el vacío)
    const ids = new Set(); let caja = null, mayor = -1;
    d.partes.forEach((p, k) => { if (p.paso === i) { ids.add(Math.min(254, k + 1)); const t = p.cajaFinal.getSize(new THREE.Vector3()).length(); if (t > mayor) { mayor = t; caja = p.cajaFinal; } } });
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
  const C = 62, SEP = 80;   // lado del cuadrado y separación mínima entre llamadas
  for (const lado of [-1, 1]) {   // separar las letras de un mismo lado y mantenerlas dentro del cuadro
    const l = llamadas.filter((q) => q.lado === lado).sort((a, b) => a.y - b.y);
    l.forEach((q, k) => { q.y = Math.max(q.y, 96, k ? l[k - 1].y + SEP : 0); });
    for (let k = l.length - 1; k >= 0; k--) { const tope = H - 56 - (l.length - 1 - k) * SEP; if (l[k].y > tope) l[k].y = Math.max(40, tope); }
  }
  let svg = '';
  llamadas.forEach((q) => {
    const xl = q.lado < 0 ? 66 : W - 66, x0 = xl - q.lado * (C / 2), hx = q.hit[0] - q.lado * 9, hy = q.hit[1];
    svg += `<line x1="${f1(x0)}" y1="${f1(q.y)}" x2="${f1(hx)}" y2="${f1(hy)}" stroke="#111" stroke-width="2.4"/>` +
           `<circle cx="${f1(hx)}" cy="${f1(hy)}" r="7.5" fill="#111" stroke="#fff" stroke-width="2.5"/>` +
           `<rect x="${f1(xl - C / 2)}" y="${f1(q.y - C / 2)}" width="${C}" height="${C}" fill="#111"/>` +
           `<text x="${xl}" y="${f1(q.y + 14)}" text-anchor="middle" font-size="40" font-weight="800" fill="#fff">${esc(q.letra)}</text>`;
  });
  // Proporción del conjunto en la vista (ancho / alto), para repartir los cuadros del manual
  let x0 = W, x1 = 0, y0 = H, y1 = 0;
  for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) if (art.ids[y * W + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const forma = x1 > x0 && y1 > y0 ? (x1 - x0) / (y1 - y0) : 1;
  return { art, svg, forma, W, H };
}

/* ---------- Lista de piezas ---------- */
function listaPiezas(d, arte) {
  const grupos = new Map();
  d.partes.forEach((p) => {
    const k = p.geoId + '|' + p.nombre;
    if (!grupos.has(k)) grupos.set(k, { p, n: 0, nombre: p.nombre });
    grupos.get(k).n++;
  });
  let html = ''; const items = [];
  grupos.forEach((g) => {
    const r = relleno(d.doc, g.p, false);
    const art = arte.dibujar([{ geometry: g.p.geometry, matrix: g.p.mGiro, color: r.color, trama: r.trama, id: 1 }], opcionesArte(d.doc, { w: 230, h: 200, dir: VISTA, margen: 0.1, linea: 1.5 }));
    items.push({ canvas: art.canvas, n: g.n, nombre: g.nombre });
    html += `<div class="bom-it"><img src="${art.canvas.toDataURL('image/png')}" alt=""><div class="bom-n"><span class="cant">${g.n}×</span><span>${esc(g.nombre)}</span></div></div>`;
  });
  return { html, n: grupos.size, items };
}

/* ---------- Reparto de los cuadros del manual ---------- */
// Elige columnas × filas para que las figuras salgan lo más grandes posible
// según la proporción del conjunto (forma = ancho / alto en la vista).
const SEP_MM = 4;   // separación entre cuadros
function repartir(n, altoMm, forma) {
  let mejor = null;
  for (const cols of [1, 2, 3, 4]) {
    const filas = Math.ceil(n / cols), pieMm = [17, 19, 23, 27][cols - 1];   // cabecera + texto de cada cuadro
    const anchoMm = (184 - SEP_MM * (cols - 1)) / cols - 0.8;
    let figMm = (altoMm - SEP_MM * (filas - 1)) / filas - pieMm;
    if (figMm < 28) continue;
    figMm = Math.min(figMm, anchoMm * 1.7);
    const escala = Math.min(anchoMm / Math.max(0.2, forma), figMm);
    if (!mejor || escala > mejor.escala * 1.04) mejor = { cols, filas, anchoMm, figMm, escala };
  }
  return mejor || { cols: 3, filas: Math.ceil(n / 3), anchoMm: 58, figMm: 38 };
}
/* ---------- Páginas ---------- */
const nombreDe = (doc) => (doc.titulo || '').trim() || 'Práctica sin nombre';
function pie(doc, n, total) {
  const datos = [doc.autor, doc.fecha].filter(Boolean).map(esc).join(' · ');
  return `<div class="pie"><span>${datos}</span><span class="pie-m">fisicabit.com · guía de armado</span><span>${n} / ${total}</span></div>`;
}
const cuadro = (c) => `<div class="celda${c.final ? ' final' : ''}">
  <div class="cel-c"><span class="cuad">${c.final ? '✓' : esc(c.paso.letra)}</span><b>${c.final ? 'Dispositivo armado' : esc(c.paso.titulo)}</b></div>
  ${c.fig ? figuraHtml(c.fig) : `<div class="fig" style="aspect-ratio:${c.fw}/${c.fh}"></div>`}
  <div class="cel-x">${c.final ? 'Así queda el conjunto con todas las piezas en su lugar.' : texto(c.paso.texto)}</div></div>`;

export async function construirFicha(d, arte, avisar) {
  const doc = d.doc, paginas = [];
  const pasos = d.pasos.map((p, i) => Object.assign({}, p, { i, n: d.partes.filter((q) => q.paso === i).length })).filter((p) => p.n > 0);
  if (!d.partes.length) return [];
  const nombre = nombreDe(doc);
  /* Portada: primero el nombre de la práctica o sistema, después el dispositivo armado y los pasos */
  avisar && avisar('Dibujando la portada…'); await pausa();
  const caja = new THREE.Box3(); d.partes.forEach((p) => caja.union(p.cajaFinal));
  const t = caja.getSize(new THREE.Vector3());
  const bajada = [doc.subtitulo, doc.version ? 'versión ' + doc.version : ''].filter(Boolean).map(esc).join(' · ');
  const firma = [doc.autor ? 'por <b>' + esc(doc.autor) + '</b>' : '', esc(doc.fecha || '')].filter(Boolean).join(' · ');
  const cols = pasos.length > 8 ? 3 : pasos.length > 1 ? 2 : 1;
  const lista = pasos.map((p) => `<div class="paso-f"><span class="cuad">${esc(p.letra)}</span><div><b>${esc(p.titulo)}</b>${p.texto ? '<br>' + texto(p.texto) : ''}</div></div>`).join('');
  const hojaPortada = (heroe) => `<div class="hoja portada">
    <div class="banda">
      <div class="banda-k"><span class="banda-m">fisica<b>bit</b></span><span>Guía de armado${doc.tipo ? ' · ' + esc(doc.tipo) : ''}</span></div>
      <h1>${esc(nombre)}</h1>
      ${bajada ? `<div class="banda-s">${bajada}</div>` : ''}
    </div>
    <div class="meta"><span>${firma}</span><span>${d.partes.length} pieza${d.partes.length === 1 ? '' : 's'} · ${pasos.length} paso${pasos.length === 1 ? '' : 's'} · ${Math.round(t.x)} × ${Math.round(t.y)} × ${Math.round(t.z)} mm</span></div>
    <div class="heroe"><span class="etq">Dispositivo armado</span>${heroe}</div>
    <p class="epi">Las letras indican en qué paso se coloca cada parte.</p>
    ${doc.descripcion ? `<div class="nota-f">${texto(doc.descripcion)}</div>` : ''}
    <div class="h1f">Pasos de armado</div>
    <div class="pasos-l" style="grid-template-columns:repeat(${cols},1fr)">${lista}</div>
    <!--PIE--></div>`;
  const mh = medir(hojaPortada(''), '.heroe');
  const por = portada(d, arte, mh.w, mh.h);
  paginas.push(hojaPortada(figuraHtml({ art: por.art, svg: por.svg })));
  /* Manual: lista de piezas + un cuadro por paso + el dispositivo armado */
  avisar && avisar('Dibujando las piezas…'); await pausa();
  const bom = doc.listaPiezas ? listaPiezas(d, arte) : null;
  const celdas = pasos.map((p) => ({ paso: p })); celdas.push({ final: true });
  const forma = por.forma * 0.9;   // con las piezas entrando, el dibujo suele ser más alto
  const hojaManual = (pag, grilla, colsG) => `<div class="hoja manual">
      <div class="banda chica"><span class="banda-t">${esc(nombre)}</span><span class="banda-d">Manual de ensamblado</span></div>
      ${pag === 0 && bom ? `<div class="h1f">Piezas</div><div class="bom-l" style="grid-template-columns:repeat(${Math.min(7, Math.max(4, bom.n))},1fr)">${bom.html}</div>` : ''}
      <div class="h1f">Armado paso a paso</div>
      <div class="grilla" style="grid-template-columns:repeat(${colsG},1fr)">${grilla}</div><!--PIE--></div>`;
  let k = 0, pag = 0;
  while (k < celdas.length) {
    const grupo = celdas.slice(k, k + 9); k += grupo.length;
    const alto = medir(hojaManual(pag, '', 1), '.grilla').h;
    const r = repartir(grupo.length, alto, forma);
    // Ajuste fino: si los textos son largos y los cuadros no entran, se achican las figuras
    for (let v = 0; v < 3; v++) {
      grupo.forEach((c) => { c.fw = Math.round(r.anchoMm * 12.7); c.fh = Math.round(r.figMm * 12.7); });
      const m = medir(hojaManual(pag, grupo.map(cuadro).join(''), r.cols), '.grilla');
      if (m.sobra < 0.4 || r.figMm < 24) break;
      r.figMm = Math.max(22, r.figMm - m.sobra / r.filas - 0.6);
    }
    for (const c of grupo) {
      if (c.final) {
        avisar && avisar('Dibujando el dispositivo armado…'); await pausa();
        const fin = d.partes.map((p, q) => { const rl = relleno(doc, p, false); return { geometry: p.geometry, matrix: p.mFinal, color: rl.color, trama: rl.trama, id: Math.min(254, q + 1) }; });
        c.fig = { art: arte.dibujar(fin, opcionesArte(doc, { w: c.fw, h: c.fh, dir: d.vistaPortada || VISTA, margen: 0.07 })), svg: '' };
      } else {
        avisar && avisar('Dibujando el paso ' + c.paso.letra + '…'); await pausa();
        c.fig = figuraPaso(d, c.paso.i, arte, c.fw, c.fh);
      }
    }
    paginas.push(hojaManual(pag, grupo.map(cuadro).join(''), r.cols));
    pag++;
  }
  return paginas.map((h, i) => h.replace('<!--PIE-->', pie(doc, i + 1, paginas.length)));
}

/* ---------- Para el protocolo de práctico: las figuras como imágenes sueltas ---------- */
async function aImagen(canvas, svg, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(canvas, 0, 0, w, h);
  if (svg) {
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Arial, Helvetica, sans-serif">${svg}</svg>`);
    try { await img.decode(); g.drawImage(img, 0, 0, w, h); } catch (e) {}
  }
  return c.toDataURL('image/png');
}
// Dibujo del dispositivo armado, sin llamadas, desde la dirección dada
export function figuraArmado(d, arte, w, h, dir) {
  const items = d.partes.map((p, k) => { const r = relleno(d.doc, p, false); return { geometry: p.geometry, matrix: p.mFinal, color: r.color, trama: r.trama, id: Math.min(254, k + 1) }; });
  const art = arte.dibujar(items, opcionesArte(d.doc, { w, h, dir: dir || d.vistaPortada || VISTA, margen: 0.05 }));
  return aImagen(art.canvas, '', art.w, art.h);
}
// Todo lo que necesita el anexo de ensamblado: dispositivo con llamadas, tira de piezas y un dibujo por paso
export async function exportarProtocolo(d, arte, avisar) {
  const pasos = d.pasos.map((p, i) => Object.assign({}, p, { i, n: d.partes.filter((q) => q.paso === i).length })).filter((p) => p.n > 0);
  avisar && avisar('Dibujando el dispositivo armado…'); await pausa();
  const por = portada(d, arte, 184, 135);
  const out = { titulo: (d.doc.titulo || '').trim(), descripcion: (d.doc.descripcion || '').trim(), armado: await aImagen(por.art.canvas, por.svg, por.W, por.H), piezas: null, lista: [], pasos: [] };
  avisar && avisar('Dibujando las piezas…'); await pausa();
  const bom = listaPiezas(d, arte);
  out.lista = bom.items.map((it) => ({ n: it.n, nombre: it.nombre }));
  if (bom.items.length) {   // tira de piezas: dibujo + «2× nombre»
    const cols = Math.min(6, Math.max(3, bom.items.length)), cw = 250, ch = 262, filas = Math.ceil(bom.items.length / cols);
    const c = document.createElement('canvas'); c.width = cols * cw; c.height = filas * ch;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    bom.items.forEach((it, k) => {
      const x = (k % cols) * cw, y = Math.floor(k / cols) * ch;
      g.drawImage(it.canvas, x + 10, y + 6, 230, 200);
      g.font = '800 19px Montserrat, Arial, sans-serif'; const q = it.n + '×', qw = g.measureText(q).width + 14;
      g.font = '500 19px Montserrat, Arial, sans-serif'; let nom = it.nombre; while (nom.length > 3 && g.measureText(nom).width > cw - qw - 26) nom = nom.slice(0, -2) + '…';
      const tw = qw + 8 + g.measureText(nom).width, x0 = x + (cw - tw) / 2, yb = y + 216;
      g.fillStyle = '#000'; g.fillRect(x0, yb, qw, 28); g.fillStyle = '#fff'; g.font = '800 19px Montserrat, Arial, sans-serif'; g.textBaseline = 'middle'; g.fillText(q, x0 + 7, yb + 15);
      g.fillStyle = '#111'; g.font = '500 19px Montserrat, Arial, sans-serif'; g.fillText(nom, x0 + qw + 8, yb + 15);
    });
    out.piezas = c.toDataURL('image/png');
  }
  const forma = Math.max(0.6, Math.min(1.8, por.forma));
  const fw = 1000, fh = Math.round(fw / Math.max(0.85, Math.min(1.5, forma * 1.05)));
  for (const p of pasos) {
    avisar && avisar('Dibujando el paso ' + p.letra + '…'); await pausa();
    const fig = figuraPaso(d, p.i, arte, fw, fh);
    out.pasos.push({ letra: p.letra, titulo: p.titulo, texto: p.texto, png: await aImagen(fig.art.canvas, fig.svg, fig.art.w, fig.art.h) });
  }
  return out;
}
