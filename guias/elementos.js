// Elementos básicos de laboratorio para las guías de armado: se dibujan al instante
// (sin OpenSCAD) y se pueden sumar a cualquier montaje. Medidas en mm, Z hacia arriba.
//   { id, nombre, grupo, desc, campos: [[rótulo, valor inicial, clave]], hacer(...valores) → Float32Array, rotulo(...valores), relleno? }
import * as THREE from 'three';

const prim = (g) => new Float32Array((g.index ? g.toNonIndexed() : g).attributes.position.array);
const junta = (...ps) => { const n = ps.reduce((a, p) => a + p.length, 0), o = new Float32Array(n); let k = 0; ps.forEach((p) => { o.set(p, k); k += p.length; }); return o; };
const caja = (x, y, z, cx = 0, cy = 0, cz = 0) => prim(new THREE.BoxGeometry(x, y, z).translate(cx, cy, cz));
// cilindro de diámetro d y largo h con eje 'x', 'y' o 'z', centrado en (cx, cy, cz)
const cil = (d, h, cx = 0, cy = 0, cz = 0, eje = 'z', seg = 40) => {
  const g = new THREE.CylinderGeometry(d / 2, d / 2, h, seg);
  if (eje === 'z') g.rotateX(Math.PI / 2); else if (eje === 'x') g.rotateZ(Math.PI / 2);
  return prim(g.translate(cx, cy, cz));
};
const esfera = (d, cx = 0, cy = 0, cz = 0) => prim(new THREE.SphereGeometry(d / 2, 32, 20).rotateX(Math.PI / 2).translate(cx, cy, cz));
// anillo de alambre (para ganchos): en el plano XZ, centrado
const aro = (d, alambre, cx = 0, cy = 0, cz = 0, arco = Math.PI * 2) => prim(new THREE.TorusGeometry(d / 2, alambre / 2, 10, 28, arco).rotateX(Math.PI / 2).translate(cx, cy, cz));
// tubo: cilindro hueco de eje Z, apoyado en z = cz
const tubo = (dext, dint, h, cx = 0, cy = 0, cz = 0) => { const s = new THREE.Shape(); s.absarc(0, 0, dext / 2, 0, Math.PI * 2, false); const a = new THREE.Path(); a.absarc(0, 0, dint / 2, 0, Math.PI * 2, true); s.holes.push(a); return prim(new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 40 }).translate(cx, cy, cz)); };
// perfil [[x, z], …] en el plano XZ, extruido «ancho» en Y (centrado en Y)
const perfil = (pts, ancho) => { const s = new THREE.Shape(); pts.forEach((p, i) => s[i ? 'lineTo' : 'moveTo'](p[0], p[1])); s.closePath(); return prim(new THREE.ExtrudeGeometry(s, { depth: ancho, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, ancho / 2, 0)); };
class Helice extends THREE.Curve { constructor(r, largo, vueltas) { super(); this.r = r; this.l = largo; this.n = vueltas; } getPoint(t, o = new THREE.Vector3()) { const a = t * this.n * Math.PI * 2; return o.set(this.r * Math.cos(a), this.r * Math.sin(a), this.l * t); } }
const rueda = (d, ancho, cx, cy, cz) => junta(cil(d, ancho, cx, cy, cz, 'y'), cil(d * 0.35, ancho + 2, cx, cy, cz, 'y', 20));
const redondeada = (w, h, r, esp) => { const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0); s.lineTo(w / 2, h / 2 - r); s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2); s.lineTo(-w / 2 + r, h / 2); s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI); s.lineTo(-w / 2, -h / 2 + r); s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5); return prim(new THREE.ExtrudeGeometry(s, { depth: esp, bevelEnabled: false, curveSegments: 8 })); };
const hexagono = (af) => { const s = new THREE.Shape(), r = af / Math.sqrt(3); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; s[i ? 'lineTo' : 'moveTo'](r * Math.cos(a), r * Math.sin(a)); } s.closePath(); return s; };
const AF = { 3: 5.5, 4: 7, 5: 8, 6: 10, 8: 13, 10: 17 };
const n = (v) => String(Math.round(v * 10) / 10).replace('.', ',');
const lado = (masa) => 22 * Math.cbrt(Math.max(5, masa) / 100);   // tamaño de una pesa de latón según su masa

export const GRUPOS = ['Soportes y estructura', 'Mecánica', 'Electrónica y sensores', 'Recipientes y calor', 'Ferretería'];

export const ELEMENTOS = [
  /* ===== Soportes y estructura ===== */
  { id: 'soporte-universal', nombre: 'Soporte universal', grupo: 0, desc: 'Base pesada con una varilla vertical.', relleno: 'gris',
    campos: [['Alto de la varilla (mm)', 600, 'alto']], rotulo: (a) => 'Soporte universal ' + n(a),
    hacer: (a) => junta(caja(200, 130, 15, 0, 0, 7.5), cil(12, a, 0, 40, 15 + a / 2), cil(22, 10, 0, 40, 20)) },
  { id: 'varilla', nombre: 'Varilla', grupo: 0, desc: 'Varilla metálica. Entra parada; girala 90° para ponerla horizontal.', relleno: 'gris',
    campos: [['Diámetro (mm)', 12, 'diametro'], ['Largo (mm)', 300, 'largo']], rotulo: (d, L) => 'Varilla ' + n(d) + ' × ' + n(L),
    hacer: (d, L) => cil(d, L, 0, 0, L / 2) },
  { id: 'nuez', nombre: 'Nuez doble', grupo: 0, desc: 'Une dos varillas en cruz.', relleno: 'gris',
    campos: [], rotulo: () => 'Nuez doble',
    hacer: () => junta(caja(30, 30, 52, 0, 0, 26), cil(8, 22, 26, 0, 13, 'x', 20), cil(16, 6, 40, 0, 13, 'x', 20), cil(8, 22, 0, -26, 39, 'y', 20), cil(16, 6, 0, -40, 39, 'y', 20)) },
  { id: 'pinza', nombre: 'Pinza de laboratorio', grupo: 0, desc: 'Varilla con una pinza en la punta para sostener objetos.', relleno: 'gris',
    campos: [['Largo (mm)', 180, 'largo']], rotulo: () => 'Pinza',
    hacer: (L) => junta(cil(10, L, L / 2, 0, 0, 'x'), caja(14, 44, 12, L + 7, 0, 0), caja(40, 6, 12, L + 34, 19, 0), caja(40, 6, 12, L + 34, -19, 0)) },
  { id: 'mesa', nombre: 'Mesa (tablero)', grupo: 0, desc: 'El tablero de la mesa de trabajo, para apoyar el montaje.',
    campos: [['Largo (mm)', 1200, 'largo'], ['Ancho (mm)', 600, 'ancho']], rotulo: () => 'Mesa',
    hacer: (L, A) => caja(L, A, 30, 0, 0, -15) },
  { id: 'bloque', nombre: 'Bloque o placa', grupo: 0, desc: 'Un bloque de las medidas que quieras: taco, tope, placa, caja.',
    campos: [['Largo X (mm)', 60, 'x'], ['Ancho Y (mm)', 40, 'y'], ['Alto Z (mm)', 10, 'z']], rotulo: (x, y, z) => 'Bloque ' + n(x) + ' × ' + n(y) + ' × ' + n(z),
    hacer: (x, y, z) => caja(x, y, z, 0, 0, z / 2) },
  { id: 'riel', nombre: 'Riel o pista', grupo: 0, desc: 'Pista recta con bordes para que ruede un carrito.', relleno: 'gris',
    campos: [['Largo (mm)', 1000, 'largo'], ['Ancho (mm)', 90, 'ancho']], rotulo: (L) => 'Riel ' + n(L),
    hacer: (L, A) => junta(caja(L, A, 6, 0, 0, 3), caja(L, 4, 12, 0, A / 2 - 2, 12), caja(L, 4, 12, 0, -A / 2 + 2, 12)) },
  { id: 'plano-inclinado', nombre: 'Plano inclinado', grupo: 0, desc: 'Rampa: el largo es el de la superficie por la que se desliza o rueda el cuerpo. La parte alta queda del lado −X.',
    campos: [['Largo de la rampa (mm)', 600, 'largo'], ['Ángulo (°)', 20, 'angulo'], ['Ancho (mm)', 110, 'ancho']], rotulo: (L, a) => 'Plano inclinado ' + n(a) + '°',
    hacer: (L, a, A) => { const r = Math.min(80, Math.max(2, a)) * Math.PI / 180, b = L * Math.cos(r), h = L * Math.sin(r); return perfil([[-b / 2, 0], [b / 2, 0], [-b / 2, h]], A); } },

  /* ===== Mecánica ===== */
  { id: 'resorte', nombre: 'Resorte', grupo: 1, desc: 'Resorte de tracción con un gancho en cada punta. Cuelga a lo largo de Z.', relleno: 'gris',
    campos: [['Diámetro (mm)', 20, 'diametro'], ['Largo (mm)', 90, 'largo'], ['Vueltas', 14, 'vueltas']], rotulo: () => 'Resorte',
    hacer: (d, L, v) => { const al = Math.max(1.2, d * 0.07), g = d * 0.6, cuerpo = Math.max(10, L - 2 * g); return junta(prim(new THREE.TubeGeometry(new Helice(d / 2, cuerpo, Math.max(3, Math.round(v))), Math.max(60, Math.round(v) * 22), al / 2, 6, false).translate(0, 0, g)), aro(g, al, 0, 0, g / 2), aro(g, al, 0, 0, L - g / 2)); } },
  { id: 'masa-gancho', nombre: 'Masa con gancho', grupo: 1, desc: 'Pesa cilíndrica con un gancho arriba.', relleno: 'gris',
    campos: [['Masa (g)', 100, 'masa']], rotulo: (m) => 'Masa de ' + n(m) + ' g',
    hacer: (m) => { const d = lado(m), h = d * 1.15; return junta(cil(d, h, 0, 0, h / 2), cil(d * 0.12, d * 0.35, 0, 0, h + d * 0.17, 'z', 12), aro(d * 0.42, d * 0.1, 0, 0, h + d * 0.5)); } },
  { id: 'pesa-ranurada', nombre: 'Pesa ranurada', grupo: 1, desc: 'Disco con una ranura para apilar en el portapesas.', relleno: 'gris',
    campos: [['Masa (g)', 50, 'masa']], rotulo: (m) => 'Pesa de ' + n(m) + ' g',
    hacer: (m) => { const r = 19, h = Math.max(3, 5 * m / 50), a = 0.16, s = new THREE.Shape(); s.moveTo(2.6, 0.01); s.lineTo(r * Math.cos(a), r * Math.sin(a)); s.absarc(0, 0, r, a, Math.PI * 2 - a, false); s.lineTo(2.6, -0.01); s.absarc(0, 0, 2.6, -0.01, 0.01, true); return prim(new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 36 })); } },
  { id: 'portapesas', nombre: 'Portapesas', grupo: 1, desc: 'Platillo con vástago y gancho para colgar pesas ranuradas.', relleno: 'gris',
    campos: [['Alto (mm)', 100, 'alto']], rotulo: () => 'Portapesas',
    hacer: (a) => junta(cil(38, 4, 0, 0, 2), cil(4, a - 12, 0, 0, 4 + (a - 12) / 2, 'z', 14), aro(11, 2.2, 0, 0, a - 5)) },
  { id: 'polea', nombre: 'Polea con gancho', grupo: 1, desc: 'Polea liviana con horquilla y gancho para colgarla.', relleno: 'gris',
    campos: [['Diámetro (mm)', 50, 'diametro']], rotulo: (d) => 'Polea ' + n(d),
    hacer: (d) => { const z = d / 2; return junta(cil(d, 2, 0, -3.5, z, 'y'), cil(d, 2, 0, 3.5, z, 'y'), cil(d - 8, 5, 0, 0, z, 'y'), cil(4, 18, 0, 0, z, 'y', 14), caja(8, 2, d * 0.75, 0, 7, z + d * 0.32), caja(8, 2, d * 0.75, 0, -7, z + d * 0.32), caja(8, 16, 3, 0, 0, z + d * 0.7), aro(12, 2.4, 0, 0, z + d * 0.7 + 7)); } },
  { id: 'polea-de-mesa', nombre: 'Polea con prensa de mesa', grupo: 1, desc: 'Polea que se aprieta en el borde de la mesa o del riel. La rueda queda del lado +X.', relleno: 'gris',
    campos: [['Diámetro (mm)', 50, 'diametro']], rotulo: () => 'Polea de mesa',
    hacer: (d) => junta(caja(40, 24, 8, -20, 0, 4), caja(8, 24, 46, -36, 0, -15), caja(40, 24, 8, -20, 0, -34), cil(8, 26, -14, 0, -22, 'z', 16), caja(46, 6, 8, 20, 0, 12), cil(d, 2, 40, -3.5, 12, 'y'), cil(d, 2, 40, 3.5, 12, 'y'), cil(d - 8, 5, 40, 0, 12, 'y'), cil(4, 16, 40, 0, 12, 'y', 14)) },
  { id: 'carrito', nombre: 'Carrito de dinámica', grupo: 1, desc: 'Carro de bajo rozamiento con cuatro ruedas. Avanza a lo largo de X.',
    campos: [['Largo (mm)', 160, 'largo']], rotulo: () => 'Carrito',
    hacer: (L) => { const A = 70, r = 14, x = L / 2 - 26; return junta(caja(L, A, 26, 0, 0, r + 15), caja(L - 30, A - 16, 6, 0, 0, r + 31), rueda(r * 2, 8, x, A / 2 + 2, r), rueda(r * 2, 8, x, -A / 2 - 2, r), rueda(r * 2, 8, -x, A / 2 + 2, r), rueda(r * 2, 8, -x, -A / 2 - 2, r)); } },
  { id: 'autito', nombre: 'Autito', grupo: 1, desc: 'Autito de juguete. Avanza a lo largo de X.',
    campos: [['Largo (mm)', 110, 'largo']], rotulo: () => 'Autito',
    hacer: (L) => { const k = L / 110, A = 46 * k, r = 9 * k, p = [[-55, 8], [55, 8], [55, 20], [34, 23], [20, 36], [-22, 36], [-38, 24], [-55, 22]].map((q) => [q[0] * k, q[1] * k]); return junta(perfil(p, A), rueda(r * 2, 7 * k, 34 * k, A / 2 + 1, r), rueda(r * 2, 7 * k, 34 * k, -A / 2 - 1, r), rueda(r * 2, 7 * k, -34 * k, A / 2 + 1, r), rueda(r * 2, 7 * k, -34 * k, -A / 2 - 1, r)); } },
  { id: 'esfera', nombre: 'Esfera o bolita', grupo: 1, desc: 'Bolita, pelota o lenteja de un péndulo.', relleno: 'gris',
    campos: [['Diámetro (mm)', 25, 'diametro']], rotulo: (d) => 'Esfera ' + n(d), hacer: (d) => esfera(d, 0, 0, d / 2) },
  { id: 'lenteja', nombre: 'Lenteja de péndulo', grupo: 1, desc: 'Esfera con un ojal arriba para atarle el hilo.', relleno: 'gris',
    campos: [['Diámetro (mm)', 30, 'diametro']], rotulo: () => 'Lenteja', hacer: (d) => junta(esfera(d, 0, 0, d / 2), aro(d * 0.3, d * 0.07, 0, 0, d + d * 0.1)) },
  { id: 'cilindro', nombre: 'Cilindro', grupo: 1, desc: 'Cilindro macizo: cuerpo para rodar, pesa, tubo.',
    campos: [['Diámetro (mm)', 30, 'diametro'], ['Alto (mm)', 40, 'alto']], rotulo: (d, h) => 'Cilindro ' + n(d) + ' × ' + n(h), hacer: (d, h) => cil(d, h, 0, 0, h / 2) },
  { id: 'hilo', nombre: 'Hilo', grupo: 1, desc: 'Tramo recto de hilo o cuerda. Entra vertical; girándolo queda horizontal o inclinado.', relleno: 'oscuro',
    campos: [['Largo (mm)', 300, 'largo']], rotulo: (L) => 'Hilo ' + n(L), hacer: (L) => cil(1.6, L, 0, 0, L / 2, 'z', 8) },
  { id: 'regla', nombre: 'Regla', grupo: 1, desc: 'Regla graduada cada 1 cm. Entra acostada a lo largo de X; girala para pararla.',
    campos: [['Largo (mm)', 300, 'largo']], rotulo: (L) => 'Regla ' + n(L),
    hacer: (L) => { const ps = [caja(L, 30, 3, 0, 0, 1.5)]; for (let x = 0; x <= L - 10 + 0.01; x += 10) { const k = Math.round(x / 10), h = k % 10 === 0 ? 16 : k % 5 === 0 ? 12 : 7; ps.push(caja(0.8, h, 0.5, -L / 2 + 5 + x, 15 - h / 2, 3.2)); } return junta(...ps); } },
  { id: 'dinamometro', nombre: 'Dinamómetro', grupo: 1, desc: 'Tubo con resorte y dos ganchos para medir fuerzas.',
    campos: [['Largo (mm)', 140, 'largo']], rotulo: () => 'Dinamómetro',
    hacer: (L) => junta(cil(18, L - 40, 0, 0, L / 2), aro(12, 2.2, 0, 0, L - 12), cil(2.2, 12, 0, 0, L - 22, 'z', 10), cil(3, 22, 0, 0, 13, 'z', 10), aro(12, 2.2, 0, 0, 6)) },
  { id: 'iman', nombre: 'Imán en barra', grupo: 1, desc: 'Imán recto con sus dos polos marcados.', relleno: 'gris',
    campos: [['Largo (mm)', 60, 'largo']], rotulo: () => 'Imán', hacer: (L) => junta(caja(L / 2, 15, 10, -L / 4, 0, 5), caja(L / 2, 14, 9, L / 4, 0, 5)) },

  /* ===== Electrónica y sensores ===== */
  { id: 'microbit', nombre: 'micro:bit', grupo: 2, desc: 'La placa, acostada con la pantalla hacia arriba y el conector de borde hacia −Y. Girala 90° en X para pararla.',
    campos: [], rotulo: () => 'micro:bit',
    hacer: () => { const ps = [redondeada(51.6, 42, 3, 1.6), caja(6, 6, 3.4, -19, 0, 3.3), caja(6, 6, 3.4, 19, 0, 3.3), cil(3.4, 1.2, -19, 0, 5.4, 'z', 16), cil(3.4, 1.2, 19, 0, 5.4, 'z', 16), caja(12, 7, 3, 0, 17.5, -1.5)];
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) ps.push(caja(1.1, 2.2, 0.7, (i - 2) * 4, 3 + (j - 2) * 4, 1.95));
      [-22, -11, 0, 11, 22].forEach((x) => ps.push(tubo(8.4, 4, 0.4, x, -16.2, 1.6))); return junta(...ps); } },
  { id: 'portapilas', nombre: 'Portapilas', grupo: 2, desc: 'Caja para 2 pilas con su cable.', relleno: 'gris',
    campos: [], rotulo: () => 'Portapilas', hacer: () => junta(caja(62, 32, 16, 0, 0, 8), cil(13, 50, 0, -8, 13, 'x', 24), cil(13, 50, 0, 8, 13, 'x', 24), caja(6, 5, 3, 34, 0, 6)) },
  { id: 'ultrasonido', nombre: 'Sensor de ultrasonido HC-SR04', grupo: 2, desc: 'Parado, con los dos «ojos» mirando hacia −Y. Girándolo se lo apunta hacia el carrito o hacia abajo.',
    campos: [], rotulo: () => 'Sensor de ultrasonido',
    hacer: () => junta(caja(45, 1.6, 20, 0, 0, 10), cil(16, 12, -13, -6.8, 10, 'y'), cil(16, 12, 13, -6.8, 10, 'y'), cil(12.5, 0.6, -13, -13, 10, 'y', 24), cil(12.5, 0.6, 13, -13, 10, 'y', 24), caja(10.2, 2.5, 2.5, 0, 2, 1.25), ...[-3.81, -1.27, 1.27, 3.81].map((x) => caja(0.7, 0.7, 8, x, 2, -3))) },
  { id: 'sensor', nombre: 'Módulo sensor', grupo: 2, desc: 'Plaqueta chica genérica (temperatura, presión, luz, Hall, acelerómetro…). Ponele el nombre del sensor.',
    campos: [['Largo (mm)', 30, 'largo'], ['Ancho (mm)', 20, 'ancho']], rotulo: () => 'Sensor',
    hacer: (L, A) => junta(caja(L, A, 1.6, 0, 0, 0.8), caja(L * 0.3, A * 0.4, 2, L * 0.12, 0, 2.6), caja(2.6, Math.min(A - 4, 10.5), 2.6, -L / 2 + 2.6, 0, 2.9), ...[-3.81, -1.27, 1.27, 3.81].filter((y) => Math.abs(y) < A / 2 - 2).map((y) => caja(0.7, 0.7, 7, -L / 2 + 2.6, y, 6))) },
  { id: 'barrera-optica', nombre: 'Barrera óptica (fotopuerta)', grupo: 2, desc: 'Horquilla con un haz de luz: detecta cuándo pasa un objeto.',
    campos: [['Abertura (mm)', 60, 'abertura']], rotulo: () => 'Barrera óptica',
    hacer: (a) => junta(caja(a + 24, 16, 10, 0, 0, 5), caja(12, 16, 70, -a / 2 - 6, 0, 45), caja(12, 16, 70, a / 2 + 6, 0, 45), cil(5, 2, -a / 2 + 0.5, 0, 62, 'x', 14), cil(5, 2, a / 2 - 0.5, 0, 62, 'x', 14)) },
  { id: 'protoboard', nombre: 'Protoboard', grupo: 2, desc: 'Placa de pruebas para armar el circuito.',
    campos: [], rotulo: () => 'Protoboard', hacer: () => junta(caja(83, 26, 9, 0, 13.75, 4.5), caja(83, 26, 9, 0, -13.75, 4.5), caja(83, 1.5, 7, 0, 0, 3.5), caja(78, 0.8, 0.4, 0, 23.5, 9.2), caja(78, 0.8, 0.4, 0, -23.5, 9.2)) },
  { id: 'servo', nombre: 'Servo', grupo: 2, desc: 'Micro servo con su brazo, para mover o soltar algo.',
    campos: [], rotulo: () => 'Servo', hacer: () => junta(caja(23, 12.5, 22.5, 0, 0, 11.25), caja(32.5, 12.5, 2.5, 0, 0, 17), cil(11.5, 4, 5.5, 0, 24.5, 'z', 24), cil(4.6, 3.5, 5.5, 0, 28.2, 'z', 16), caja(22, 5.5, 1.6, 12.5, 0, 30.6)) },
  { id: 'motor', nombre: 'Motor', grupo: 2, desc: 'Motor chico de continua. El eje sale hacia +X.', relleno: 'gris',
    campos: [], rotulo: () => 'Motor', hacer: () => junta(cil(24, 30, 0, 0, 12, 'x'), cil(8, 3, 16.5, 0, 12, 'x', 20), cil(2, 10, 23, 0, 12, 'x', 12), cil(20, 3, -16.5, 0, 12, 'x', 24)) },
  { id: 'laser', nombre: 'Puntero láser', grupo: 2, desc: 'Cilindro que apunta hacia +X.', relleno: 'gris',
    campos: [], rotulo: () => 'Láser', hacer: () => junta(cil(13, 60, 0, 0, 6.5, 'x'), cil(9, 4, 32, 0, 6.5, 'x', 20)) },
  { id: 'celular', nombre: 'Celular o tablet', grupo: 2, desc: 'Para filmar, usar sus sensores o mostrar datos.',
    campos: [['Largo (mm)', 150, 'largo'], ['Ancho (mm)', 72, 'ancho']], rotulo: () => 'Celular', hacer: (L, A) => junta(redondeada(L, A, 8, 8), caja(L - 14, A - 10, 0.5, 0, 0, 8.2)) },

  /* ===== Recipientes y calor ===== */
  { id: 'vaso', nombre: 'Vaso de precipitados', grupo: 3, desc: 'Vaso de vidrio abierto arriba.',
    campos: [['Diámetro (mm)', 70, 'diametro'], ['Alto (mm)', 90, 'alto']], rotulo: () => 'Vaso de precipitados', hacer: (d, h) => junta(tubo(d, d - 4, h - 2, 0, 0, 2), cil(d, 2, 0, 0, 1)) },
  { id: 'termometro', nombre: 'Termómetro o sonda', grupo: 3, desc: 'Varilla fina con bulbo: termómetro o sonda de temperatura.', relleno: 'gris',
    campos: [['Largo (mm)', 200, 'largo']], rotulo: () => 'Termómetro', hacer: (L) => junta(cil(6, L - 8, 0, 0, 8 + (L - 8) / 2, 'z', 16), esfera(9, 0, 0, 4.5)) },
  { id: 'jeringa', nombre: 'Jeringa', grupo: 3, desc: 'Jeringa con su émbolo (ley de Boyle).',
    campos: [['Diámetro (mm)', 22, 'diametro'], ['Largo (mm)', 90, 'largo']], rotulo: () => 'Jeringa',
    hacer: (d, L) => junta(tubo(d, d - 3, L, 0, 0, 12), cil(5, 12, 0, 0, 6, 'z', 14), cil(d + 14, 2.5, 0, 0, L + 12), cil(6, L * 0.6, 0, 0, L + 13 + L * 0.3, 'z', 14), cil(d + 4, 3, 0, 0, L + 14 + L * 0.6)) },

  /* ===== Ferretería ===== */
  { id: 'tornillo', nombre: 'Tornillo hexagonal', grupo: 4, desc: 'Tornillo de cabeza hexagonal.', relleno: 'gris',
    campos: [['Rosca M', 6, 'rosca'], ['Largo (mm)', 30, 'largo']], rotulo: (d, L) => 'Tornillo M' + n(d) + ' × ' + n(L),
    hacer: (d, L) => junta(prim(new THREE.ExtrudeGeometry(hexagono(AF[d] || d * 1.65), { depth: d * 0.65, bevelEnabled: false }).translate(0, 0, L)), cil(d, L, 0, 0, L / 2, 'z', 32)) },
  { id: 'tuerca', nombre: 'Tuerca hexagonal', grupo: 4, desc: 'Tuerca hexagonal.', relleno: 'gris',
    campos: [['Rosca M', 6, 'rosca']], rotulo: (d) => 'Tuerca M' + n(d),
    hacer: (d) => { const s = hexagono(AF[d] || d * 1.65), h = new THREE.Path(); h.absarc(0, 0, d / 2, 0, Math.PI * 2, true); s.holes.push(h); return prim(new THREE.ExtrudeGeometry(s, { depth: d * 0.8, bevelEnabled: false, curveSegments: 24 })); } },
  { id: 'arandela', nombre: 'Arandela', grupo: 4, desc: 'Arandela plana.', relleno: 'gris',
    campos: [['Rosca M', 6, 'rosca']], rotulo: (d) => 'Arandela M' + n(d), hacer: (d) => tubo(d * 2, d + 0.4, Math.max(1, d * 0.2)) },
];

export const elemento = (id) => ELEMENTOS.find((e) => e.id === id) || null;
// Valores de los campos a partir de un objeto { clave: valor } (lo que falta toma el valor inicial)
export const valores = (e, params) => e.campos.map(([, def, clave]) => { const v = params && params[clave] != null ? parseFloat(params[clave]) : def; return isFinite(v) && v > 0 ? v : def; });
