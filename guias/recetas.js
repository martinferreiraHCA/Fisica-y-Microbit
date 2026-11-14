// Recetas de guías de armado: un texto (JSON) que describe las piezas, dónde va cada una
// y en qué paso entra. Lo usan las guías listas, y es lo que devuelve la IA cuando el
// docente le cuenta qué quiere armar (ver promptIA).
import { ELEMENTOS, GRUPOS } from './elementos.js';

export const FORMATO = 'guia-armado-1';

/* ---------- Guías listas ---------- */
const soporte = (alto, zNuez, largoBrazo = 250) => [
  { id: 'soporte', de: 'elemento:soporte-universal', params: { alto }, x: 0, y: 0, paso: 1 },
  { id: 'nuez', de: 'elemento:nuez', pos: [14, 26, zNuez], paso: 2, entra: 'atras' },
  { id: 'brazo', de: 'elemento:varilla', params: { diametro: 12, largo: largoBrazo }, nombre: 'Varilla horizontal', rot: [0, 90, 0], pos: [largoBrazo / 2 - 30, 14, zNuez + 13], paso: 2, entra: 'derecha' },
];
export const LISTAS = [
  { clave: 'hooke', titulo: 'Ley de Hooke', resumen: 'Resorte colgado de un soporte, portapesas con pesas y regla para medir el estiramiento.', receta: {
    titulo: 'Ley de Hooke', tipo: 'Práctica', bajada: 'Fuerza elástica y estiramiento', descripcion: 'Un resorte cuelga del soporte. Se agregan pesas de a una y se mide cuánto se estira con la regla.',
    pasos: [{ titulo: 'Soporte', texto: 'Apoyar el soporte universal sobre la mesa, con la varilla hacia atrás.' }, { titulo: 'Nuez y varilla', texto: 'Ajustar la nuez arriba de todo y pasar por ella la varilla horizontal.' }, { titulo: 'Resorte', texto: 'Colgar el resorte de la varilla horizontal.' }, { titulo: 'Portapesas y pesas', texto: 'Colgar el portapesas del resorte y apilar las pesas de a una.' }, { titulo: 'Regla', texto: 'Parar la regla al lado del resorte, con el cero a la altura del gancho de abajo.' }],
    piezas: [...soporte(600, 540),
      { id: 'resorte', de: 'elemento:resorte', params: { diametro: 22, largo: 110, vueltas: 16 }, colgar: 'brazo', mover: [60, 0, 0], paso: 3 },
      { id: 'porta', de: 'elemento:portapesas', colgar: 'resorte', mover: [0, 0, 6], paso: 4 },
      { id: 'pesa1', de: 'elemento:pesa-ranurada', params: { masa: 50 }, sobre: 'porta', mover: [0, 0, -96], paso: 4, entra: 'frente' },
      { id: 'pesa2', de: 'elemento:pesa-ranurada', params: { masa: 50 }, sobre: 'pesa1', paso: 4, entra: 'frente' },
      { id: 'regla', de: 'elemento:regla', params: { largo: 400 }, rot: [90, 0, 90], pos: [225, 20, 330], paso: 5, entra: 'derecha' }] } },
  { clave: 'pendulo', titulo: 'Péndulo simple', resumen: 'Soporte con nuez y varilla, hilo, lenteja y una barrera óptica para medir el período.', receta: {
    titulo: 'Péndulo simple', tipo: 'Práctica', bajada: 'Período y largo del hilo', descripcion: 'La lenteja cuelga de un hilo y oscila. La barrera óptica marca cada paso por el punto más bajo.',
    pasos: [{ titulo: 'Soporte', texto: 'Apoyar el soporte universal sobre la mesa.' }, { titulo: 'Nuez y varilla', texto: 'Ajustar la nuez bien arriba y pasar la varilla horizontal.' }, { titulo: 'Hilo y lenteja', texto: 'Atar el hilo a la varilla y colgar la lenteja. Medir el largo desde el nudo hasta el centro de la lenteja.' }, { titulo: 'Barrera óptica', texto: 'Ubicar la barrera debajo, de modo que la lenteja corte el haz en el punto más bajo.' }, { titulo: 'micro:bit', texto: 'Conectar la barrera a la micro:bit (señal en P1, 3V y GND).' }],
    piezas: [...soporte(700, 640),
      { id: 'hilo', de: 'elemento:hilo', params: { largo: 420 }, colgar: 'brazo', mover: [70, 0, 0], paso: 3 },
      { id: 'lenteja', de: 'elemento:lenteja', params: { diametro: 34 }, colgar: 'hilo', mover: [0, 0, 4], paso: 3 },
      { id: 'barrera', de: 'elemento:barrera-optica', params: { abertura: 70 }, rot: [0, 0, 90], pos: [165, 14, 166], paso: 4, entra: 'frente' },
      { id: 'taco', de: 'elemento:bloque', params: { x: 60, y: 110, z: 126 }, nombre: 'Taco', pos: [165, 14, 63], paso: 4, entra: 'frente' },
      { id: 'mb', de: 'elemento:microbit', x: 190, y: -150, paso: 5 }] } },
  { clave: 'plano', titulo: 'Carrito en plano inclinado', resumen: 'Rampa con un carrito y un sensor de ultrasonido arriba que mide su posición.', receta: {
    titulo: 'Carrito en plano inclinado', tipo: 'Práctica', bajada: 'Movimiento uniformemente acelerado', descripcion: 'El carrito baja por la rampa y el sensor de ultrasonido, arriba de todo, mide su distancia en cada instante.',
    pasos: [{ titulo: 'Plano inclinado', texto: 'Apoyar la rampa sobre la mesa y medir su ángulo.' }, { titulo: 'Sensor de ultrasonido', texto: 'Fijar el sensor arriba de todo, al ras de la superficie y apuntando rampa abajo.' }, { titulo: 'micro:bit', texto: 'Conectar el sensor a la micro:bit: TRIG en P1, ECHO en P2, 3V y GND.' }, { titulo: 'Carrito', texto: 'Apoyar el carrito a unos 10 cm del sensor y soltarlo sin empujarlo.' }],
    piezas: [
      { id: 'plano', de: 'elemento:plano-inclinado', params: { largo: 500, angulo: 15, ancho: 130 }, x: 0, y: 0, paso: 1 },
      { id: 'sensor', de: 'elemento:ultrasonido', rot: [0, 15, 90], pos: [-222, 0, 138], paso: 2, entra: 'arriba' },
      { id: 'mb', de: 'elemento:microbit', x: -200, y: -130, paso: 3 },
      { id: 'carrito', de: 'elemento:carrito', params: { largo: 130 }, rot: [0, 15, 0], pos: [-41, 0, 104], paso: 4, entra: 'arriba' }] } },
  { clave: 'newton', titulo: 'Segunda ley de Newton', resumen: 'Carrito sobre un riel tirado por una masa que cuelga de una polea, con sensor de ultrasonido.', receta: {
    titulo: 'Segunda ley de Newton', tipo: 'Práctica', bajada: 'Fuerza, masa y aceleración', descripcion: 'Una masa que cuelga tira del carrito a través de un hilo y una polea. El sensor mide la posición del carrito.',
    pasos: [{ titulo: 'Mesa y riel', texto: 'Apoyar el riel sobre la mesa, con un extremo al borde.' }, { titulo: 'Polea', texto: 'Apretar la polea en el borde de la mesa, alineada con el riel.' }, { titulo: 'Carrito', texto: 'Apoyar el carrito sobre el riel.' }, { titulo: 'Hilo y masa', texto: 'Atar el hilo al carrito, pasarlo por la polea y colgarle la masa.' }, { titulo: 'Sensor y micro:bit', texto: 'Poner el sensor de ultrasonido en el otro extremo del riel, apuntando al carrito, y conectarlo a la micro:bit.' }],
    piezas: [
      { id: 'mesa', de: 'elemento:mesa', params: { largo: 900, ancho: 450 }, x: 0, y: 0, paso: 1 },
      { id: 'riel', de: 'elemento:riel', params: { largo: 700, ancho: 100 }, sobre: 'mesa', mover: [90, 0, 0], paso: 1 },
      { id: 'polea', de: 'elemento:polea-de-mesa', params: { diametro: 50 }, pos: [462, 0, 29.5], paso: 2, entra: 'derecha' },
      { id: 'carrito', de: 'elemento:carrito', params: { largo: 150 }, sobre: 'riel', mover: [-200, 0, -12], paso: 3 },
      { id: 'hilo1', de: 'elemento:hilo', params: { largo: 525 }, nombre: 'Hilo', rot: [0, 90, 0], pos: [227, 0, 67], paso: 4, entra: 'arriba' },
      { id: 'hilo2', de: 'elemento:hilo', params: { largo: 230 }, nombre: 'Hilo', pos: [515, 0, -73], paso: 4, entra: 'derecha' },
      { id: 'masa', de: 'elemento:masa-gancho', params: { masa: 100 }, colgar: 'hilo2', mover: [0, 0, 4], paso: 4, entra: 'abajo' },
      { id: 'sensor', de: 'elemento:ultrasonido', rot: [0, 0, 90], sobre: 'riel', mover: [-330, 0, -12], paso: 5 },
      { id: 'mb', de: 'elemento:microbit', sobre: 'mesa', mover: [-380, -140, 0], paso: 5 }] } },
  { clave: 'caida', titulo: 'Caída libre con ultrasonido', resumen: 'Sensor de ultrasonido sostenido arriba, mirando hacia abajo, y una pelota que cae.', receta: {
    titulo: 'Caída libre', tipo: 'Práctica', bajada: 'Aceleración de la gravedad', descripcion: 'El sensor mira hacia abajo desde lo alto del soporte y mide la distancia a la pelota mientras cae.',
    pasos: [{ titulo: 'Soporte', texto: 'Apoyar el soporte universal al borde de la mesa.' }, { titulo: 'Nuez y pinza', texto: 'Ajustar la nuez bien arriba y sujetar en ella la pinza.' }, { titulo: 'Sensor', texto: 'Sostener el sensor con la pinza, con los dos «ojos» mirando hacia abajo, y conectarlo a la micro:bit.' }, { titulo: 'Pelota', texto: 'Sostener la pelota a 10 cm del sensor y soltarla. Abajo, un almohadón.' }],
    piezas: [
      { id: 'soporte', de: 'elemento:soporte-universal', params: { alto: 800 }, x: 0, y: 0, paso: 1 },
      { id: 'nuez', de: 'elemento:nuez', pos: [14, 26, 740], paso: 2, entra: 'atras' },
      { id: 'pinza', de: 'elemento:pinza', params: { largo: 170 }, pos: [100, 14, 753], paso: 2, entra: 'derecha' },
      { id: 'sensor', de: 'elemento:ultrasonido', rot: [90, 0, 0], pos: [222, 14, 742], paso: 3, entra: 'frente' },
      { id: 'mb', de: 'elemento:microbit', x: 60, y: -150, paso: 3 },
      { id: 'pelota', de: 'elemento:esfera', params: { diametro: 65 }, nombre: 'Pelota', pos: [222, 14, 560], paso: 4, entra: 'frente' },
      { id: 'almohadon', de: 'elemento:bloque', params: { x: 200, y: 200, z: 40 }, nombre: 'Almohadón', pos: [222, 14, 20], paso: 4, entra: 'frente' }] } },
  { clave: 'atwood', titulo: 'Máquina de Atwood', resumen: 'Polea colgada de un soporte con dos masas distintas unidas por un hilo.', receta: {
    titulo: 'Máquina de Atwood', tipo: 'Práctica', bajada: 'Dos masas y una polea', descripcion: 'Dos masas distintas cuelgan de los extremos de un hilo que pasa por una polea. La más pesada baja con aceleración constante.',
    pasos: [{ titulo: 'Soporte', texto: 'Apoyar el soporte universal sobre la mesa.' }, { titulo: 'Nuez y varilla', texto: 'Ajustar la nuez arriba y pasar la varilla horizontal.' }, { titulo: 'Polea', texto: 'Colgar la polea de la varilla.' }, { titulo: 'Hilo y masas', texto: 'Pasar el hilo por la polea y colgar una masa de cada lado.' }],
    piezas: [...soporte(700, 650),
      { id: 'polea', de: 'elemento:polea', params: { diametro: 60 }, colgar: 'brazo', mover: [70, 0, 0], paso: 3 },
      { id: 'hilo1', de: 'elemento:hilo', params: { largo: 180 }, nombre: 'Hilo', pos: [135, 14, 500], paso: 4, entra: 'abajo' },
      { id: 'hilo2', de: 'elemento:hilo', params: { largo: 360 }, nombre: 'Hilo', pos: [195, 14, 410], paso: 4, entra: 'abajo' },
      { id: 'm1', de: 'elemento:masa-gancho', params: { masa: 100 }, colgar: 'hilo1', mover: [0, 0, 4], paso: 4, entra: 'abajo' },
      { id: 'm2', de: 'elemento:masa-gancho', params: { masa: 150 }, colgar: 'hilo2', mover: [0, 0, 4], paso: 4, entra: 'abajo' }] } },
  { clave: 'enfriamiento', titulo: 'Enfriamiento de un líquido', resumen: 'Vaso con agua caliente, sonda de temperatura sostenida por una pinza y micro:bit.', receta: {
    titulo: 'Enfriamiento de un líquido', tipo: 'Práctica', bajada: 'Ley de enfriamiento de Newton', descripcion: 'Una sonda mide la temperatura del agua caliente del vaso mientras se enfría.',
    pasos: [{ titulo: 'Soporte y pinza', texto: 'Apoyar el soporte, ajustar la nuez a media altura y sujetar la pinza.' }, { titulo: 'Vaso', texto: 'Poner el vaso con agua caliente debajo de la pinza.' }, { titulo: 'Sonda', texto: 'Sujetar la sonda con la pinza de modo que quede sumergida sin tocar el fondo.' }, { titulo: 'micro:bit', texto: 'Conectar la sonda a la micro:bit.' }],
    piezas: [
      { id: 'soporte', de: 'elemento:soporte-universal', params: { alto: 400 }, x: 0, y: 0, paso: 1 },
      { id: 'nuez', de: 'elemento:nuez', pos: [14, 26, 250], paso: 1, entra: 'atras' },
      { id: 'pinza', de: 'elemento:pinza', params: { largo: 150 }, pos: [90, 14, 263], paso: 1, entra: 'derecha' },
      { id: 'vaso', de: 'elemento:vaso', params: { diametro: 80, alto: 100 }, pos: [190, 14, 50], paso: 2, entra: 'frente' },
      { id: 'sonda', de: 'elemento:termometro', params: { largo: 240 }, nombre: 'Sonda de temperatura', pos: [190, 14, 145], paso: 3, entra: 'arriba' },
      { id: 'mb', de: 'elemento:microbit', x: 60, y: -150, paso: 4 }] } },
  { clave: 'pendulo-carton', titulo: 'Péndulo con soporte de cartón', resumen: 'El soporte de péndulo encastrable del catálogo, con hilo y lenteja. Tarda unos segundos: usa el motor de piezas.', receta: {
    titulo: 'Péndulo con soporte de cartón', tipo: 'Práctica', bajada: 'Soporte encastrable del catálogo', descripcion: 'El soporte se recorta en cartón y se encastra sin pegamento. Del brazo cuelga el hilo con la lenteja.',
    pasos: [{ titulo: 'Soporte de cartón', texto: 'Imprimir las hojas, pegarlas sobre cartón de 3 mm, recortar y encastrar el soporte.' }, { titulo: 'Hilo y lenteja', texto: 'Atar el hilo en el corte del brazo y colgar la lenteja.' }, { titulo: 'micro:bit', texto: 'Apoyar la micro:bit cerca para tomar los datos.' }],
    piezas: [
      { id: 'soporte', de: 'carton:soporte de pendulo', x: 0, y: 0, paso: 1 },
      { id: 'hilo', de: 'elemento:hilo', params: { largo: 170 }, colgar: 'soporte/Brazo', mover: [0, 28, 6], paso: 2 },
      { id: 'lenteja', de: 'elemento:lenteja', params: { diametro: 28 }, colgar: 'hilo', mover: [0, 0, 4], paso: 2 },
      { id: 'mb', de: 'elemento:microbit', alLado: ['soporte', '+x'], mover: [40, 0, 0], paso: 3 }] } },
];

/* ---------- Prompt para la IA ---------- */
const EJEMPLO = LISTAS[0].receta;
export function promptIA(narracion, catalogo) {
  const L = [], p = (s) => L.push(s == null ? '' : s);
  p('Vas a diseñar una GUÍA DE ARMADO de un montaje de laboratorio de Física para el sitio fisicabit.com. El docente te cuenta con sus palabras qué quiere armar y vos devolvés una «receta» en JSON que el sitio convierte en un modelo 3D con sus pasos de armado. Respondé SOLO con el JSON, dentro de un bloque de código, sin explicaciones antes ni después.');
  p(); p('# 1. Lo que quiere armar el docente'); p('"""'); p((narracion || '').trim() || '(sin descripción: proponé un montaje simple de mecánica con micro:bit)'); p('"""');
  p(); p('# 2. Cómo funciona la herramienta');
  p('- La guía es una lista de PIEZAS ubicadas en el espacio y una lista de PASOS. Cada pieza entra en un paso. El sitio dibuja la portada (el dispositivo armado, con una letra por paso) y un cuadro por paso, con las piezas nuevas entrando con una flecha.');
  p('- Después de pegar tu respuesta, el docente puede mover cualquier pieza con el mouse, así que alcanza con que las posiciones sean razonables; lo importante es que no falte ninguna pieza, que los pasos estén en el orden real de armado y que nada quede flotando lejos de su lugar.');
  p('- Usá entre 3 y 8 pasos, de lo que va abajo o primero (base, soporte, mesa) a lo que va último (sensores, micro:bit, cables). Cada paso tiene un título de 1 a 4 palabras y un texto de una o dos oraciones, en imperativo o infinitivo, en español rioplatense.');
  p(); p('# 3. El espacio');
  p('- Medidas en milímetros. El piso (la mesa de trabajo) es el plano z = 0. Eje X: hacia la derecha. Eje Y: hacia el fondo (lo que tiene y negativo queda más cerca de quien mira). Eje Z: hacia arriba.');
  p('- «rot» son tres giros en grados alrededor de X, Y y Z: [rx, ry, rz]. Se aplica primero el giro en Z, después en Y y por último en X. Ejemplos: una varilla (que entra parada) queda horizontal a lo largo de X con [0, 90, 0] y a lo largo de Y con [90, 0, 0]. Un sensor de ultrasonido (que entra mirando hacia −Y) mira hacia +X con [0, 0, 90], hacia −X con [0, 0, -90] y hacia abajo con [90, 0, 0]. Una regla (que entra acostada) queda parada con los números hacia quien mira con [90, 0, 90].');
  p(); p('# 4. Cómo ubicar cada pieza (elegí UNA forma por pieza)');
  p('- `"x": número, "y": número` → apoyada en el piso, con su centro en esas coordenadas (lo más simple para la base del montaje y lo que va sobre la mesa).');
  p('- `"sobre": "id"` → apoyada encima de otra pieza, centrada sobre ella.');
  p('- `"colgar": "id"` → colgada debajo de otra pieza, centrada bajo ella (resorte de una varilla, masa de un hilo, hilo de un brazo).');
  p('- `"alLado": ["id", "+x"]` → apoyada en el piso pegada a un costado de otra pieza (+x derecha, -x izquierda, +y fondo, -y frente).');
  p('- `"pos": [x, y, z]` → el centro exacto de la pieza (el centro de la caja que la contiene, ya girada). Usalo cuando ninguna de las anteriores sirve.');
  p('- A cualquiera de ellas le podés sumar `"mover": [dx, dy, dz]` para corregir: por ejemplo colgar algo de una varilla horizontal pero corrido 60 mm hacia la punta.');
  p('- Las piezas se procesan en orden: una pieza solo puede referirse a ids que aparecen ANTES en la lista.');
  p('- `"entra"` dice desde dónde llega la pieza en el dibujo del paso: "arriba" (por defecto), "abajo", "izquierda", "derecha", "frente", "atras", o un vector [dx, dy, dz] en mm.');
  p(); p('# 5. Elementos de laboratorio disponibles (`"de": "elemento:<id>"`)');
  p('Cada uno acepta en `"params"` las claves que se indican (en mm salvo que diga otra cosa); lo que no pongas toma el valor entre paréntesis.');
  GRUPOS.forEach((g, i) => { p(); p('## ' + g); ELEMENTOS.filter((e) => e.grupo === i).forEach((e) => p('- `' + e.id + '` — ' + e.nombre + '. ' + e.desc + (e.campos.length ? ' Parámetros: ' + e.campos.map((c) => '`' + c[2] + '` (' + c[1] + ') ' + c[0].replace(/ \(mm\)$/, '').toLowerCase()).join('; ') + '.' : ''))); });
  p(); p('Medidas útiles: el soporte universal tiene una base de 200 × 130 × 15 mm y su varilla (12 mm de diámetro) queda 40 mm hacia el fondo del centro de la base; para cruzarle una varilla horizontal a una altura h se usa una nuez con `"pos": [14, 26, h]` y la varilla con `"rot": [0, 90, 0]` y `"pos": [largo/2 − 30, 14, h + 13]`. La micro:bit mide 52 × 42 mm; el carrito de 160 mm de largo mide 70 de ancho y 48 de alto; el sensor de ultrasonido mide 45 × 20 mm.');
  if (catalogo && (catalogo.carton.length || catalogo['3d'].length)) {
    p(); p('# 6. Piezas del catálogo de fisicabit (se fabrican en cartón o impresas en 3D)');
    p('Usalas cuando el docente las nombre o cuando reemplacen bien a un elemento genérico. Tardan unos segundos más en dibujarse.');
    if (catalogo.carton.length) { p(); p('## Cartón encastrable (`"de": "carton:<nombre>"`): entran armadas, con todas sus piezas'); catalogo.carton.forEach((c) => p('- `' + c.nombre + '`' + (c.desc ? ' — ' + c.desc : ''))); }
    if (catalogo['3d'].length) { p(); p('## Impresión 3D (`"de": "3d:<nombre>"`)'); catalogo['3d'].forEach((c) => p('- `' + c.nombre + '`' + (c.desc ? ' — ' + c.desc : '') + (c.piezas ? ' Con `"params": {"pieza": "…"}` se elige cuál: ' + c.piezas.join(', ') + '.' : ''))); }
    p('Para referirte a una pieza interna de un diseño de cartón (por ejemplo, colgar algo de su brazo) usá `"id del diseño/Nombre de la pieza"`.');
  }
  p(); p('# 7. Formato de la respuesta');
  p('Un único objeto JSON con estas claves:');
  p('- `"fisicabit": "' + FORMATO + '"` (obligatorio, tal cual).');
  p('- `"titulo"`: nombre de la práctica o del sistema. `"tipo"`: "Práctica", "Sistema", "Dispositivo" o "Pieza". `"bajada"`: una línea corta (tema o curso). `"descripcion"`: una o dos oraciones sobre para qué sirve el montaje.');
  p('- `"pasos"`: lista de `{ "titulo": "…", "texto": "…" }`, en orden.');
  p('- `"piezas"`: lista de piezas. Cada una: `"id"` (corto, único, sin espacios), `"de"` (de dónde sale), `"params"` (opcional), `"nombre"` (opcional: cómo se llama en la lista de piezas; poné uno claro cuando el elemento es genérico, como «Taco» para un bloque o «Sensor de temperatura» para un módulo), `"rot"` (opcional), UNA forma de ubicarla, `"mover"` (opcional), `"paso"` (número del paso en que entra, empezando en 1) y `"entra"` (opcional).');
  p(); p('Ejemplo completo (una práctica de ley de Hooke):');
  p('```json'); p(JSON.stringify(Object.assign({ fisicabit: FORMATO }, EJEMPLO), null, 1)); p('```');
  p(); p('# 8. Antes de responder, revisá');
  p('1. ¿Están todas las piezas que nombró el docente, y las que hacen falta para que el montaje se sostenga (base, soporte, mesa, tacos)?');
  p('2. ¿Cada `"de"` usa un id de las listas de arriba, escrito exactamente igual? No inventes elementos: si algo no está, usá `elemento:bloque`, `elemento:cilindro` o `elemento:sensor` con un `"nombre"` que diga qué es.');
  p('3. ¿Cada pieza se refiere solo a ids anteriores, y todas tienen `"paso"` entre 1 y la cantidad de pasos?');
  p('4. ¿Las alturas tienen sentido? Lo que cuelga queda por encima del piso; lo que se apoya, sobre algo.');
  p('5. ¿El JSON es válido (comillas dobles, sin comas de más, sin comentarios)?');
  return L.join('\n');
}

/* ---------- Leer la respuesta ---------- */
export function leerReceta(texto) {
  let t = String(texto || '').trim(); if (!t) throw new Error('Pegá primero la respuesta de la IA.');
  const m = /```(?:json)?\s*([\s\S]*?)```/.exec(t); if (m) t = m[1].trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a < 0 || b <= a) throw new Error('No encuentro la receta: tiene que empezar con { y terminar con }.');
  t = t.slice(a, b + 1).replace(/[“”]/g, '"').replace(/,\s*([}\]])/g, '$1');
  let r; try { r = JSON.parse(t); } catch (e) { throw new Error('La receta tiene un error de escritura (' + e.message.replace(/^JSON\.parse: |Unexpected /i, '') + '). Pedile a la IA: «revisá que el JSON sea válido y mandalo de nuevo».'); }
  if (!r || !Array.isArray(r.piezas) || !r.piezas.length) throw new Error('La receta no trae piezas.');
  if (!Array.isArray(r.pasos) || !r.pasos.length) r.pasos = [{ titulo: 'Armado', texto: '' }];
  r.piezas = r.piezas.filter((q) => q && typeof q.de === 'string');
  return r;
}
