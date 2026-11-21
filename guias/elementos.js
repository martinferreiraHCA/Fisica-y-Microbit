// Elementos básicos de laboratorio para las guías de armado: se dibujan al instante
// (sin OpenSCAD) y se pueden sumar a cualquier montaje. Medidas en mm, Z hacia arriba.
//   { id, nombre, grupo, desc, campos: [[rótulo, valor inicial, clave, opciones?]], hacer(...valores) → Float32Array, rotulo(...valores), relleno? }
//   · opciones: lista de valores permitidos (se elige de una lista: los volúmenes del material de vidrio)
//   · conjunto(...valores) → [{ nombre, pos, relleno }] en lugar de hacer(): varias piezas ya ubicadas entre sí (soportes armados)
// Todos los modelos son propios del sitio: se generan con este código a partir de medidas habituales de catálogo
// (aproximadas). No se usan archivos de terceros, así que no hay licencias ajenas que respetar.
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

/* ---------- Material de vidrio: cuerpos de revolución de pared fina ---------- */
// Gira un perfil cerrado [[r, z], …] alrededor de Z. El perfil sube por la pared de afuera y baja por la de adentro.
// pico = { z0, alto, ancho }: estira el borde hacia +X para formar el pico de vertido
function revol(pts, seg = 48, pico) {
  const zMax = Math.max(...pts.map((q) => q[1])), out = [], np = pts.length;
  const P = (k, j) => { const [r, z] = pts[k % np], a = (j % seg) * 2 * Math.PI / seg; let rr = r;
    if (pico && r > 0 && z > pico.z0) { const d = Math.abs(a > Math.PI ? a - 2 * Math.PI : a); if (d < pico.ancho) rr += pico.alto * Math.pow((z - pico.z0) / (zMax - pico.z0), 1.5) * Math.pow(Math.cos(d / pico.ancho * Math.PI / 2), 2); }
    return [rr * Math.cos(a), rr * Math.sin(a), z]; };
  for (let k = 0; k < np; k++) {
    const r0 = pts[k][0], r1 = pts[(k + 1) % np][0]; if (r0 === 0 && r1 === 0) continue;
    for (let j = 0; j < seg; j++) { const a = P(k, j), b = P(k, j + 1), c = P(k + 1, j + 1), d = P(k + 1, j); if (r0 > 0) out.push(...a, ...b, ...c); if (r1 > 0) out.push(...a, ...c, ...d); }
  }
  return new Float32Array(out);
}
// Perfil de un recipiente: la pared de afuera (del centro del fondo al borde) más la de adentro, a «t» de distancia
const vidrio = (ext, t, zFondo = t) => { const int = []; ext.slice().reverse().forEach(([r, z]) => { const q = [Math.max(0, r - t), Math.max(z, zFondo)], u = int[int.length - 1]; if (!u || Math.abs(u[0] - q[0]) + Math.abs(u[1] - q[1]) > 0.01) int.push(q); }); return ext.concat(int); };
// n puntos de una curva suave de a hasta b (sin incluir a), tirando hacia el punto de control c
const curva = (a, c, b, k = 4) => Array.from({ length: k }, (_, i) => { const u = (i + 1) / k, v = 1 - u; return [v * v * a[0] + 2 * u * v * c[0] + u * u * b[0], v * v * a[1] + 2 * u * v * c[1] + u * u * b[1]]; });
// Marcas de graduación: arcos finos sobre la pared, del lado de quien mira (−Y). lista = [[radio, z, largo del arco en rad], …]
const marcas = (lista) => junta(...lista.map(([r, z, arco]) => prim(new THREE.TorusGeometry(r, 0.5, 4, Math.max(6, Math.round(arco * 12)), arco).rotateZ(-Math.PI / 2 - arco / 2).translate(0, 0, z))));
// anillo de alambre horizontal (aro de soporte, trípode)
const anillo = (d, alambre, cx = 0, cy = 0, cz = 0) => prim(new THREE.TorusGeometry(d / 2, alambre / 2, 10, 40).translate(cx, cy, cz));
// barra redonda de un punto a otro
const barra = (a, b, d, seg = 14) => { const u = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = u.length(), g = new THREE.CylinderGeometry(d / 2, d / 2, L, seg); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), u.normalize())); return prim(g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2)); };
const mover = (pos, dx, dy, dz) => { for (let i = 0; i < pos.length; i += 3) { pos[i] += dx; pos[i + 1] += dy; pos[i + 2] += dz; } return pos; };
// Medidas habituales (mm) por volumen (mL)
const VASO = { 50: [42, 60], 100: [50, 70], 250: [70, 95], 400: [80, 110], 600: [90, 125], 1000: [105, 145], 2000: [132, 185] };                 // diámetro, alto
const PROBETA = { 10: [14, 140, 40], 25: [22, 170, 50], 50: [26, 200, 58], 100: [32, 255, 68], 250: [42, 330, 88], 500: [53, 385, 108], 1000: [66, 460, 128] };   // diámetro, alto, base
const ERLENMEYER = { 50: [51, 78, 22], 100: [64, 105, 22], 250: [85, 140, 34], 500: [105, 175, 34], 1000: [131, 220, 42] };                // base, alto, boca
const AFORADO = { 50: [50, 140, 12], 100: [60, 170, 14], 250: [80, 220, 16], 500: [100, 260, 20], 1000: [125, 300, 24] };                  // bulbo, alto, cuello
const BALON = { 100: [64, 105, 22], 250: [85, 140, 34], 500: [105, 170, 34], 1000: [131, 200, 42] };                                       // bulbo, alto, boca
const mL = (v) => (v >= 1000 ? n(v / 1000) + ' L' : n(v) + ' mL');
// Bulbo esférico de fondo plano con cuello (matraz aforado, balón)
function bulbo(D, H, dn, boca) {
  const R = D / 2, rn = dn / 2, zc = R * 0.94, f0 = Math.acos(0.94), f1 = Math.PI - Math.asin(Math.min(0.95, rn * 1.9 / R)), k = Math.ceil((f1 - f0) / 0.2), ext = [[0, 0]];
  for (let i = 0; i <= k; i++) { const f = f0 + (f1 - f0) * i / k; ext.push([R * Math.sin(f), zc - R * Math.cos(f)]); }
  const u = ext[ext.length - 1], zCuello = u[1] + rn * 1.4;
  ext.push(...curva(u, [rn, u[1] + rn * 0.5], [rn, zCuello], 3), [rn, H - 4], [rn + boca, H]);
  return { ext, zCuello };
}

/* ---------- Soportes ya armados (las piezas quedan sueltas: se pueden mover o quitar) ---------- */
// Todo en el sistema del soporte universal: base centrada en el origen, varilla vertical en (0, 40).
const basePz = (alto) => ({ nombre: 'Soporte universal', relleno: 'gris', pos: junta(caja(200, 130, 15, 0, 0, 7.5), cil(12, alto, 0, 40, 15 + alto / 2), cil(22, 10, 0, 40, 20)) });
const nuezPz = (h) => ({ nombre: 'Nuez doble', relleno: 'gris', pos: mover(junta(caja(30, 30, 52, 0, 0, 26), cil(8, 22, 26, 0, 13, 'x', 20), cil(16, 6, 40, 0, 13, 'x', 20), cil(8, 22, 0, -26, 39, 'y', 20), cil(16, 6, 0, -40, 39, 'y', 20)), 0, 40, h - 39) });
const pinzaG = (L) => junta(cil(10, L, L / 2, 0, 0, 'x'), caja(14, 44, 12, L + 7, 0, 0), caja(40, 6, 12, L + 34, 19, 0), caja(40, 6, 12, L + 34, -19, 0));
const aroG = (d, L = 110) => junta(cil(8, L, L / 2, 0, 0, 'x', 20), anillo(d + 6, 6, L + d / 2, 0, 0));
const rejillaG = (lado) => junta(caja(lado, lado, 1.2, 0, 0, 0.6), cil(lado * 0.62, 0.8, 0, 0, 1.6));
const tripodeG = (alto, d) => { const r = d / 2 + 3, ps = [anillo(d + 6, 6, 0, 0, alto - 3)]; for (let i = 0; i < 3; i++) { const a = Math.PI / 2 + i * 2 * Math.PI / 3; ps.push(barra([r * Math.cos(a), r * Math.sin(a), alto - 3], [(r + alto * 0.16) * Math.cos(a), (r + alto * 0.16) * Math.sin(a), 0], 6)); } return junta(...ps); };
const mecheroG = (alto) => junta(cil(70, 10, 0, 0, 5), cil(26, 12, 0, 0, 16), cil(13, alto - 22, 0, 0, 22 + (alto - 22) / 2, 'z', 24), cil(18, 14, 0, 0, 36, 'z', 24), cil(8, 34, 28, 0, 16, 'x', 16));
// el brazo sale hacia +X, a la altura h (eje del brazo), sostenido por la nuez
const alto0 = (alto, h) => Math.max(60, Math.min(alto - 10, h));

export const GRUPOS = ['Soportes y estructura', 'Soportes ya armados', 'Mecánica', 'Electrónica y sensores', 'Vidrio y recipientes', 'Balanza y calor', 'Ferretería'];

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
  { id: 'aro', nombre: 'Aro de soporte', grupo: 0, desc: 'Aro con su varilla: se sujeta con una nuez y sostiene la rejilla o un embudo. La varilla va a lo largo de X.', relleno: 'gris',
    campos: [['Diámetro (mm)', 90, 'diametro']], rotulo: (d) => 'Aro ' + n(d), hacer: (d) => aroG(d) },
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

  /* ===== Soportes ya armados ===== */
  { id: 'soporte-con-varilla', nombre: 'Soporte con nuez y varilla', grupo: 1, desc: 'Soporte universal con una nuez y una varilla horizontal, ya armado: para colgar un resorte, un péndulo o una polea. El brazo sale hacia +X.',
    campos: [['Alto del soporte (mm)', 600, 'alto'], ['Altura del brazo (mm)', 540, 'altura'], ['Largo del brazo (mm)', 250, 'largo']], rotulo: () => 'Soporte con nuez y varilla',
    conjunto: (alto, h, L) => { const z = alto0(alto, h); return [basePz(alto), nuezPz(z), { nombre: 'Varilla horizontal', relleno: 'gris', pos: cil(12, L, L / 2 - 30, 14, z, 'x') }]; } },
  { id: 'soporte-con-pinza', nombre: 'Soporte con nuez y pinza', grupo: 1, desc: 'Soporte universal con una nuez y una pinza, ya armado: para sostener un sensor, un termómetro, un tubo o un matraz. La pinza sale hacia +X.',
    campos: [['Alto del soporte (mm)', 600, 'alto'], ['Altura de la pinza (mm)', 350, 'altura'], ['Largo de la pinza (mm)', 180, 'largo']], rotulo: () => 'Soporte con nuez y pinza',
    conjunto: (alto, h, L) => { const z = alto0(alto, h); return [basePz(alto), nuezPz(z), { nombre: 'Pinza', relleno: 'gris', pos: mover(pinzaG(L), -20, 14, z) }]; } },
  { id: 'soporte-con-aro', nombre: 'Soporte con aro y rejilla', grupo: 1, desc: 'Soporte universal con una nuez, un aro y la rejilla apoyada encima, ya armado: para calentar un vaso o un matraz con el mechero debajo. El aro sale hacia +X.',
    campos: [['Alto del soporte (mm)', 500, 'alto'], ['Altura del aro (mm)', 200, 'altura'], ['Diámetro del aro (mm)', 90, 'diametro']], rotulo: () => 'Soporte con aro y rejilla',
    conjunto: (alto, h, d) => { const z = alto0(alto, h); return [basePz(alto), nuezPz(z), { nombre: 'Aro', relleno: 'gris', pos: mover(aroG(d), -20, 14, z) }, { nombre: 'Rejilla', relleno: 'puntos', pos: mover(rejillaG(d + 35), 90 + d / 2, 14, z + 3) }]; } },
  { id: 'soporte-para-calentar', nombre: 'Soporte con aro, rejilla y pinza', grupo: 1, desc: 'Soporte universal con el aro y la rejilla abajo y una pinza arriba, ya armado: el recipiente se apoya en la rejilla y la pinza sostiene el termómetro o la sonda.',
    campos: [['Alto del soporte (mm)', 600, 'alto'], ['Altura del aro (mm)', 200, 'altura'], ['Altura de la pinza (mm)', 420, 'pinza'], ['Diámetro del aro (mm)', 90, 'diametro']], rotulo: () => 'Soporte con aro, rejilla y pinza',
    conjunto: (alto, h, hp, d) => { const z = alto0(alto, h), zp = alto0(alto, Math.max(hp, z + 70)); return [basePz(alto), nuezPz(z), { nombre: 'Aro', relleno: 'gris', pos: mover(aroG(d), -20, 14, z) }, { nombre: 'Rejilla', relleno: 'puntos', pos: mover(rejillaG(d + 35), 90 + d / 2, 14, z + 3) }, nuezPz(zp), { nombre: 'Pinza', relleno: 'gris', pos: mover(pinzaG(76 + d / 2), -20, 14, zp) }]; } },
  { id: 'tripode-con-rejilla', nombre: 'Trípode con rejilla y mechero', grupo: 1, desc: 'Trípode con la rejilla encima y el mechero debajo, ya armado: la forma más simple de calentar un vaso.',
    campos: [['Alto del trípode (mm)', 200, 'alto'], ['Diámetro del aro (mm)', 100, 'diametro']], rotulo: () => 'Trípode con rejilla y mechero',
    conjunto: (alto, d) => [{ nombre: 'Trípode', relleno: 'gris', pos: tripodeG(alto, d) }, { nombre: 'Rejilla', relleno: 'puntos', pos: mover(rejillaG(d + 30), 0, 0, alto) }, { nombre: 'Mechero', relleno: 'gris', pos: mecheroG(Math.min(130, alto - 50)) }] },

  /* ===== Mecánica ===== */
  { id: 'resorte', nombre: 'Resorte', grupo: 2, desc: 'Resorte de tracción con un gancho en cada punta. Cuelga a lo largo de Z.', relleno: 'gris',
    campos: [['Diámetro (mm)', 20, 'diametro'], ['Largo (mm)', 90, 'largo'], ['Vueltas', 14, 'vueltas']], rotulo: () => 'Resorte',
    hacer: (d, L, v) => { const al = Math.max(1.2, d * 0.07), g = d * 0.6, cuerpo = Math.max(10, L - 2 * g); return junta(prim(new THREE.TubeGeometry(new Helice(d / 2, cuerpo, Math.max(3, Math.round(v))), Math.max(60, Math.round(v) * 22), al / 2, 6, false).translate(0, 0, g)), aro(g, al, 0, 0, g / 2), aro(g, al, 0, 0, L - g / 2)); } },
  { id: 'masa-gancho', nombre: 'Masa con gancho', grupo: 2, desc: 'Pesa cilíndrica con un gancho arriba.', relleno: 'gris',
    campos: [['Masa (g)', 100, 'masa']], rotulo: (m) => 'Masa de ' + n(m) + ' g',
    hacer: (m) => { const d = lado(m), h = d * 1.15; return junta(cil(d, h, 0, 0, h / 2), cil(d * 0.12, d * 0.35, 0, 0, h + d * 0.17, 'z', 12), aro(d * 0.42, d * 0.1, 0, 0, h + d * 0.5)); } },
  { id: 'pesa-ranurada', nombre: 'Pesa ranurada', grupo: 2, desc: 'Disco con una ranura para apilar en el portapesas.', relleno: 'gris',
    campos: [['Masa (g)', 50, 'masa']], rotulo: (m) => 'Pesa de ' + n(m) + ' g',
    hacer: (m) => { const r = 19, h = Math.max(3, 5 * m / 50), a = 0.16, s = new THREE.Shape(); s.moveTo(2.6, 0.01); s.lineTo(r * Math.cos(a), r * Math.sin(a)); s.absarc(0, 0, r, a, Math.PI * 2 - a, false); s.lineTo(2.6, -0.01); s.absarc(0, 0, 2.6, -0.01, 0.01, true); return prim(new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 36 })); } },
  { id: 'portapesas', nombre: 'Portapesas', grupo: 2, desc: 'Platillo con vástago y gancho para colgar pesas ranuradas.', relleno: 'gris',
    campos: [['Alto (mm)', 100, 'alto']], rotulo: () => 'Portapesas',
    hacer: (a) => junta(cil(38, 4, 0, 0, 2), cil(4, a - 12, 0, 0, 4 + (a - 12) / 2, 'z', 14), aro(11, 2.2, 0, 0, a - 5)) },
  { id: 'polea', nombre: 'Polea con gancho', grupo: 2, desc: 'Polea liviana con horquilla y gancho para colgarla.', relleno: 'gris',
    campos: [['Diámetro (mm)', 50, 'diametro']], rotulo: (d) => 'Polea ' + n(d),
    hacer: (d) => { const z = d / 2; return junta(cil(d, 2, 0, -3.5, z, 'y'), cil(d, 2, 0, 3.5, z, 'y'), cil(d - 8, 5, 0, 0, z, 'y'), cil(4, 18, 0, 0, z, 'y', 14), caja(8, 2, d * 0.75, 0, 7, z + d * 0.32), caja(8, 2, d * 0.75, 0, -7, z + d * 0.32), caja(8, 16, 3, 0, 0, z + d * 0.7), aro(12, 2.4, 0, 0, z + d * 0.7 + 7)); } },
  { id: 'polea-de-mesa', nombre: 'Polea con prensa de mesa', grupo: 2, desc: 'Polea que se aprieta en el borde de la mesa o del riel. La rueda queda del lado +X.', relleno: 'gris',
    campos: [['Diámetro (mm)', 50, 'diametro']], rotulo: () => 'Polea de mesa',
    hacer: (d) => junta(caja(40, 24, 8, -20, 0, 4), caja(8, 24, 46, -36, 0, -15), caja(40, 24, 8, -20, 0, -34), cil(8, 26, -14, 0, -22, 'z', 16), caja(46, 6, 8, 20, 0, 12), cil(d, 2, 40, -3.5, 12, 'y'), cil(d, 2, 40, 3.5, 12, 'y'), cil(d - 8, 5, 40, 0, 12, 'y'), cil(4, 16, 40, 0, 12, 'y', 14)) },
  { id: 'carrito', nombre: 'Carrito de dinámica', grupo: 2, desc: 'Carro de bajo rozamiento con cuatro ruedas. Avanza a lo largo de X.',
    campos: [['Largo (mm)', 160, 'largo']], rotulo: () => 'Carrito',
    hacer: (L) => { const A = 70, r = 14, x = L / 2 - 26; return junta(caja(L, A, 26, 0, 0, r + 15), caja(L - 30, A - 16, 6, 0, 0, r + 31), rueda(r * 2, 8, x, A / 2 + 2, r), rueda(r * 2, 8, x, -A / 2 - 2, r), rueda(r * 2, 8, -x, A / 2 + 2, r), rueda(r * 2, 8, -x, -A / 2 - 2, r)); } },
  { id: 'autito', nombre: 'Autito', grupo: 2, desc: 'Autito de juguete. Avanza a lo largo de X.',
    campos: [['Largo (mm)', 110, 'largo']], rotulo: () => 'Autito',
    hacer: (L) => { const k = L / 110, A = 46 * k, r = 9 * k, p = [[-55, 8], [55, 8], [55, 20], [34, 23], [20, 36], [-22, 36], [-38, 24], [-55, 22]].map((q) => [q[0] * k, q[1] * k]); return junta(perfil(p, A), rueda(r * 2, 7 * k, 34 * k, A / 2 + 1, r), rueda(r * 2, 7 * k, 34 * k, -A / 2 - 1, r), rueda(r * 2, 7 * k, -34 * k, A / 2 + 1, r), rueda(r * 2, 7 * k, -34 * k, -A / 2 - 1, r)); } },
  { id: 'esfera', nombre: 'Esfera o bolita', grupo: 2, desc: 'Bolita, pelota o lenteja de un péndulo.', relleno: 'gris',
    campos: [['Diámetro (mm)', 25, 'diametro']], rotulo: (d) => 'Esfera ' + n(d), hacer: (d) => esfera(d, 0, 0, d / 2) },
  { id: 'lenteja', nombre: 'Lenteja de péndulo', grupo: 2, desc: 'Esfera con un ojal arriba para atarle el hilo.', relleno: 'gris',
    campos: [['Diámetro (mm)', 30, 'diametro']], rotulo: () => 'Lenteja', hacer: (d) => junta(esfera(d, 0, 0, d / 2), aro(d * 0.3, d * 0.07, 0, 0, d + d * 0.1)) },
  { id: 'cilindro', nombre: 'Cilindro', grupo: 2, desc: 'Cilindro macizo: cuerpo para rodar, pesa, tubo.',
    campos: [['Diámetro (mm)', 30, 'diametro'], ['Alto (mm)', 40, 'alto']], rotulo: (d, h) => 'Cilindro ' + n(d) + ' × ' + n(h), hacer: (d, h) => cil(d, h, 0, 0, h / 2) },
  { id: 'hilo', nombre: 'Hilo', grupo: 2, desc: 'Tramo recto de hilo o cuerda. Entra vertical; girándolo queda horizontal o inclinado.', relleno: 'oscuro',
    campos: [['Largo (mm)', 300, 'largo']], rotulo: (L) => 'Hilo ' + n(L), hacer: (L) => cil(1.6, L, 0, 0, L / 2, 'z', 8) },
  { id: 'regla', nombre: 'Regla', grupo: 2, desc: 'Regla graduada cada 1 cm. Entra acostada a lo largo de X; girala para pararla.',
    campos: [['Largo (mm)', 300, 'largo']], rotulo: (L) => 'Regla ' + n(L),
    hacer: (L) => { const ps = [caja(L, 30, 3, 0, 0, 1.5)]; for (let x = 0; x <= L - 10 + 0.01; x += 10) { const k = Math.round(x / 10), h = k % 10 === 0 ? 16 : k % 5 === 0 ? 12 : 7; ps.push(caja(0.8, h, 0.5, -L / 2 + 5 + x, 15 - h / 2, 3.2)); } return junta(...ps); } },
  { id: 'dinamometro', nombre: 'Dinamómetro', grupo: 2, desc: 'Tubo con resorte y dos ganchos para medir fuerzas.',
    campos: [['Largo (mm)', 140, 'largo']], rotulo: () => 'Dinamómetro',
    hacer: (L) => junta(cil(18, L - 40, 0, 0, L / 2), aro(12, 2.2, 0, 0, L - 12), cil(2.2, 12, 0, 0, L - 22, 'z', 10), cil(3, 22, 0, 0, 13, 'z', 10), aro(12, 2.2, 0, 0, 6)) },
  { id: 'iman', nombre: 'Imán en barra', grupo: 2, desc: 'Imán recto con sus dos polos marcados.', relleno: 'gris',
    campos: [['Largo (mm)', 60, 'largo']], rotulo: () => 'Imán', hacer: (L) => junta(caja(L / 2, 15, 10, -L / 4, 0, 5), caja(L / 2, 14, 9, L / 4, 0, 5)) },

  /* ===== Electrónica y sensores ===== */
  { id: 'microbit', nombre: 'micro:bit', grupo: 3, desc: 'La placa, acostada con la pantalla hacia arriba y el conector de borde hacia −Y. Girala 90° en X para pararla.',
    campos: [], rotulo: () => 'micro:bit',
    hacer: () => { const ps = [redondeada(51.6, 42, 3, 1.6), caja(6, 6, 3.4, -19, 0, 3.3), caja(6, 6, 3.4, 19, 0, 3.3), cil(3.4, 1.2, -19, 0, 5.4, 'z', 16), cil(3.4, 1.2, 19, 0, 5.4, 'z', 16), caja(12, 7, 3, 0, 17.5, -1.5)];
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) ps.push(caja(1.1, 2.2, 0.7, (i - 2) * 4, 3 + (j - 2) * 4, 1.95));
      [-22, -11, 0, 11, 22].forEach((x) => ps.push(tubo(8.4, 4, 0.4, x, -16.2, 1.6))); return junta(...ps); } },
  { id: 'portapilas', nombre: 'Portapilas', grupo: 3, desc: 'Caja para 2 pilas con su cable.', relleno: 'gris',
    campos: [], rotulo: () => 'Portapilas', hacer: () => junta(caja(62, 32, 16, 0, 0, 8), cil(13, 50, 0, -8, 13, 'x', 24), cil(13, 50, 0, 8, 13, 'x', 24), caja(6, 5, 3, 34, 0, 6)) },
  { id: 'ultrasonido', nombre: 'Sensor de ultrasonido HC-SR04', grupo: 3, desc: 'Parado, con los dos «ojos» mirando hacia −Y. Girándolo se lo apunta hacia el carrito o hacia abajo.',
    campos: [], rotulo: () => 'Sensor de ultrasonido',
    hacer: () => junta(caja(45, 1.6, 20, 0, 0, 10), cil(16, 12, -13, -6.8, 10, 'y'), cil(16, 12, 13, -6.8, 10, 'y'), cil(12.5, 0.6, -13, -13, 10, 'y', 24), cil(12.5, 0.6, 13, -13, 10, 'y', 24), caja(10.2, 2.5, 2.5, 0, 2, 1.25), ...[-3.81, -1.27, 1.27, 3.81].map((x) => caja(0.7, 0.7, 8, x, 2, -3))) },
  { id: 'sensor', nombre: 'Módulo sensor', grupo: 3, desc: 'Plaqueta chica genérica (temperatura, presión, luz, Hall, acelerómetro…). Ponele el nombre del sensor.',
    campos: [['Largo (mm)', 30, 'largo'], ['Ancho (mm)', 20, 'ancho']], rotulo: () => 'Sensor',
    hacer: (L, A) => junta(caja(L, A, 1.6, 0, 0, 0.8), caja(L * 0.3, A * 0.4, 2, L * 0.12, 0, 2.6), caja(2.6, Math.min(A - 4, 10.5), 2.6, -L / 2 + 2.6, 0, 2.9), ...[-3.81, -1.27, 1.27, 3.81].filter((y) => Math.abs(y) < A / 2 - 2).map((y) => caja(0.7, 0.7, 7, -L / 2 + 2.6, y, 6))) },
  { id: 'barrera-optica', nombre: 'Barrera óptica (fotopuerta)', grupo: 3, desc: 'Horquilla con un haz de luz: detecta cuándo pasa un objeto.',
    campos: [['Abertura (mm)', 60, 'abertura']], rotulo: () => 'Barrera óptica',
    hacer: (a) => junta(caja(a + 24, 16, 10, 0, 0, 5), caja(12, 16, 70, -a / 2 - 6, 0, 45), caja(12, 16, 70, a / 2 + 6, 0, 45), cil(5, 2, -a / 2 + 0.5, 0, 62, 'x', 14), cil(5, 2, a / 2 - 0.5, 0, 62, 'x', 14)) },
  { id: 'protoboard', nombre: 'Protoboard', grupo: 3, desc: 'Placa de pruebas para armar el circuito.',
    campos: [], rotulo: () => 'Protoboard', hacer: () => junta(caja(83, 26, 9, 0, 13.75, 4.5), caja(83, 26, 9, 0, -13.75, 4.5), caja(83, 1.5, 7, 0, 0, 3.5), caja(78, 0.8, 0.4, 0, 23.5, 9.2), caja(78, 0.8, 0.4, 0, -23.5, 9.2)) },
  { id: 'servo', nombre: 'Servo', grupo: 3, desc: 'Micro servo con su brazo, para mover o soltar algo.',
    campos: [], rotulo: () => 'Servo', hacer: () => junta(caja(23, 12.5, 22.5, 0, 0, 11.25), caja(32.5, 12.5, 2.5, 0, 0, 17), cil(11.5, 4, 5.5, 0, 24.5, 'z', 24), cil(4.6, 3.5, 5.5, 0, 28.2, 'z', 16), caja(22, 5.5, 1.6, 12.5, 0, 30.6)) },
  { id: 'motor', nombre: 'Motor', grupo: 3, desc: 'Motor chico de continua. El eje sale hacia +X.', relleno: 'gris',
    campos: [], rotulo: () => 'Motor', hacer: () => junta(cil(24, 30, 0, 0, 12, 'x'), cil(8, 3, 16.5, 0, 12, 'x', 20), cil(2, 10, 23, 0, 12, 'x', 12), cil(20, 3, -16.5, 0, 12, 'x', 24)) },
  { id: 'laser', nombre: 'Puntero láser', grupo: 3, desc: 'Cilindro que apunta hacia +X.', relleno: 'gris',
    campos: [], rotulo: () => 'Láser', hacer: () => junta(cil(13, 60, 0, 0, 6.5, 'x'), cil(9, 4, 32, 0, 6.5, 'x', 20)) },
  { id: 'celular', nombre: 'Celular o tablet', grupo: 3, desc: 'Para filmar, usar sus sensores o mostrar datos.',
    campos: [['Largo (mm)', 150, 'largo'], ['Ancho (mm)', 72, 'ancho']], rotulo: () => 'Celular', hacer: (L, A) => junta(redondeada(L, A, 8, 8), caja(L - 14, A - 10, 0.5, 0, 0, 8.2)) },

  /* ===== Vidrio y recipientes ===== */
  { id: 'vaso', nombre: 'Vaso de bohemia (de precipitados)', grupo: 4, desc: 'Vaso de vidrio de forma baja, con pico y graduación. El pico queda hacia +X.',
    campos: [['Volumen (mL)', 250, 'volumen', [50, 100, 250, 400, 600, 1000, 2000]]], rotulo: (v) => 'Vaso de bohemia de ' + mL(v),
    hacer: (v) => { const [D, H] = VASO[v], R = D / 2, t = Math.max(1.6, D * 0.028), ext = [[0, 0], [R - 5, 0], ...curva([R - 5, 0], [R, 0], [R, 5]), [R, H - 5], [R + 1.5, H]];
      return junta(revol(vidrio(ext, t), 56, { z0: H - 7, alto: D * 0.1, ancho: 0.42 }), marcas([0.25, 0.4, 0.55, 0.7].map((f, k) => [R + 0.1, f * H, k % 2 ? 0.75 : 0.45]))); } },
  { id: 'probeta', nombre: 'Probeta graduada', grupo: 4, desc: 'Cilindro alto con base hexagonal, pico y graduación, para medir volúmenes. El pico queda hacia +X.',
    campos: [['Volumen (mL)', 100, 'volumen', [10, 25, 50, 100, 250, 500, 1000]]], rotulo: (v) => 'Probeta de ' + mL(v),
    hacer: (v) => { const [D, H, B] = PROBETA[v], R = D / 2, z0 = 12 + H * 0.06, z1 = H * 0.88, ms = [];
      for (let k = 0; k <= 20; k++) ms.push([R + 0.1, z0 + (z1 - z0) * k / 20, k % 2 ? 0.5 : k % 10 === 0 ? 1.3 : 0.9]);
      return junta(prim(new THREE.ExtrudeGeometry(hexagono(B), { depth: 7, bevelEnabled: false })), cil(D + 8, 5, 0, 0, 9.5), revol(vidrio([[0, 6], [R, 6], [R, H - 4], [R + 1.2, H]], 1.6, 12), 40, { z0: H - 6, alto: D * 0.16, ancho: 0.5 }), marcas(ms)); } },
  { id: 'erlenmeyer', nombre: 'Matraz Erlenmeyer', grupo: 4, desc: 'Matraz cónico de fondo plano y cuello angosto.',
    campos: [['Volumen (mL)', 250, 'volumen', [50, 100, 250, 500, 1000]]], rotulo: (v) => 'Matraz Erlenmeyer de ' + mL(v),
    hacer: (v) => { const [B, H, dn] = ERLENMEYER[v], R = B / 2, rn = dn / 2, zc = H * 0.74, a = [R - 1, 7], b = [rn + 2, zc - 6], rEn = (z) => a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]);
      const ext = [[0, 0], [R - 6, 0], ...curva([R - 6, 0], [R, 0], a), b, ...curva(b, [rn, zc], [rn, zc + 6], 3), [rn, H - 4], [rn + 1.5, H]];
      return junta(revol(vidrio(ext, 1.8), 56), marcas([0.2, 0.34, 0.48].map((f, k) => [rEn(f * H) + 0.1, f * H, k === 1 ? 0.8 : 0.5]))); } },
  { id: 'matraz-aforado', nombre: 'Matraz aforado', grupo: 4, desc: 'Matraz de bulbo con cuello largo, tapón y la marca del aforo: para preparar un volumen exacto.',
    campos: [['Volumen (mL)', 250, 'volumen', [50, 100, 250, 500, 1000]]], rotulo: (v) => 'Matraz aforado de ' + mL(v),
    hacer: (v) => { const [D, H, dn] = AFORADO[v], q = bulbo(D, H, dn, 1.2);
      return junta(revol(vidrio(q.ext, 1.6), 56), anillo(dn + 0.6, 1, 0, 0, q.zCuello + (H - q.zCuello) * 0.5), cil(dn + 7, 9, 0, 0, H + 4.5, 'z', 24), cil(dn - 4, 6, 0, 0, H + 12, 'z', 24)); } },
  { id: 'balon', nombre: 'Matraz balón (fondo plano)', grupo: 4, desc: 'Matraz de bulbo redondo con cuello corto, que se apoya solo.',
    campos: [['Volumen (mL)', 250, 'volumen', [100, 250, 500, 1000]]], rotulo: (v) => 'Matraz balón de ' + mL(v),
    hacer: (v) => { const [D, H, dn] = BALON[v]; return revol(vidrio(bulbo(D, H, dn, 1.8).ext, 1.8), 56); } },
  { id: 'tubo-de-ensayo', nombre: 'Tubo de ensayo', grupo: 4, desc: 'Tubo de vidrio de fondo redondo. Entra parado: se sostiene con una pinza o una gradilla.',
    campos: [['Diámetro (mm)', 16, 'diametro'], ['Largo (mm)', 150, 'largo']], rotulo: (d, L) => 'Tubo de ensayo ' + n(d) + ' × ' + n(L),
    hacer: (d, L) => { const R = d / 2, ext = [[0, 0]]; for (let k = 1; k <= 6; k++) { const f = k * Math.PI / 12; ext.push([R * Math.sin(f), R - R * Math.cos(f)]); } ext.push([R, L - 2], [R + 1, L]); return revol(vidrio(ext, 1.2), 32); } },
  { id: 'embudo', nombre: 'Embudo', grupo: 4, desc: 'Embudo de vidrio o de plástico con su vástago. Se apoya en un aro de soporte.',
    campos: [['Diámetro (mm)', 75, 'diametro']], rotulo: (d) => 'Embudo ' + n(d),
    hacer: (d) => { const R = d / 2, rs = Math.max(4, d * 0.07), Ls = d * 0.9, hc = (R - rs) * 1.73, t = 1.6; return revol([[rs, 0], [rs, Ls], [R, Ls + hc], [R - t, Ls + hc], [rs - t, Ls + t * 0.6], [rs - t, 0]], 48); } },
  { id: 'calorimetro', nombre: 'Calorímetro', grupo: 4, desc: 'Vaso aislado con tapa, agitador y un orificio para el termómetro o la sonda.', relleno: 'gris',
    campos: [['Diámetro (mm)', 100, 'diametro'], ['Alto (mm)', 120, 'alto']], rotulo: () => 'Calorímetro',
    hacer: (d, h) => junta(cil(d, h, 0, 0, h / 2), cil(d + 6, 8, 0, 0, h + 4), tubo(12, 7, 6, d * 0.2, 0, h + 8), cil(3, 46, -d * 0.24, 0, h + 8 + 23, 'z', 10), aro(14, 3, -d * 0.24, 0, h + 8 + 50)) },
  { id: 'jeringa', nombre: 'Jeringa', grupo: 4, desc: 'Jeringa con su émbolo (ley de Boyle).',
    campos: [['Diámetro (mm)', 22, 'diametro'], ['Largo (mm)', 90, 'largo']], rotulo: () => 'Jeringa',
    hacer: (d, L) => junta(tubo(d, d - 3, L, 0, 0, 12), cil(5, 12, 0, 0, 6, 'z', 14), cil(d + 14, 2.5, 0, 0, L + 12), cil(6, L * 0.6, 0, 0, L + 13 + L * 0.3, 'z', 14), cil(d + 4, 3, 0, 0, L + 14 + L * 0.6)) },

  /* ===== Balanza y calor ===== */
  { id: 'balanza', nombre: 'Balanza digital', grupo: 5, desc: 'Balanza chica de mesa con plato redondo; la pantalla y los botones quedan al frente (−Y).',
    campos: [['Ancho (mm)', 140, 'ancho'], ['Diámetro del plato (mm)', 115, 'plato']], rotulo: () => 'Balanza digital',
    hacer: (A, dp) => { const F = Math.max(A * 1.35, dp + 70), yp = F / 2 - dp / 2 - 12, yd = -F / 2 + 26;
      return junta(redondeada(A, F, 10, 26), cil(dp * 0.3, 7, 0, yp, 29.5, 'z', 24), cil(dp, 3, 0, yp, 34.5), caja(A * 0.46, 24, 1.4, 0, yd, 26.7), caja(A * 0.4, 18, 0.6, 0, yd, 27.7), cil(11, 1.6, -A * 0.36, yd, 26.8, 'z', 20), cil(11, 1.6, A * 0.36, yd, 26.8, 'z', 20)); } },
  { id: 'placa-calefactora', nombre: 'Placa calefactora', grupo: 5, desc: 'Plancha eléctrica de laboratorio: un disco que calienta sobre un cuerpo con dos perillas al frente (−Y). También sirve como agitador magnético.',
    campos: [['Lado del cuerpo (mm)', 160, 'lado'], ['Diámetro del disco (mm)', 135, 'disco']], rotulo: () => 'Placa calefactora',
    hacer: (L, d) => { const h = 70, pies = [-1, 1].flatMap((sx) => [-1, 1].map((sy) => cil(14, 6, sx * (L / 2 - 16), sy * (L / 2 - 16), 3, 'z', 16)));
      return junta(...pies, caja(L, L, h, 0, 0, 6 + h / 2), cil(Math.min(d, L) * 0.86, 5, 0, 0, 6 + h + 2.5), cil(Math.min(d, L - 4), 8, 0, 0, 6 + h + 9), cil(24, 12, -L * 0.22, -L / 2 - 6, 6 + h * 0.42, 'y', 24), cil(24, 12, L * 0.22, -L / 2 - 6, 6 + h * 0.42, 'y', 24), caja(3, 2, 10, -L * 0.22, -L / 2 - 12.5, 6 + h * 0.42 + 4), caja(3, 2, 10, L * 0.22, -L / 2 - 12.5, 6 + h * 0.42 + 4)); } },
  { id: 'tripode', nombre: 'Trípode', grupo: 5, desc: 'Aro de hierro con tres patas: encima va la rejilla y debajo el mechero.', relleno: 'gris',
    campos: [['Alto (mm)', 200, 'alto'], ['Diámetro del aro (mm)', 100, 'diametro']], rotulo: () => 'Trípode', hacer: (alto, d) => tripodeG(alto, d) },
  { id: 'rejilla', nombre: 'Rejilla (tela metálica)', grupo: 5, desc: 'Tela metálica cuadrada con el centro cerámico: reparte el calor bajo el recipiente.', relleno: 'puntos',
    campos: [['Lado (mm)', 125, 'lado']], rotulo: () => 'Rejilla', hacer: (l) => rejillaG(l) },
  { id: 'mechero', nombre: 'Mechero Bunsen', grupo: 5, desc: 'Mechero de gas con su base, el collar del aire y la entrada de gas hacia +X.', relleno: 'gris',
    campos: [['Alto (mm)', 130, 'alto']], rotulo: () => 'Mechero', hacer: (alto) => mecheroG(alto) },
  { id: 'termometro', nombre: 'Termómetro o sonda', grupo: 5, desc: 'Varilla fina con bulbo: termómetro o sonda de temperatura.', relleno: 'gris',
    campos: [['Largo (mm)', 200, 'largo']], rotulo: () => 'Termómetro', hacer: (L) => junta(cil(6, L - 8, 0, 0, 8 + (L - 8) / 2, 'z', 16), esfera(9, 0, 0, 4.5)) },

  /* ===== Ferretería ===== */
  { id: 'tornillo', nombre: 'Tornillo hexagonal', grupo: 6, desc: 'Tornillo de cabeza hexagonal.', relleno: 'gris',
    campos: [['Rosca M', 6, 'rosca'], ['Largo (mm)', 30, 'largo']], rotulo: (d, L) => 'Tornillo M' + n(d) + ' × ' + n(L),
    hacer: (d, L) => junta(prim(new THREE.ExtrudeGeometry(hexagono(AF[d] || d * 1.65), { depth: d * 0.65, bevelEnabled: false }).translate(0, 0, L)), cil(d, L, 0, 0, L / 2, 'z', 32)) },
  { id: 'tuerca', nombre: 'Tuerca hexagonal', grupo: 6, desc: 'Tuerca hexagonal.', relleno: 'gris',
    campos: [['Rosca M', 6, 'rosca']], rotulo: (d) => 'Tuerca M' + n(d),
    hacer: (d) => { const s = hexagono(AF[d] || d * 1.65), h = new THREE.Path(); h.absarc(0, 0, d / 2, 0, Math.PI * 2, true); s.holes.push(h); return prim(new THREE.ExtrudeGeometry(s, { depth: d * 0.8, bevelEnabled: false, curveSegments: 24 })); } },
  { id: 'arandela', nombre: 'Arandela', grupo: 6, desc: 'Arandela plana.', relleno: 'gris',
    campos: [['Rosca M', 6, 'rosca']], rotulo: (d) => 'Arandela M' + n(d), hacer: (d) => tubo(d * 2, d + 0.4, Math.max(1, d * 0.2)) },
];

export const elemento = (id) => ELEMENTOS.find((e) => e.id === id) || null;
// Valores de los campos a partir de un objeto { clave: valor } (lo que falta toma el valor inicial)
export const valores = (e, params) => e.campos.map(([, def, clave, ops]) => {
  const v = params && params[clave] != null ? parseFloat(params[clave]) : def, x = isFinite(v) && v > 0 ? v : def;
  return ops ? ops.reduce((m, o) => (Math.abs(o - x) < Math.abs(m - x) ? o : m), ops[0]) : x;   // con opciones: la más cercana
});
// Piezas que agrega un elemento: una sola (hacer) o varias ya ubicadas entre sí (conjunto)
export const piezasDe = (e, v) => (e.conjunto ? e.conjunto(...v) : [{ nombre: e.rotulo(...v), relleno: e.relleno || 'blanco', pos: e.hacer(...v) }]);
