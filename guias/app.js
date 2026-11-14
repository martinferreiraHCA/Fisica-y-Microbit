// Guías de armado · fisicabit — editor 3D + ficha A4
import * as THREE from 'three';
import { OrbitControls } from '../lib/OrbitControls.js';
import { TransformControls } from '../lib/TransformControls.js';
import * as motor from './motor.js';
import { Arte } from './arte.js';
import { construirFicha, figuraPaso, figuraArmado, exportarProtocolo, LETRAS } from './ficha.js';

const $ = (s) => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const r1 = (n) => Math.round(n * 10) / 10;
const hoy = () => new Date().toLocaleDateString('es', { month: 'long', year: 'numeric' });

/* ---------- Estado ---------- */
const docNuevo = () => ({ titulo: '', tipo: 'Práctica', version: '', subtitulo: '', autor: '', fecha: hoy(), descripcion: '', resalte: 'medio', linea: 1.8, sombra: false, listaPiezas: true });
// Guías guardadas con el formato anterior (color de acento) pasan a grises
function ponerAlDia(doc) {
  const d = Object.assign(docNuevo(), doc || {});
  if (!doc || doc.resalte == null) d.resalte = doc && doc.resaltar === false ? 'no' : 'medio';
  if (doc && doc.tipo == null) { d.tipo = ''; if (d.subtitulo === 'Guía de armado') d.subtitulo = ''; }
  delete d.acento; delete d.resaltar; return d;
}
let E = { doc: docNuevo(), pasos: [{ id: uid(), titulo: 'Base', texto: '', vista: null }], partes: [], geos: {}, vistaPortada: null };
let sel = null, pasoId = E.pasos[0].id, modoEntrada = false, soloHasta = false;
const ui = { geos: new Map(), meshes: new Map() };   // objetos de three (no se guardan)
const idxPaso = (id) => Math.max(0, E.pasos.findIndex((p) => p.id === id));
const parte = (id) => E.partes.find((p) => p.id === id);

function estado(msg, clase) { const e = $('#estado'); e.textContent = msg; e.className = clase || ''; }

/* ---------- Escena ---------- */
const lienzo = $('#lienzo'), visor = $('#visor');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const scene = new THREE.Scene(); scene.background = new THREE.Color('#f4f4f2');
const camera = new THREE.OrthographicCamera(-200, 200, 200, -200, -5000, 10000);
camera.up.set(0, 0, 1); camera.position.set(260, -330, 250);
scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b8b8, 2.7));
const sol = new THREE.DirectionalLight(0xffffff, 1.9); sol.position.set(-200, -300, 500); scene.add(sol);
const grilla = new THREE.GridHelper(1000, 100, 0x8a8a8a, 0xd9d9d6); grilla.rotateX(Math.PI / 2); grilla.position.z = -0.02; scene.add(grilla);
const orbit = new OrbitControls(camera, lienzo); orbit.target.set(0, 0, 40); orbit.enableDamping = false; orbit.update();
const tc = new TransformControls(camera, lienzo); tc.setSize(0.9); scene.add(tc);
let pide = false;
function frame() { if (pide) return; pide = true; requestAnimationFrame(() => { pide = false; renderer.render(scene, camera); }); }
orbit.addEventListener('change', frame); tc.addEventListener('change', frame);
tc.addEventListener('dragging-changed', (e) => { orbit.enabled = !e.value; if (!e.value) guardarPronto(); });
tc.addEventListener('objectChange', () => {
  const p = parte(sel), m = ui.meshes.get(sel); if (!p || !m) return;
  if (modoEntrada && p.paso === pasoId) p.exp = [r1(m.position.x - p.pos[0]), r1(m.position.y - p.pos[1]), r1(m.position.z - p.pos[2])];
  else p.pos = [r1(m.position.x), r1(m.position.y), r1(m.position.z)];
  p.rot = [m.rotation.x, m.rotation.y, m.rotation.z].map((a) => r1(THREE.MathUtils.radToDeg(a)));
  llenarInspector();
});
function medir() {
  const w = visor.clientWidth || 800, h = visor.clientHeight || 600, a = w / h, hh = 220;
  renderer.setSize(w, h, false);
  camera.left = -hh * a; camera.right = hh * a; camera.top = hh; camera.bottom = -hh; camera.updateProjectionMatrix(); frame();
}
new ResizeObserver(medir).observe(visor);

/* ---------- Geometrías y piezas ---------- */
function geoThree(id) {
  if (ui.geos.has(id)) return ui.geos.get(id);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(E.geos[id].pos, 3));
  g.computeVertexNormals(); g.computeBoundingBox();
  const o = { g, aristas: new THREE.EdgesGeometry(g, 28) };
  ui.geos.set(id, o); return o;
}
// pos: Float32Array ya centrada en su caja
function nuevaGeo(pos) { const id = uid(); E.geos[id] = { pos }; return id; }
function nuevaParte(geoId, nombre, pos, extra) {
  const p = Object.assign({ id: uid(), geoId, nombre, pos: pos.map(r1), rot: [0, 0, 0], exp: [0, 0, 0], paso: pasoId, relleno: 'blanco', oculto: false }, extra || {});
  E.partes.push(p); return p;
}
const matLinea = new THREE.LineBasicMaterial({ color: 0x1a1a1a });
function meshDe(p) {
  let m = ui.meshes.get(p.id);
  if (!m) {
    const o = geoThree(p.geoId);
    m = new THREE.Mesh(o.g, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0, flatShading: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
    m.add(new THREE.LineSegments(o.aristas, matLinea));
    m.userData.id = p.id; scene.add(m); ui.meshes.set(p.id, m);
  }
  return m;
}
const explotada = (p) => modoEntrada && p.paso === pasoId;
function sincronizar() {
  const actual = idxPaso(pasoId);
  const vivos = new Set(E.partes.map((p) => p.id));
  ui.meshes.forEach((m, id) => { if (!vivos.has(id)) { if (tc.object === m) tc.detach(); scene.remove(m); m.material.dispose(); ui.meshes.delete(id); } });
  E.partes.forEach((p) => {
    const m = meshDe(p), ex = explotada(p);
    m.position.set(p.pos[0] + (ex ? p.exp[0] : 0), p.pos[1] + (ex ? p.exp[1] : 0), p.pos[2] + (ex ? p.exp[2] : 0));
    m.rotation.set(...p.rot.map(THREE.MathUtils.degToRad));
    m.visible = !p.oculto && (!soloHasta || idxPaso(p.paso) <= actual);
    const delPaso = p.paso === pasoId;
    m.material.color.set(p.id === sel ? '#6f6f6f' : (delPaso ? '#ffffff' : '#cfcfcf'));
  });
  const ms = ui.meshes.get(sel);
  if (ms && ms.visible) { if (tc.object !== ms) tc.attach(ms); } else tc.detach();
  frame();
}
function elegir(id) { sel = id && parte(id) ? id : null; sincronizar(); pintarPiezas(); llenarInspector(); }
function cajaVisible() {
  const b = new THREE.Box3(); let hay = false;
  ui.meshes.forEach((m) => { if (m.visible) { m.updateMatrixWorld(); b.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld)); hay = true; } });
  return hay ? b : null;
}
function encuadrar() {
  const b = cajaVisible(); if (!b) return;
  const c = b.getCenter(new THREE.Vector3()), t = b.getSize(new THREE.Vector3()).length() || 100;
  const dir = camera.position.clone().sub(orbit.target).normalize();
  orbit.target.copy(c); camera.position.copy(c).addScaledVector(dir, t * 3);
  camera.zoom = 440 / (t * 1.25); camera.updateProjectionMatrix(); orbit.update(); frame();
}
const vistaActual = () => camera.position.clone().sub(orbit.target).normalize().toArray().map((v) => Math.round(v * 1000) / 1000);

/* ---------- Clic para elegir ---------- */
let abajo = null;
lienzo.addEventListener('pointerdown', (e) => { abajo = [e.clientX, e.clientY]; });
lienzo.addEventListener('pointerup', (e) => {
  if (!abajo || Math.hypot(e.clientX - abajo[0], e.clientY - abajo[1]) > 5 || tc.dragging || tc.axis) return;
  const r = lienzo.getBoundingClientRect();
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const hit = ray.intersectObjects([...ui.meshes.values()].filter((m) => m.visible), false)[0];
  elegir(hit ? hit.object.userData.id : null);
});
lienzo.addEventListener('keydown', (e) => {
  if (e.key === 'Delete' || e.key === 'Backspace') { borrar(); e.preventDefault(); }
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { duplicar(); e.preventDefault(); }
  else if (e.key.toLowerCase() === 'g') modo('translate');
  else if (e.key.toLowerCase() === 'r') modo('rotate');
  else if (e.key === 'Escape') elegir(null);
});

/* ---------- Herramientas ---------- */
function modo(m) { tc.setMode(m); $('#m-mover').classList.toggle('act', m === 'translate'); $('#m-rotar').classList.toggle('act', m === 'rotate'); frame(); }
function salto() { const [mm, g] = $('#s-salto').value.split('|').map(Number); tc.setTranslationSnap(mm || null); tc.setRotationSnap(g ? THREE.MathUtils.degToRad(g) : null); }
function entrada(on) {
  modoEntrada = on; $('#m-final').classList.toggle('act', !on); $('#m-entrada').classList.toggle('act', on);
  if (on) modo('translate'); sincronizar();
}
$('#m-mover').onclick = () => modo('translate'); $('#m-rotar').onclick = () => modo('rotate');
$('#s-salto').onchange = salto; salto();
$('#m-final').onclick = () => entrada(false); $('#m-entrada').onclick = () => entrada(true);
$('#b-hasta').onclick = () => { soloHasta = !soloHasta; $('#b-hasta').classList.toggle('act', soloHasta); sincronizar(); };
$('#b-encuadrar').onclick = encuadrar;

/* ---------- Lista de piezas ---------- */
function pintarPiezas() {
  const box = $('#lista-piezas'); box.innerHTML = '';
  $('#n-piezas').textContent = E.partes.length ? E.partes.length + '' : '';
  if (!E.partes.length) { box.innerHTML = '<p class="nota">Todavía no hay piezas. Agregá diseños del catálogo, ferretería o un archivo STL.</p>'; return; }
  const orden = E.partes.slice().sort((a, b) => idxPaso(a.paso) - idxPaso(b.paso));
  orden.forEach((p) => {
    const f = document.createElement('div');
    f.className = 'fila' + (p.id === sel ? ' sel' : '') + (p.oculto ? ' oculta' : '');
    const s = document.createElement('select'); s.className = 'mini'; s.title = 'Paso en el que entra';
    E.pasos.forEach((ps, i) => { const o = document.createElement('option'); o.value = ps.id; o.textContent = LETRAS[i] || '?'; s.appendChild(o); });
    s.value = p.paso; s.onclick = (e) => e.stopPropagation();
    s.onchange = () => { p.paso = s.value; cambio(); };
    const n = document.createElement('span'); n.className = 'nom'; n.textContent = p.nombre;
    const x = document.createElement('button'); x.className = 'x'; x.textContent = '✕'; x.title = 'Eliminar';
    x.onclick = (e) => { e.stopPropagation(); sel = p.id; borrar(); };
    f.append(s, n, x); f.onclick = () => elegir(p.id); box.appendChild(f);
  });
}
/* ---------- Pasos ---------- */
function pintarPasos() {
  const box = $('#lista-pasos'); box.innerHTML = '';
  E.pasos.forEach((ps, i) => {
    const f = document.createElement('div'); f.className = 'fila' + (ps.id === pasoId ? ' sel' : '');
    const l = document.createElement('span'); l.className = 'letra' + (ps.id === pasoId ? ' paso-actual' : ''); l.textContent = LETRAS[i] || '?';
    const n = document.createElement('span'); n.className = 'nom'; n.textContent = ps.titulo || 'Paso';
    const c = document.createElement('span'); c.className = 'nota'; c.textContent = E.partes.filter((p) => p.paso === ps.id).length || '';
    const arr = document.createElement('button'); arr.className = 'x'; arr.textContent = '↑'; arr.title = 'Subir';
    arr.onclick = (e) => { e.stopPropagation(); if (i > 0) { E.pasos.splice(i - 1, 0, E.pasos.splice(i, 1)[0]); cambio(); } };
    const x = document.createElement('button'); x.className = 'x'; x.textContent = '✕'; x.title = 'Eliminar el paso (sus piezas pasan al anterior)';
    x.onclick = (e) => {
      e.stopPropagation(); if (E.pasos.length < 2) return;
      const dest = E.pasos[i > 0 ? i - 1 : 1].id; E.partes.forEach((p) => { if (p.paso === ps.id) p.paso = dest; });
      E.pasos.splice(i, 1); if (pasoId === ps.id) pasoId = dest; cambio();
    };
    f.append(l, n, c, arr, x); f.onclick = () => { pasoId = ps.id; cambio(true); }; box.appendChild(f);
  });
  const ps = E.pasos[idxPaso(pasoId)];
  $('#p-letra').textContent = LETRAS[idxPaso(pasoId)] || '?';
  if (document.activeElement !== $('#p-titulo')) $('#p-titulo').value = ps.titulo;
  if (document.activeElement !== $('#p-texto')) $('#p-texto').value = ps.texto;
  $('#p-vista').classList.toggle('act', !!ps.vista);
}
$('#b-paso').onclick = () => { const ps = { id: uid(), titulo: 'Paso ' + (E.pasos.length + 1), texto: '', vista: null }; E.pasos.push(ps); pasoId = ps.id; cambio(); };
$('#p-titulo').oninput = (e) => { E.pasos[idxPaso(pasoId)].titulo = e.target.value; pintarPasos(); guardarPronto(); };
$('#p-texto').oninput = (e) => { E.pasos[idxPaso(pasoId)].texto = e.target.value; guardarPronto(); };
$('#p-vista').onclick = () => { E.pasos[idxPaso(pasoId)].vista = vistaActual(); cambio(true); estado('La ficha va a dibujar este paso desde esta vista.'); };
$('#p-vista-no').onclick = () => { E.pasos[idxPaso(pasoId)].vista = null; cambio(true); };
$('#p-auto').onclick = () => {
  const b = new THREE.Box3(), act = idxPaso(pasoId);
  E.partes.forEach((p) => { if (idxPaso(p.paso) <= act) b.union(cajaDe(p, false)); });
  const alto = b.isEmpty() ? 60 : b.max.z - b.min.z;
  E.partes.forEach((p) => { if (p.paso === pasoId) p.exp = [0, 0, Math.round(Math.max(30, alto * 0.45))]; });
  entrada(true); cambio(true); encuadrar();
};

/* ---------- Inspector ---------- */
const campos = { 'i-px': ['pos', 0], 'i-py': ['pos', 1], 'i-pz': ['pos', 2], 'i-rx': ['rot', 0], 'i-ry': ['rot', 1], 'i-rz': ['rot', 2], 'i-ex': ['exp', 0], 'i-ey': ['exp', 1], 'i-ez': ['exp', 2] };
function llenarInspector() {
  const p = parte(sel);
  $('#insp').hidden = !p; $('#insp-vacio').hidden = !!p; if (!p) return;
  if (document.activeElement !== $('#i-nombre')) $('#i-nombre').value = p.nombre;
  const s = $('#i-paso'); s.innerHTML = '';
  E.pasos.forEach((ps, i) => { const o = document.createElement('option'); o.value = ps.id; o.textContent = (LETRAS[i] || '?') + ' · ' + (ps.titulo || 'Paso'); s.appendChild(o); });
  s.value = p.paso; $('#i-relleno').value = p.relleno;
  Object.keys(campos).forEach((id) => { const [k, i] = campos[id]; if (document.activeElement !== $('#' + id)) $('#' + id).value = p[k][i]; });
  $('#i-ocultar').textContent = p.oculto ? 'Mostrar' : 'Ocultar';
}
Object.keys(campos).forEach((id) => { $('#' + id).oninput = (e) => { const p = parte(sel); if (!p) return; const [k, i] = campos[id]; p[k][i] = parseFloat(e.target.value) || 0; sincronizar(); guardarPronto(); }; });
$('#i-nombre').oninput = (e) => { const p = parte(sel); if (p) { p.nombre = e.target.value; pintarPiezas(); guardarPronto(); } };
$('#i-paso').onchange = (e) => { const p = parte(sel); if (p) { p.paso = e.target.value; cambio(); } };
$('#i-relleno').onchange = (e) => { const p = parte(sel); if (p) { p.relleno = e.target.value; guardarPronto(); } };
function matriz(p, conEntrada) {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...p.rot.map(THREE.MathUtils.degToRad)));
  const v = new THREE.Vector3(p.pos[0] + (conEntrada ? p.exp[0] : 0), p.pos[1] + (conEntrada ? p.exp[1] : 0), p.pos[2] + (conEntrada ? p.exp[2] : 0));
  return new THREE.Matrix4().compose(v, q, new THREE.Vector3(1, 1, 1));
}
function cajaDe(p, conEntrada) {   // caja exacta de la pieza ya girada y ubicada
  const a = E.geos[p.geoId].pos, m = matriz(p, conEntrada), b = new THREE.Box3(), v = new THREE.Vector3();
  const paso = Math.max(3, Math.floor(a.length / 30000 / 3) * 3);
  for (let i = 0; i < a.length; i += paso) b.expandByPoint(v.set(a[i], a[i + 1], a[i + 2]).applyMatrix4(m));
  return b;
}
$('#i-piso').onclick = () => { const p = parte(sel); if (!p) return; p.pos[2] = r1(p.pos[2] - cajaDe(p, false).min.z); cambio(true); };
$('#i-centro').onclick = () => { const p = parte(sel); if (!p) return; p.pos[0] = 0; p.pos[1] = 0; cambio(true); };
$('#i-ocultar').onclick = () => { const p = parte(sel); if (!p) return; p.oculto = !p.oculto; cambio(); };
function duplicar() {
  const p = parte(sel); if (!p) return;
  const b = cajaDe(p, false), n = nuevaParte(p.geoId, p.nombre, [p.pos[0] + (b.max.x - b.min.x) + 10, p.pos[1], p.pos[2]], { rot: p.rot.slice(), exp: p.exp.slice(), paso: p.paso, relleno: p.relleno });
  sel = n.id; cambio();
}
function borrar() {
  const p = parte(sel); if (!p) return;
  E.partes = E.partes.filter((q) => q !== p); sel = null;
  if (!E.partes.some((q) => q.geoId === p.geoId)) { const o = ui.geos.get(p.geoId); if (o) { o.g.dispose(); o.aristas.dispose(); ui.geos.delete(p.geoId); } delete E.geos[p.geoId]; }
  cambio();
}
$('#i-dup').onclick = duplicar; $('#i-borrar').onclick = borrar;

function cambio(liviano) { sincronizar(); if (!liviano) pintarPiezas(); else pintarPiezas(); pintarPasos(); llenarInspector(); guardarPronto(); fichaVieja = true; }

/* ---------- Agregar piezas: catálogo, ferretería, archivos ---------- */
function lugarLibre() {   // x donde poner algo nuevo sin pisar lo que hay
  const b = new THREE.Box3(); E.partes.forEach((p) => b.union(cajaDe(p, false)));
  return b.isEmpty() ? null : b.max.x + 20;
}
// Agrega una malla suelta como una pieza (centrada, apoyada en el piso)
function agregarMalla(pos, nombre, extra) {
  motor.centrar(pos);
  const c = motor.caja(pos), x = lugarLibre();
  const p = nuevaParte(nuevaGeo(pos), nombre, [x == null ? 0 : x - c.min[0], 0, -c.min[2]], extra);
  sel = p.id; cambio(); encuadrar(); return p;
}
// Agrega un conjunto de piezas ya ubicadas entre sí (diseño de cartón armado)
function agregarConjunto(piezas) {
  const todo = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  piezas.forEach((q) => { const c = motor.caja(q.pos); for (let k = 0; k < 3; k++) { todo.min[k] = Math.min(todo.min[k], c.min[k]); todo.max[k] = Math.max(todo.max[k], c.max[k]); } });
  const x = lugarLibre(), dx = x == null ? -(todo.min[0] + todo.max[0]) / 2 : x - todo.min[0], dy = -(todo.min[1] + todo.max[1]) / 2, dz = -todo.min[2];
  const geos = [];   // piezas iguales comparten geometría (misma cantidad de triángulos y volumen)
  piezas.forEach((q) => {
    const c = motor.centrar(q.pos), vol = motor.volumen(q.pos);
    const igual = geos.find((g) => g.n === q.pos.length && Math.abs(g.vol - vol) < 1e-3 * vol && g.nombre === q.nombre && mismaForma(E.geos[g.id].pos, q.pos));
    const id = igual ? igual.id : nuevaGeo(q.pos);
    if (!igual) geos.push({ id, n: q.pos.length, vol, nombre: q.nombre });
    nuevaParte(id, q.nombre, [c[0] + dx, c[1] + dy, c[2] + dz]);
  });
  sel = null; cambio(); encuadrar();
}
function mismaForma(a, b) { for (let i = 0; i < a.length; i += 97) if (Math.abs(a[i] - b[i]) > 0.01) return false; return true; }

const prim = (g) => { const n = g.index ? g.toNonIndexed() : g; return new Float32Array(n.attributes.position.array); };
const hexagono = (af) => { const s = new THREE.Shape(), r = af / Math.sqrt(3); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; s[i ? 'lineTo' : 'moveTo'](r * Math.cos(a), r * Math.sin(a)); } s.closePath(); return s; };
const AF = { 3: 5.5, 4: 7, 5: 8, 6: 10, 8: 13, 10: 17 };
const FERRETERIA = [
  { nombre: 'Varilla', campos: [['Diámetro (mm)', 12], ['Largo (mm)', 300]], hacer: (d, L) => prim(new THREE.CylinderGeometry(d / 2, d / 2, L, 48).rotateX(Math.PI / 2)), rotulo: (d, L) => 'Varilla ' + d + ' × ' + L },
  { nombre: 'Tornillo hexagonal', campos: [['Rosca M', 6], ['Largo (mm)', 30]], hacer: (d, L) => {
      const af = AF[d] || d * 1.65, hc = d * 0.65;
      const cab = prim(new THREE.ExtrudeGeometry(hexagono(af), { depth: hc, bevelEnabled: false }).translate(0, 0, L));
      const cu = prim(new THREE.CylinderGeometry(d / 2, d / 2, L, 32).rotateX(Math.PI / 2).translate(0, 0, L / 2));
      const p = new Float32Array(cab.length + cu.length); p.set(cab); p.set(cu, cab.length); return p;
    }, rotulo: (d, L) => 'Tornillo M' + d + ' × ' + L },
  { nombre: 'Tuerca hexagonal', campos: [['Rosca M', 6]], hacer: (d) => { const s = hexagono(AF[d] || d * 1.65); const h = new THREE.Path(); h.absarc(0, 0, d / 2, 0, Math.PI * 2, true); s.holes.push(h); return prim(new THREE.ExtrudeGeometry(s, { depth: d * 0.8, bevelEnabled: false, curveSegments: 24 })); }, rotulo: (d) => 'Tuerca M' + d },
  { nombre: 'Arandela', campos: [['Rosca M', 6]], hacer: (d) => { const s = new THREE.Shape(); s.absarc(0, 0, d, 0, Math.PI * 2, false); const h = new THREE.Path(); h.absarc(0, 0, d / 2 + 0.2, 0, Math.PI * 2, true); s.holes.push(h); return prim(new THREE.ExtrudeGeometry(s, { depth: Math.max(1, d * 0.2), bevelEnabled: false, curveSegments: 32 })); }, rotulo: (d) => 'Arandela M' + d },
  { nombre: 'Bloque o placa', campos: [['Largo X (mm)', 60], ['Ancho Y (mm)', 40], ['Alto Z (mm)', 10]], hacer: (x, y, z) => prim(new THREE.BoxGeometry(x, y, z)), rotulo: (x, y, z) => 'Bloque ' + x + ' × ' + y + ' × ' + z },
  { nombre: 'Placa micro:bit', campos: [], hacer: () => { const s = new THREE.Shape(), w = 51.6, h = 42, r = 3; s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0); s.lineTo(w / 2, h / 2 - r); s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2); s.lineTo(-w / 2 + r, h / 2); s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI); s.lineTo(-w / 2, -h / 2 + r); s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5); return prim(new THREE.ExtrudeGeometry(s, { depth: 1.6, bevelEnabled: false, curveSegments: 8 })); }, rotulo: () => 'micro:bit' }
];
let catalogo = null, catSel = null;
async function abrirModal() {
  $('#modal').classList.add('abierto');
  pintarCatalogo();
  if (!catalogo) {
    catalogo = { '3d': [], carton: [], error: null };
    try { [catalogo['3d'], catalogo.carton] = await Promise.all([motor.listar('3d'), motor.listar('carton')]); }
    catch (e) { catalogo.error = e.message; }
    pintarCatalogo();
  }
}
function pintarCatalogo() {
  const box = $('#cat-lista'); box.innerHTML = '';
  const grupo = (t) => { const g = document.createElement('div'); g.className = 'cat-g'; g.textContent = t; box.appendChild(g); };
  const item = (t, clave, fn) => { const d = document.createElement('div'); d.className = 'cat-i' + (catSel === clave ? ' sel' : ''); d.textContent = t; d.onclick = () => { catSel = clave; pintarCatalogo(); fn(); }; box.appendChild(d); };
  grupo('Tus archivos'); item('Abrir un archivo .stl o .scad…', 'archivo', () => $('#f-pieza').click());
  grupo('Ferretería'); FERRETERIA.forEach((f, i) => item(f.nombre, 'f' + i, () => detalleFerreteria(f)));
  if (!catalogo || (!catalogo['3d'].length && !catalogo.carton.length && !catalogo.error)) { grupo('Catálogo de fisicabit'); const n = document.createElement('p'); n.className = 'nota'; n.textContent = 'Leyendo el catálogo…'; box.appendChild(n); return; }
  if (catalogo.error) { grupo('Catálogo de fisicabit'); const n = document.createElement('p'); n.className = 'nota'; n.textContent = 'No se pudo leer el catálogo: ' + catalogo.error; box.appendChild(n); return; }
  grupo('Encastre en cartón'); catalogo.carton.forEach((d) => item(d.nombre, 'c' + d.archivo, () => detalleDiseno(d)));
  grupo('Impresión 3D'); catalogo['3d'].forEach((d) => item(d.nombre, 'd' + d.archivo, () => detalleDiseno(d)));
}
function detalleFerreteria(f) {
  const box = $('#cat-detalle'); box.className = ''; box.innerHTML = '<h3 style="margin:0 0 10px">' + f.nombre + '</h3>';
  const ins = f.campos.map(([t, v]) => { const fila = document.createElement('div'); fila.className = 'par-fila'; fila.innerHTML = '<div>' + t + '</div>'; const i = document.createElement('input'); i.type = 'number'; i.value = v; i.min = 0.5; fila.appendChild(i); box.appendChild(fila); return i; });
  const b = document.createElement('button'); b.className = 'btn pri'; b.textContent = 'Agregar'; b.style.marginTop = '10px';
  b.onclick = () => { const v = ins.map((i) => Math.max(0.5, parseFloat(i.value) || 1)); agregarMalla(f.hacer(...v), f.rotulo(...v), f.nombre === 'Varilla' || /Tornillo|Tuerca|Arandela/.test(f.nombre) ? { relleno: 'gris' } : null); cerrarModal(); estado('Pieza agregada: ' + f.rotulo(...v) + '.'); };
  box.appendChild(b);
}
async function detalleDiseno(d) {
  const box = $('#cat-detalle'); box.className = ''; box.innerHTML = '<h3 style="margin:0 0 4px;text-transform:capitalize">' + d.nombre + '</h3><p class="nota">Descargando el diseño…</p>';
  try {
    if (d.stl) {
      box.querySelector('p').textContent = 'Malla STL: se agrega tal cual.';
      const b = document.createElement('button'); b.className = 'btn pri'; b.textContent = 'Agregar';
      b.onclick = async () => { b.disabled = true; agregarMalla(motor.stlBuffer(await (await fetch(d.url)).arrayBuffer()), d.nombre); cerrarModal(); };
      box.appendChild(b); return;
    }
    const code = d.code || (d.code = await (await fetch(d.url)).text());
    if (catSel !== (d.modo === 'carton' ? 'c' : 'd') + d.archivo && catSel !== 'archivo') return;
    formulario(box, d, code);
  } catch (e) { box.querySelector('p').textContent = 'No se pudo descargar: ' + e.message; }
}
function formulario(box, d, code) {
  const params = motor.parametros(code);
  box.querySelector('p').textContent = d.modo === 'carton' ? 'Diseño de cartón: entra armado, con cada pieza suelta y con su nombre.' : 'Diseño de impresión 3D: elegí qué pieza y con qué medidas.';
  let g = '';
  params.forEach((p) => {
    if (p.grupo !== g) { g = p.grupo; const t = document.createElement('div'); t.className = 'par-g'; t.textContent = g; box.appendChild(t); }
    const fila = document.createElement('div'); fila.className = 'par-fila';
    fila.innerHTML = '<div>' + p.nombre.replace(/_/g, ' ') + (p.desc ? '<small></small>' : '') + '</div>';
    if (p.desc) fila.querySelector('small').textContent = p.desc.length > 90 ? p.desc.slice(0, 88) + '…' : p.desc;
    let i;
    if (p.tipo === 'bool') { i = document.createElement('input'); i.type = 'checkbox'; i.checked = p.valor; i.style.width = 'auto'; i.onchange = () => { p.valor = i.checked; }; }
    else if (p.opciones) { i = document.createElement('select'); p.opciones.forEach((o) => { const op = document.createElement('option'); op.value = o; op.textContent = o; i.appendChild(op); }); i.value = p.valor; i.onchange = () => { p.valor = p.tipo === 'num' ? +i.value : i.value; }; }
    else { i = document.createElement('input'); i.type = p.tipo === 'num' ? 'number' : 'text'; i.value = p.valor; if (p.min != null) i.min = p.min; if (p.max != null) i.max = p.max; if (p.paso) i.step = p.paso; i.oninput = () => { p.valor = p.tipo === 'num' ? (parseFloat(i.value) || 0) : i.value; }; }
    fila.appendChild(i); box.appendChild(fila);
  });
  const b = document.createElement('button'); b.className = 'btn pri'; b.textContent = 'Agregar a la guía'; b.style.marginTop = '12px';
  const msg = document.createElement('p'); msg.className = 'nota';
  b.onclick = async () => {
    b.disabled = true; const defs = motor.definiciones(params);
    const aviso = (t) => { msg.textContent = t; estado(t, 'ocup'); };
    try {
      if (d.modo === 'carton') { aviso('Renderizando (la primera vez carga el motor, ~14 MB)…'); agregarConjunto(await motor.importarCarton(code, defs, aviso)); }
      else {
        aviso('Renderizando (la primera vez carga el motor, ~14 MB)…');
        const pz = params.find((p) => p.nombre === 'pieza');
        agregarMalla(await motor.importar3d(code, defs), pz ? String(pz.valor).replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : d.nombre.replace(/^./, (c) => c.toUpperCase()));
      }
      cerrarModal(); estado('Agregado: ' + d.nombre + '.');
    } catch (e) { msg.textContent = 'Error: ' + e.message; estado('Error: ' + e.message, 'err'); b.disabled = false; }
  };
  box.append(b, msg);
}
function cerrarModal() { $('#modal').classList.remove('abierto'); }
$('#b-agregar').onclick = abrirModal; $('#mod-cerrar').onclick = cerrarModal;
$('#modal').addEventListener('click', (e) => { if (e.target === $('#modal')) cerrarModal(); });
$('#f-pieza').onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const nombre = f.name.replace(/\.(stl|scad)$/i, '').replace(/[-_]+/g, ' ');
  if (/\.stl$/i.test(f.name)) { agregarMalla(motor.stlBuffer(await f.arrayBuffer()), nombre); cerrarModal(); estado('Agregado: ' + nombre + '.'); return; }
  const code = await f.text(), d = { nombre, archivo: f.name, modo: /module\s+armado\s*\(/.test(code) && /module\s+plano\s*\(/.test(code) ? 'carton' : '3d', code };
  const box = $('#cat-detalle'); box.className = ''; box.innerHTML = '<h3 style="margin:0 0 4px">' + nombre + '</h3><p class="nota"></p>'; formulario(box, d, code);
};

/* ---------- Ficha ---------- */
let arte = null, fichaVieja = true, generando = false;
function datosFicha() {
  const partes = E.partes.filter((p) => !p.oculto).map((p) => {
    const mFinal = matriz(p, false), mExp = matriz(p, true);
    return { nombre: p.nombre, geoId: p.geoId, geometry: geoThree(p.geoId).g, mFinal, mExp, mGiro: new THREE.Matrix4(), paso: idxPaso(p.paso), relleno: p.relleno,
      cFinal: new THREE.Vector3(...p.pos), cExp: new THREE.Vector3(p.pos[0] + p.exp[0], p.pos[1] + p.exp[1], p.pos[2] + p.exp[2]), cajaFinal: cajaDe(p, false) };
  });
  const pasos = E.pasos.map((ps, i) => {
    const nombres = {}; E.partes.forEach((p) => { if (p.paso === ps.id && !p.oculto) { const n = p.nombre; nombres[n] = (nombres[n] || 0) + 1; } });
    const auto = Object.keys(nombres).map((n) => (nombres[n] > 1 ? nombres[n] + ' × ' : '') + n.toLowerCase()).join(', ');
    return { letra: LETRAS[i] || '?', titulo: ps.titulo || 'Paso', texto: ps.texto || (auto ? (i ? 'Colocar: ' : 'Preparar: ') + auto + '.' : ''), vista: ps.vista };
  });
  return { doc: E.doc, pasos, partes, vistaPortada: E.vistaPortada };
}
async function generarFicha() {
  if (generando) return; generando = true;
  try {
    if (!arte) arte = new Arte();
    if (document.fonts && document.fonts.load) { try { await Promise.all([400, 500, 600, 700, 800].map((w) => document.fonts.load(w + ' 12px Montserrat'))); await document.fonts.ready; } catch (e) {} }
    const d = datosFicha(), box = $('#hojas');
    if (!d.partes.length) { box.innerHTML = '<div class="vacio">Agregá piezas en el editor 3D y volvé acá para ver la ficha.</div>'; return; }
    const pags = await construirFicha(d, arte, (t) => estado(t, 'ocup'));
    box.innerHTML = pags.join('');
    fichaVieja = false; estado('Ficha lista: ' + pags.length + ' hoja' + (pags.length === 1 ? '' : 's') + ' A4.');
  } catch (e) { estado('No se pudo dibujar la ficha: ' + e.message, 'err'); console.error(e); }
  finally { generando = false; }
}
function pestana(ficha) {
  document.body.classList.toggle('en-ficha', ficha);
  $('#tab-editor').classList.toggle('act', !ficha); $('#tab-ficha').classList.toggle('act', ficha);
  if (ficha) { llenarDoc(); if (fichaVieja) generarFicha(); } else { medir(); }
}
$('#tab-editor').onclick = () => pestana(false); $('#tab-ficha').onclick = () => pestana(true);
$('#b-generar').onclick = generarFicha;
const DOC = { 'd-titulo': 'titulo', 'd-version': 'version', 'd-fecha': 'fecha', 'd-subtitulo': 'subtitulo', 'd-autor': 'autor', 'd-descripcion': 'descripcion', 'd-tipo': 'tipo', 'd-resalte': 'resalte' };
function llenarDoc() {
  Object.keys(DOC).forEach((id) => { $('#' + id).value = E.doc[DOC[id]]; });
  $('#d-linea').value = String(E.doc.linea); $('#n-guia').value = E.doc.titulo; $('#d-sombra').checked = E.doc.sombra; $('#d-lista').checked = E.doc.listaPiezas;
  $('#d-vista').classList.toggle('act', !!E.vistaPortada);
}
let tFicha = null;
const refrescar = () => { fichaVieja = true; guardarPronto(); clearTimeout(tFicha); tFicha = setTimeout(generarFicha, 700); };
Object.keys(DOC).forEach((id) => { $('#' + id).oninput = (e) => { E.doc[DOC[id]] = e.target.value; if (id === 'd-titulo') $('#n-guia').value = e.target.value; refrescar(); }; });
$('#n-guia').oninput = (e) => { E.doc.titulo = e.target.value; $('#d-titulo').value = e.target.value; refrescar(); };
$('#d-linea').onchange = (e) => { E.doc.linea = +e.target.value; refrescar(); };
$('#d-sombra').onchange = (e) => { E.doc.sombra = e.target.checked; refrescar(); };
$('#d-lista').onchange = (e) => { E.doc.listaPiezas = e.target.checked; refrescar(); };
$('#d-vista').onclick = () => { E.vistaPortada = vistaActual(); llenarDoc(); refrescar(); };
$('#d-vista-no').onclick = () => { E.vistaPortada = null; llenarDoc(); refrescar(); };
let zoom = 0.62;
const ponerZoom = (z) => { zoom = Math.min(1.4, Math.max(0.3, z)); $('#hojas').style.setProperty('--zoom', zoom); };
$('#z-mas').onclick = () => ponerZoom(zoom + 0.1); $('#z-menos').onclick = () => ponerZoom(zoom - 0.1);
$('#b-imprimir').onclick = async () => { pestana(true); if (fichaVieja || !$('#hojas .hoja')) await generarFicha(); if ($('#hojas .hoja')) setTimeout(() => window.print(), 150); };
// Vista previa de un paso dentro del editor
$('#b-previa').onclick = async () => {
  const d = datosFicha(), i = idxPaso(pasoId);
  if (!d.partes.some((p) => p.paso <= i)) { estado('Este paso todavía no tiene piezas.', 'err'); return; }
  if (!arte) arte = new Arte();
  estado('Dibujando el paso…', 'ocup'); await new Promise((r) => setTimeout(r, 30));
  const fig = figuraPaso(d, i, arte, 900, 620), a = fig.art;
  $('#previa-fig').innerHTML = `<div class="fig" style="aspect-ratio:${a.w}/${a.h}"><img src="${a.canvas.toDataURL('image/png')}" alt=""><svg viewBox="0 0 ${a.w} ${a.h}" xmlns="http://www.w3.org/2000/svg">${fig.svg}</svg></div>`;
  $('#previa').classList.add('abierta'); estado('Así se dibuja el paso ' + d.pasos[i].letra + ' en la ficha.');
};
$('#previa-cerrar').onclick = () => $('#previa').classList.remove('abierta');

/* ---------- Guardar / abrir ---------- */
const b64 = (f32) => { const u = new Uint8Array(f32.buffer, f32.byteOffset, f32.byteLength); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const deB64 = (s) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new Float32Array(u.buffer); };
function db() { return new Promise((res, rej) => { const r = indexedDB.open('fisicabit-guias', 1); r.onupgradeneeded = () => r.result.createObjectStore('guia'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
let tGuardar = null;
function guardarPronto() { clearTimeout(tGuardar); tGuardar = setTimeout(async () => { try { const d = await db(); d.transaction('guia', 'readwrite').objectStore('guia').put(E, 'actual'); } catch (e) {} }, 900); }
function cargar(datos) {
  ui.meshes.forEach((m) => { scene.remove(m); m.material.dispose(); }); ui.meshes.clear();
  ui.geos.forEach((o) => { o.g.dispose(); o.aristas.dispose(); }); ui.geos.clear(); tc.detach();
  E = datos; E.doc = ponerAlDia(E.doc);
  if (!E.pasos || !E.pasos.length) E.pasos = [{ id: uid(), titulo: 'Base', texto: '', vista: null }];
  E.partes = (E.partes || []).filter((p) => E.geos[p.geoId]);
  E.partes.forEach((p) => { if (p.relleno === 'acento') p.relleno = 'oscuro'; });
  sel = null; pasoId = E.pasos[0].id; fichaVieja = true; entrada(false); cambio(); llenarDoc(); encuadrar();
}
$('#b-nuevo').onclick = () => { if (E.partes.length && !confirm('¿Empezar una guía vacía? Se pierde la actual si no la guardaste.')) return; cargar({ doc: docNuevo(), pasos: [], partes: [], geos: {}, vistaPortada: null }); $('#hojas').innerHTML = '<div class="vacio">Agregá piezas en el editor 3D y volvé acá para ver la ficha.</div>'; estado('Guía nueva: empezá por el nombre de la práctica o sistema.'); $('#n-guia').focus(); };
$('#b-guardar').onclick = () => {
  const out = Object.assign({}, E, { formato: 'fisicabit-guia-1', geos: {} });
  Object.keys(E.geos).forEach((k) => { out.geos[k] = { pos: b64(E.geos[k].pos) }; });
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' }));
  a.download = (E.doc.titulo || 'guia').toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '-').replace(/^-|-$/g, '') + '.guia.json';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); estado('Guía descargada: ' + a.download);
};
$('#b-abrir').onclick = () => $('#f-abrir').click();
$('#f-abrir').onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const d = JSON.parse(await f.text()); if (d.formato !== 'fisicabit-guia-1') throw new Error('no es una guía de fisicabit'); Object.keys(d.geos).forEach((k) => { d.geos[k].pos = deB64(d.geos[k].pos); }); delete d.formato; cargar(d); estado('Guía abierta: ' + f.name); }
  catch (er) { estado('No se pudo abrir: ' + er.message, 'err'); }
};

/* ---------- Embebida en el protocolo de práctico (guias/?embed=1 dentro del editor) ---------- */
// Dos botones mandan el trabajo al documento: el dibujo del dispositivo o el anexo de ensamblado.
const EMBEBIDA = /[?&]embed=1/.test(location.search) && window.parent !== window;
if (EMBEBIDA) {
  const enviar = async (armar) => {
    const d = datosFicha();
    if (!d.partes.length) { estado('Agregá piezas antes de insertar.', 'err'); return; }
    let P = null; try { P = window.parent.FbitProtocolo; } catch (e) {}
    if (!P || !P.recibir) { estado('No encuentro el editor del protocolo.', 'err'); return; }
    try {
      if (!arte) arte = new Arte();
      if (document.fonts && document.fonts.load) { try { await Promise.all([500, 800].map((w) => document.fonts.load(w + ' 19px Montserrat'))); } catch (e) {} }
      P.recibir(await armar(d));
    } catch (e) { estado('No se pudo insertar: ' + e.message, 'err'); console.error(e); }
  };
  const bImg = document.createElement('button'); bImg.className = 'btn'; bImg.id = 'b-ins-dibujo'; bImg.textContent = 'Insertar dibujo'; bImg.title = 'Inserta en el protocolo el dibujo del dispositivo armado, visto como lo estás mirando ahora';
  bImg.onclick = () => enviar(async (d) => { estado('Dibujando el dispositivo…', 'ocup'); await new Promise((r) => setTimeout(r, 30)); return { tipo: 'guia-imagen', titulo: (E.doc.titulo || '').trim(), png: await figuraArmado(d, arte, 1400, 1000, vistaActual()) }; });
  const bAnx = document.createElement('button'); bAnx.className = 'btn pri'; bAnx.id = 'b-ins-anexo'; bAnx.textContent = 'Insertar anexo de armado'; bAnx.title = 'Agrega al protocolo un anexo con el dispositivo armado, la lista de piezas y un dibujo por paso';
  bAnx.onclick = () => enviar(async (d) => ({ tipo: 'guia-anexo', datos: await exportarProtocolo(d, arte, (t) => estado(t, 'ocup')) }));
  const imp = $('#b-imprimir'); imp.classList.remove('pri'); imp.parentNode.insertBefore(bImg, imp); imp.parentNode.insertBefore(bAnx, imp);
  document.body.classList.add('embebida');
}

/* ---------- Inicio ---------- */
medir(); cambio(); llenarDoc();
(async () => { try { const d = await db(); const r = d.transaction('guia').objectStore('guia').get('actual'); r.onsuccess = () => { if (r.result && r.result.partes && r.result.partes.length) { cargar(r.result); estado('Se recuperó la guía en la que estabas trabajando.'); } }; } catch (e) {} })();
// Para pruebas y uso avanzado desde la consola
window.__guias = { datosFicha, exportarProtocolo: () => { if (!arte) arte = new Arte(); return exportarProtocolo(datosFicha(), arte); }, get E() { return E; }, pantalla: (v) => { const q = new THREE.Vector3(...v).project(camera), r = lienzo.getBoundingClientRect(); return [r.left + (q.x * 0.5 + 0.5) * r.width, r.top + (1 - (q.y * 0.5 + 0.5)) * r.height]; }, motor, agregarMalla, agregarConjunto, generarFicha, pestana, elegir, encuadrar, cambio, entrada, FERRETERIA, setPaso: (id) => { pasoId = id; cambio(); } };
