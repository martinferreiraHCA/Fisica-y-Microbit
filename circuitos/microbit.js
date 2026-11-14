// micro:bit: qué hace cada pin según la versión de la placa y qué problemas trae
// conectar ahí cada componente. Datos del conector de borde y de la alimentación:
// https://tech.microbit.org/hardware/edgeconnector/ y …/hardware/powersupply/
import { COMPONENTES } from './componentes.js';

export const VERSIONES = [{ id: 'v1', nombre: 'micro:bit V1' }, { id: 'v2', nombre: 'micro:bit V2' }];
// Placa simple: los 5 anillos para pinzas cocodrilo
export const ANILLOS = ['P0', 'P1', 'P2', '3V', 'GND'];
// Con extensor (conector de borde): todos los pines, en orden numérico
export const EXTENSOR = ['3V', 'GND', 'P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15', 'P16', 'P19', 'P20'];
// Orden físico en el borde de la placa, de izquierda a derecha (vista de frente)
export const BORDE = ['P3', 'P0', 'P4', 'P5', 'P6', 'P7', 'P1', 'P8', 'P9', 'P10', 'P11', 'P12', 'P2', 'P13', 'P14', 'P15', 'P16', '3V', 'P19', 'P20', 'GND'];

export const LIMITES = {
  v1: { nombre: 'V1', vmax: 3.6, pin: 5, pines: 15, externo: 90, adc: 10 },
  v2: { nombre: 'V2', vmax: 3.6, pin: 5, pines: 15, externo: 270, adc: 10 },
};

/* ---------- Tabla de pines ----------
   adc: lee tensión analógica · tactil · led: columna de la pantalla (por versión) · boton · i2c / spi
   libre: no lo usa nada de la placa. Todos los GPIO pueden dar PWM (hasta 3 a la vez). */
const P = {
  P0: { anillo: 1, adc: 1, tactil: 1, libre: 1 },
  P1: { anillo: 1, adc: 1, tactil: 1, libre: 1 },
  P2: { anillo: 1, adc: 1, tactil: 1, libre: 1 },
  P3: { adc: 1, led: { v1: 1, v2: 3 } },
  P4: { adc: 1, led: { v1: 2, v2: 1 } },
  P5: { boton: 'A' },
  P6: { led: { v1: 9, v2: 4 } },
  P7: { led: { v1: 8, v2: 2 } },
  P8: { libre: 1 },
  P9: { led: { v1: 7 }, libre: { v2: 1 } },
  P10: { adc: 1, led: { v1: 3, v2: 5 } },
  P11: { boton: 'B' },
  P12: { libre: 1, reservado: 'accesibilidad' },
  P13: { libre: 1, spi: 'SCK' },
  P14: { libre: 1, spi: 'MISO' },
  P15: { libre: 1, spi: 'MOSI' },
  P16: { libre: 1 },
  P19: { i2c: 'SCL' },
  P20: { i2c: 'SDA' },
  '3V': { potencia: '3V' },
  GND: { potencia: 'GND' },
};
const ver = (v) => (String(v || '').toLowerCase() === 'v1' ? 'v1' : 'v2');
const porVersion = (x, v) => (x && typeof x === 'object' ? x[ver(v)] : x) || 0;

// Capacidades de un pin en una versión
export function caps(pin, v) {
  const p = P[pin] || {};
  return { existe: !!P[pin], anillo: !!p.anillo, adc: !!p.adc, tactil: !!p.tactil, pantalla: porVersion(p.led, v), boton: p.boton || '', i2c: p.i2c || '', spi: p.spi || '',
    libre: !!porVersion(p.libre, v), potencia: p.potencia || '', gpio: !p.potencia, reservado: p.reservado || '' };
}
const ANALOGICOS_LIBRES = 'P0, P1 o P2';
const num = (x) => String(x).replace('.', ',');

// Ficha de un pin: para qué sirve, para qué no y qué tener en cuenta
export function infoPin(pin, v) {
  v = ver(v); const c = caps(pin, v), L = LIMITES[v], V = L.nombre;
  const o = { pin, version: v, titulo: pin, resumen: '', sirve: [], noSirve: [], notas: [], caps: c };
  if (!c.existe) { o.resumen = 'Pin desconocido.'; return o; }
  if (c.potencia === '3V') {
    o.titulo = '3V · alimentación'; o.resumen = 'Salida de 3,3 V de la placa para alimentar circuitos chicos.';
    o.sirve.push('Alimentar sensores y módulos de 3,3 V (LDR, NTC, potenciómetro, BMP280, MPU6050, OLED…).', 'Referencia de los divisores de tensión que se leen por un pin analógico.');
    o.noSirve.push('Módulos que necesitan 5 V (HC-SR04 clásico, relé de 5 V, servo, tira de LED): miden mal o no arrancan.', 'Motores, lámparas, electroimanes o servos: consumen mucho más de lo que entrega la placa.');
    o.notas.push('La micro:bit ' + V + ' entrega hasta unos ' + L.externo + ' mA a lo que se conecte (alimentada por USB).' + (v === 'v1' ? ' En la V2 son 270 mA.' : ' En la V1 eran solo 90 mA.'), 'Nunca conectar acá más de 3,6 V: se daña la placa.');
    return o;
  }
  if (c.potencia === 'GND') {
    o.titulo = 'GND · masa'; o.resumen = 'Referencia de 0 V (negativo).';
    o.sirve.push('Cerrar todos los circuitos: el negativo de cada sensor y de cada fuente externa va unido a GND.');
    o.notas.push('Si un módulo se alimenta con pilas aparte, su negativo también tiene que unirse a GND (masa común); si no, las lecturas no tienen sentido.');
    return o;
  }
  // GPIO
  const usos = [];
  if (c.adc) usos.push('entrada analógica');
  usos.push('entrada y salida digital', 'PWM');
  if (c.tactil) usos.push('táctil');
  if (c.spi) usos.push('SPI ' + c.spi);
  if (c.i2c) usos.push('I2C ' + c.i2c);
  o.titulo = pin + (c.anillo ? ' · anillo grande' : '') + (c.boton ? ' · botón ' + c.boton : '') + (c.pantalla ? ' · pantalla LED' : '') + (c.i2c ? ' · I2C ' + c.i2c : '') + (c.spi ? ' · SPI ' + c.spi : '');
  o.resumen = usos.join(' · ');

  if (c.i2c) {
    o.sirve.push('Bus I2C (' + c.i2c + '): varios sensores a la vez en los mismos dos cables (BMP280, MPU6050, INA219, VL53L0X, OLED, ADS1115…).');
    o.noSirve.push('Usarlo como entrada o salida común: comparte el bus con el acelerómetro y la brújula de la placa y los deja sin funcionar.', 'Medir tensión analógica.');
    o.notas.push('Ya tiene resistencias de 4,7 kΩ a 3,3 V en la placa: no hace falta agregarlas.', 'Los módulos I2C tienen que trabajar a 3,3 V; si traen pull-up a 5 V pueden dañar la placa.');
    return o;
  }
  if (c.adc && !c.pantalla) {
    o.sirve.push('Medir una tensión de 0 a 3,3 V (lectura de 0 a 1023): potenciómetro, LDR, termistor NTC, TMP36, sensor de fuerza, micrófono analógico, sensor Hall analógico.', 'Leer sensores digitales (pulsador, barrera óptica, PIR, ECHO del ultrasonido a 3,3 V).', 'Encender un LED con su resistencia, mandar la señal a un servo, a un transistor o a un zumbador (PWM).', 'Táctil: tocar el anillo y GND' + (v === 'v2' ? ' (en la V2 también táctil capacitivo, sin tocar GND).' : ' (en la V1 es táctil resistivo: hay que tocar también GND).'));
    if (pin === 'P0') o.notas.push(v === 'v2' ? 'En la V2 el sonido sale a la vez por el parlante de la placa y por P0: si P0 mide un sensor, no usar bloques de música (o desactivar el pin de sonido).' : 'En la V1 no hay parlante: el sonido sale solo por P0 (auriculares o zumbador entre P0 y GND).');
  } else if (c.adc && c.pantalla) {
    o.sirve.push('Entrada analógica extra (0 a 3,3 V), solo con la pantalla apagada.', 'Entrada o salida digital con la pantalla apagada.');
    o.noSirve.push('Medir mientras la pantalla muestra algo: el pin maneja la columna ' + c.pantalla + ' de los LED y la lectura sale alterada (y la pantalla se ve mal).');
    o.notas.push('Hay que apagar la pantalla en el programa (bloque «LED habilitar: falso»). Si la medida importa, conviene ' + ANALOGICOS_LIBRES + '.');
  } else if (c.pantalla) {
    o.sirve.push('Entrada o salida digital, solo con la pantalla apagada.');
    o.noSirve.push('Medir tensión analógica: este pin no tiene conversor.', 'Usarlo con la pantalla encendida: maneja la columna ' + c.pantalla + ' de los LED.');
    o.notas.push('Hay que apagar la pantalla en el programa (bloque «LED habilitar: falso»).');
  } else if (c.boton) {
    o.sirve.push('Agregar un pulsador externo que haga lo mismo que el botón ' + c.boton + ' (entre el pin y GND).');
    o.noSirve.push('Medir tensión analógica: no tiene conversor.', 'Sensores digitales en general: el pin tiene una resistencia de 10 kΩ a 3,3 V y lo comparte el botón ' + c.boton + '; apretar el botón cambia la lectura.');
    o.notas.push('Si se usa como salida, no apretar el botón ' + c.boton + ' (une el pin con GND).');
  } else {
    o.sirve.push('Entrada digital: pulsador, barrera óptica, sensor Hall digital, PIR, ECHO del ultrasonido (a 3,3 V).', 'Salida digital o PWM: LED con resistencia, TRIG del ultrasonido, señal de servo, compuerta de un MOSFET, zumbador.');
    o.noSirve.push('Medir tensión analógica: no tiene conversor. Para potenciómetro, LDR, NTC o cualquier sensor analógico usar ' + ANALOGICOS_LIBRES + '.');
    if (c.spi) o.notas.push('Es el ' + c.spi + ' del bus SPI por defecto (MAX6675, lector SD, pantallas SPI). Si no se usa SPI, es un pin digital libre.');
    if (c.reservado) o.notas.push('Reservado para funciones de accesibilidad: funciona como pin digital, pero es mejor dejarlo para el final.');
    if (pin === 'P9') o.notas.push('Libre solo en la V2. En la V1 maneja la columna 7 de la pantalla.');
    if (pin === 'P8' || pin === 'P16') o.notas.push('Totalmente libre en V1 y V2: buena elección para una señal digital.');
  }
  if (pin === 'P9' && v === 'v1') o.notas.push('En la V2 este pin queda libre (ya no comparte la pantalla).');
  if (c.pantalla && !c.adc && pin !== 'P9') o.notas.push('En la ' + (v === 'v1' ? 'V2' : 'V1') + ' maneja otra columna de la pantalla, pero el problema es el mismo.');
  o.noSirve.push('Alimentar motores, lámparas, relés, servos o varios LED: cada pin entrega unos ' + L.pin + ' mA (y no más de ' + L.pines + ' mA entre todos). Usar un transistor, un MOSFET o un driver.', 'Recibir señales de 5 V (módulos alimentados con 5 V): el máximo es 3,3 V y se puede dañar el pin.');
  if (!c.anillo) o.notas.push('No es un anillo grande: se llega con un extensor (conector de borde).');
  return o;
}

/* ---------- Dónde conviene conectar un componente ---------- */
const comp = (id) => COMPONENTES.find((c) => c.id === id) || null;
const SENAL = { aout: 1, dout: 1, din: 1, pwm: 1, io: 1, sda: 1, scl: 1, sck: 1, miso: 1, mosi: 1, cs: 1 };
// pines digitales libres; primero los que no tienen ninguna otra función (P8, P16, P9 en la V2), después los del SPI
const LIBRES = (v) => EXTENSOR.filter((p) => { const c = caps(p, v); return c.gpio && c.libre && !c.reservado; }).sort((a, b) => (caps(a, v).spi ? 1 : 0) - (caps(b, v).spi ? 1 : 0));

// Para la ficha del componente: a qué pin de la micro:bit va cada pata y qué problemas hay
export function recomendar(id, v) {
  v = ver(v); const c = comp(id); if (!c || !c.pines) return { pines: [], avisos: [] };
  const out = [], avisos = [], L = LIMITES[v], dig = LIBRES(v).filter((p) => !caps(p, v).anillo);
  let vmin = 0;
  c.pines.forEach((p) => {
    let a = '', n = '';
    if (p.rol === 'vcc') {
      const lo = (p.v || [3, 3.6])[0], hi = (p.v || [3, 3.6])[1]; vmin = Math.max(vmin, lo);
      if (lo <= 3.3 && hi >= 3.3) { a = '3V'; if ((p.i || 0) > L.externo) n = 'consume ' + p.i + ' mA: alimentarlo aparte'; }
      else if (lo > 3.3) { a = 'fuente externa de ' + (lo <= 5 && hi >= 5 ? '5 V' : num(lo) + ' V'); n = 'la micro:bit solo da 3,3 V'; }
      else { a = 'fuente de ' + num(hi) + ' V como máximo'; n = '3,3 V es demasiado'; }
    } else if (p.rol === 'gnd') a = 'GND';
    else if (p.rol === 'aout') { a = ANALOGICOS_LIBRES; n = 'entrada analógica (0 a 1023)'; }
    else if (p.rol === 'sda') a = 'P20';
    else if (p.rol === 'scl') a = 'P19';
    else if (p.rol === 'sck') a = 'P13';
    else if (p.rol === 'miso') a = 'P14';
    else if (p.rol === 'mosi') a = 'P15';
    else if (p.rol === 'dout' || p.rol === 'din' || p.rol === 'pwm' || p.rol === 'io' || p.rol === 'cs') { a = 'P0, P1, P2' + (dig.length ? ' o ' + dig.slice(0, 3).join(', ') + ' (con extensor)' : ''); n = p.rol === 'pwm' ? 'salida PWM' : p.rol === 'dout' ? 'entrada digital' : p.rol === 'din' ? 'salida digital' : 'pin digital'; }
    else if (p.rol === 'carga') { a = 'no va directo a un pin'; n = 'usar transistor, MOSFET o driver' + (p.i ? ' (' + p.i + ' mA)' : ''); }
    else return;
    out.push({ pin: p.n, a, nota: n });
  });
  if (vmin > 3.3) {
    avisos.push('Necesita ' + num(vmin) + ' V o más: con los 3,3 V de la micro:bit no funciona bien. Alimentarlo aparte y unir los GND.');
    if (c.pines.some((p) => (p.rol === 'dout' || p.rol === 'aout' || p.rol === 'io' || p.rol === 'sda') && !p.nivel33)) avisos.push('Alimentado con ' + num(vmin >= 4 && vmin <= 5 ? 5 : vmin) + ' V, sus salidas pueden superar 3,3 V: poner un divisor de tensión o un adaptador de nivel antes del pin.');
  }
  if (c.pines.some((p) => p.rol === 'sda')) avisos.push('El I2C de la micro:bit está fijo en P19 (SCL) y P20 (SDA): hace falta un extensor.');
  (c.avisos || []).forEach((t) => avisos.push(t));
  if (c.solo && c.solo !== v) avisos.push('Pensado para la micro:bit ' + c.solo.toUpperCase() + '.');
  return { pines: out, avisos };
}

/* ---------- Revisión de un circuito ----------
   redes: [[{ el, c, pin, ohm? }, …], …]  cada red es el conjunto de patas unidas entre sí.
     el: id del elemento en el dibujo · c: id del componente en la base ('microbit' para la placa)
     pin: nombre de la pata (el de COMPONENTES[].pines[].n; en la micro:bit 'P0'…'P20', '3V', 'GND')
   Devuelve [{ nivel: 'error' | 'aviso' | 'info', titulo, texto, els: [ids], pin }] */
export function revisar(redes, v) {
  v = ver(v); const L = LIMITES[v], out = [], visto = new Set();
  const add = (nivel, titulo, texto, els, pin) => { const k = titulo + '|' + texto; if (visto.has(k)) return; visto.add(k); out.push({ nivel, titulo, texto, els: (els || []).filter(Boolean), pin: pin || null }); };
  redes = (redes || []).filter((r) => r && r.length);
  const redDe = new Map();   // «el|pin» → índice de red
  redes.forEach((r, i) => r.forEach((x) => redDe.set(x.el + '|' + x.pin, i)));
  const mbEn = (i) => (redes[i] || []).filter((x) => x.c === 'microbit');
  const nombre = (x) => { const c = comp(x.c); return c ? c.nombre : x.c; };
  // tensión que llega a una red: 3,3 V de la placa o el positivo de una fuente
  const tension = (i) => {
    let t = null;
    (redes[i] || []).forEach((x) => {
      if (x.c === 'microbit' && x.pin === '3V') t = Math.max(t || 0, 3.3);
      const c = comp(x.c), p = c && (c.pines || []).find((q) => q.n === x.pin);
      if (p && p.rol === 'fuente+') t = Math.max(t || 0, p.v || 0);
    });
    return t;
  };
  const esMasa = (i) => (redes[i] || []).some((x) => { if (x.c === 'microbit') return x.pin === 'GND'; const c = comp(x.c), p = c && (c.pines || []).find((q) => q.n === x.pin); return !!(p && p.rol === 'fuente-'); });
  const hayPlaca = redes.some((r) => r.some((x) => x.c === 'microbit'));
  if (!hayPlaca) return out;

  // elementos → sus patas
  const elems = new Map();
  redes.forEach((r, i) => r.forEach((x) => { if (x.c === 'microbit') return; if (!elems.has(x.el)) elems.set(x.el, { c: x.c, patas: {} , ohm: x.ohm }); elems.get(x.el).patas[x.pin] = i; }));

  let consumo3V = 0; const de3V = [];
  elems.forEach((e, el) => {
    const c = comp(e.c); if (!c || !c.pines) return;
    const pinDe = (rol) => c.pines.filter((p) => p.rol === rol);
    const vcc = pinDe('vcc')[0], gnd = pinDe('gnd')[0];
    const tV = vcc && e.patas[vcc.n] != null ? tension(e.patas[vcc.n]) : null;
    // --- alimentación
    if (vcc && e.patas[vcc.n] != null) {
      const r = e.patas[vcc.n], lo = (vcc.v || [3, 3.6])[0], hi = (vcc.v || [3, 3.6])[1];
      if (tV != null && tV < lo - 0.05) add('error', c.nombre + ': le falta tensión', 'Necesita ' + String(lo).replace('.', ',') + ' V o más y está alimentado con ' + String(tV).replace('.', ',') + ' V. Puede no arrancar o medir mal. Alimentarlo con una fuente aparte y unir los GND.', [el], vcc.n);
      if (tV != null && tV > hi + 0.05) add('error', c.nombre + ': demasiada tensión', 'Soporta hasta ' + String(hi).replace('.', ',') + ' V y le llegan ' + String(tV).replace('.', ',') + ' V: se puede quemar.', [el], vcc.n);
      const gp = mbEn(r).filter((x) => caps(x.pin, v).gpio);
      if (gp.length) add((vcc.i || 0) > L.pin ? 'error' : 'aviso', c.nombre + ': alimentado desde ' + gp[0].pin, 'Un pin entrega unos ' + L.pin + ' mA' + (vcc.i ? ' y este componente pide ' + vcc.i + ' mA' : '') + '. Alimentarlo desde 3V.', [el, gp[0].el], gp[0].pin);
      if (mbEn(r).some((x) => x.pin === '3V') && vcc.i) { consumo3V += vcc.i; de3V.push(el); }
    }
    // --- masa común
    const senalEnPlaca = c.pines.some((p) => SENAL[p.rol] && e.patas[p.n] != null && mbEn(e.patas[p.n]).some((x) => caps(x.pin, v).gpio));
    if (gnd && senalEnPlaca && (e.patas[gnd.n] == null || !mbEn(e.patas[gnd.n]).some((x) => x.pin === 'GND')))
      add('error', c.nombre + ': falta la masa común', 'Su GND no está unido al GND de la micro:bit. Sin masa común la señal no tiene referencia y la medida no sirve.', [el], 'GND');
    // --- LED: ¿tiene su resistencia en serie? ¿cuánta corriente le pide al pin?
    const leds = c.pines.filter((p) => p.rol === 'led' && e.patas[p.n] != null);
    const comun = c.pines.find((p) => /^COM/.test(p.n) && e.patas[p.n] != null);
    leds.forEach((p) => {
      const otra = leds.length === 2 && !comun ? leds.find((q) => q.n !== p.n) : comun; if (!otra) return;
      const lado = (i) => {   // qué hay del otro lado de esta pata: directo a la placa/fuente, o a través de una resistencia
        const gp = mbEn(i).filter((x) => caps(x.pin, v).gpio)[0];
        if (gp || esMasa(i) || tension(i) != null) return { directo: true, gp };
        for (const x of redes[i] || []) {
          if (x.el === el || !/^(resistencia|_?potenciometro|calefactor)$/.test(x.c)) continue;
          const o = elems.get(x.el), j = o && Object.keys(o.patas).map((k) => o.patas[k]).find((k) => k !== i); if (j == null) continue;
          const g2 = mbEn(j).filter((y) => caps(y.pin, v).gpio)[0];
          if (g2 || esMasa(j) || tension(j) != null) return { r: x.ohm || 0, rel: x.el, gp: g2 };
        }
        return null;
      };
      const A = lado(e.patas[p.n]), B = lado(e.patas[otra.n]); if (!A || !B) return;
      const gp = A.gp || B.gp; if (!gp && !mbEn(e.patas[p.n]).length && !mbEn(e.patas[otra.n]).length && !(A.directo && B.directo)) return;
      if (A.directo && B.directo) { if (gp || mbEn(e.patas[p.n]).length || mbEn(e.patas[otra.n]).length) add('error', c.nombre + (gp ? ' en ' + gp.pin : '') + ': falta la resistencia', 'Un LED sin resistencia en serie se lleva toda la corriente que puede: se daña el LED o el pin. Poner 220 Ω o más en serie.', [el, gp && gp.el], gp && gp.pin); return; }
      const R = (A.r || 0) + (B.r || 0);
      if (gp && R > 0) { const mA = (3.3 - (p.vf || 2)) / R * 1000; if (mA > L.pin + 1.5) add('aviso', c.nombre + ' en ' + gp.pin + ': corriente alta', 'Con ' + R + ' Ω pasan unos ' + mA.toFixed(0) + ' mA y un pin entrega unos ' + L.pin + ' mA. Usar ' + (Math.ceil((3.3 - (p.vf || 2)) / (L.pin / 1000) / 10) * 10 <= 270 ? '270' : '330') + ' Ω o más.', [el, A.rel || B.rel, gp.el], gp.pin); }
    });
    // --- señales
    c.pines.forEach((p) => {
      const r = e.patas[p.n]; if (r == null) return;
      mbEn(r).forEach((m) => {
        const k = caps(m.pin, v); if (!k.gpio) return;
        const donde = c.nombre + ' (' + p.n + ') en ' + m.pin, els = [el, m.el];
        const alta = (p.nivel && p.nivel > 3.6) || (tV != null && tV > 3.6 && !p.nivel33);
        if (p.rol === 'aout') {
          if (!k.adc) add('error', donde + ': no se puede medir', m.pin + ' no lee tensión analógica. Pasar la señal a ' + ANALOGICOS_LIBRES + '.', els, m.pin);
          else if (k.pantalla) add('aviso', donde + ': comparte la pantalla', m.pin + ' maneja la columna ' + k.pantalla + ' de los LED: hay que apagar la pantalla en el programa o la lectura sale alterada. Mejor ' + ANALOGICOS_LIBRES + '.', els, m.pin);
          if (alta) add('error', donde + ': salida de más de 3,3 V', 'El sensor está alimentado con ' + String(tV || p.nivel).replace('.', ',') + ' V y su salida puede superar 3,3 V: la lectura se satura en 1023 y se puede dañar el pin. Alimentarlo con 3,3 V o poner un divisor de tensión.', els, m.pin);
          if (m.pin === 'P0' && v === 'v2') add('info', donde, 'En la V2 el sonido también sale por P0: no usar bloques de música mientras se mide.', els, m.pin);
        }
        if (p.rol === 'dout' || p.rol === 'io') {
          if (k.i2c) add('error', donde + ': pin del I2C', m.pin + ' es el ' + k.i2c + ' del bus I2C interno (acelerómetro y brújula). Usar otro pin digital.', els, m.pin);
          else if (k.boton) add('aviso', donde + ': comparte el botón ' + k.boton, 'Apretar el botón ' + k.boton + ' cambia la lectura. Mejor P8, P16 o un anillo.', els, m.pin);
          else if (k.pantalla) add('aviso', donde + ': comparte la pantalla', 'Hay que apagar la pantalla en el programa (columna ' + k.pantalla + '). Mejor P8, P16 o un anillo.', els, m.pin);
          if (alta) add('error', donde + ': señal de 5 V', 'El módulo trabaja a ' + String(tV || p.nivel).replace('.', ',') + ' V y su salida supera los 3,3 V que tolera el pin. Usar un divisor de tensión (por ejemplo 1 kΩ y 2 kΩ) o la versión de 3,3 V del módulo.', els, m.pin);
        }
        if (p.rol === 'din' || p.rol === 'pwm' || p.rol === 'cs') {
          if (k.i2c) add('error', donde + ': pin del I2C', m.pin + ' es el ' + k.i2c + ' del bus I2C interno. Usar otro pin digital.', els, m.pin);
          else if (k.boton) add('aviso', donde + ': comparte el botón ' + k.boton, 'El botón ' + k.boton + ' une este pin con GND cuando se aprieta.', els, m.pin);
          else if (k.pantalla) add('aviso', donde + ': comparte la pantalla', 'Hay que apagar la pantalla en el programa (columna ' + k.pantalla + ').', els, m.pin);
          if (p.vih && p.vih > 3.3 && tV != null && tV > 3.6) add('aviso', donde + ': nivel justo', 'Alimentado con ' + String(tV).replace('.', ',') + ' V, el módulo espera al menos ' + String(p.vih).replace('.', ',') + ' V para leer un «1» y la micro:bit da 3,3 V: puede fallar a veces.', els, m.pin);
          if (p.rol === 'pwm' && m.pin === 'P0' && v === 'v2' && /zumbador|parlante|altavoz/i.test(c.nombre)) add('info', donde, 'La V2 ya tiene parlante: el sonido sale por la placa y por P0 a la vez.', els, m.pin);
        }
        if (p.rol === 'sda' && m.pin !== 'P20') add('error', donde + ': el SDA va en P20', 'El I2C de la micro:bit está fijo: SDA en P20 y SCL en P19.', els, m.pin);
        if (p.rol === 'scl' && m.pin !== 'P19') add('error', donde + ': el SCL va en P19', 'El I2C de la micro:bit está fijo: SDA en P20 y SCL en P19.', els, m.pin);
        if ((p.rol === 'sda' || p.rol === 'scl') && tV != null && tV > 3.6) add('error', donde + ': I2C a 5 V', 'El módulo está alimentado con ' + String(tV).replace('.', ',') + ' V y sus resistencias de pull-up llevan el bus a esa tensión: puede dañar la placa. Alimentarlo con 3,3 V.', els, m.pin);
        if (p.rol === 'sck' && m.pin !== 'P13' || p.rol === 'miso' && m.pin !== 'P14' || p.rol === 'mosi' && m.pin !== 'P15') add('info', donde, 'Los pines SPI por defecto son P13 (SCK), P14 (MISO) y P15 (MOSI). Con otros pines hay que indicarlo en el programa.', els, m.pin);
        if (p.rol === 'carga') add((p.i || 100) > L.pin ? 'error' : 'aviso', donde + ': demasiada corriente para un pin', c.nombre + ' consume ' + (p.i ? 'unos ' + p.i + ' mA' : 'mucha corriente') + ' y un pin entrega unos ' + L.pin + ' mA. Manejarlo con un transistor, un MOSFET o un driver, con su propia fuente.', els, m.pin);
      });
    });
  });
  if (consumo3V > L.externo) add('aviso', 'Mucho consumo desde 3V', 'Lo conectado a 3V suma unos ' + Math.round(consumo3V) + ' mA y la micro:bit ' + L.nombre + ' entrega hasta ' + L.externo + ' mA' + (v === 'v1' ? ' (la V2 llega a 270 mA)' : '') + '. Alimentar los módulos grandes con una fuente aparte.', de3V, '3V');
  // PWM simultáneos
  const pwm = new Set(); redes.forEach((r) => { if (r.some((x) => { const c = comp(x.c), p = c && (c.pines || []).find((q) => q.n === x.pin); return p && p.rol === 'pwm'; })) r.forEach((x) => { if (x.c === 'microbit' && caps(x.pin, v).gpio) pwm.add(x.pin); }); });
  if (pwm.size > 3) add('aviso', 'Muchas salidas PWM', 'Hay ' + pwm.size + ' pines con PWM (' + [...pwm].join(', ') + ') y la micro:bit maneja 3 a la vez.', [], null);
  // fuente externa de más de 3,6 V directo a la placa
  redes.forEach((r, i) => { const t = tension(i); const m = r.filter((x) => x.c === 'microbit' && x.pin !== 'GND'); if (t != null && t > 3.6 && m.length && r.some((x) => { const c = comp(x.c), p = c && (c.pines || []).find((q) => q.n === x.pin); return p && p.rol === 'fuente+'; })) add('error', String(t).replace('.', ',') + ' V directo a ' + m[0].pin, 'La micro:bit soporta 3,6 V como máximo en sus pines' + (m[0].pin === '3V' ? ' (también en 3V)' : '') + ': se daña la placa. Usar un regulador de 3,3 V o alimentarla por USB o por el conector de pilas.', m.map((x) => x.el).concat(r.filter((x) => x.c !== 'microbit').map((x) => x.el)), m[0].pin); });
  const orden = { error: 0, aviso: 1, info: 2 };
  return out.sort((a, b) => orden[a.nivel] - orden[b.nivel]);
}
