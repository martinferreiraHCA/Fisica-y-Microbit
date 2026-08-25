const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType,
  BorderStyle, ShadingType, LevelFormat, PageBreak, convertMillimetersToTwip,
  Table, TableRow, TableCell, WidthType, VerticalAlign,
  Bookmark, InternalHyperlink, FootnoteReferenceRun,
} = require('docx');

const SHOTS = path.join(__dirname, '..', 'img');
const img = (name) => fs.readFileSync(path.join(SHOTS, name));

const FONT = 'Montserrat';
const MONO = 'Courier New';
const BLACK = '000000';
const GRAY = '555555';
const LIGHT = 'F5F5F5';

// ---------- helpers ----------
const cap = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 60, after: 240 },
  children: [new TextRun({ text, font: FONT, size: 17, color: GRAY, italics: true })],
});

const pic = (name, w, h) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 120, after: 40 },
  children: [new ImageRun({ type: 'png', data: img(name), transformation: { width: w, height: h } })],
});

// h1 con marcador opcional para saltos internos
const h1 = (text, anchor) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 420, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: BLACK, space: 4 } },
  children: anchor
    ? [new Bookmark({ id: anchor, children: [new TextRun({ text, font: FONT, bold: true, size: 26, color: BLACK })] })]
    : [new TextRun({ text, font: FONT, bold: true, size: 26, color: BLACK })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 300, after: 140 },
  children: [new TextRun({ text, font: FONT, bold: true, size: 22, color: BLACK })],
});

const body = (runsOrText, opts = {}) => new Paragraph({
  spacing: { after: 140, line: 300 },
  children: (typeof runsOrText === 'string'
    ? [new TextRun({ text: runsOrText, font: FONT, size: 20 })]
    : runsOrText),
  ...opts,
});

const t = (text, o = {}) => new TextRun({ text, font: FONT, size: 20, ...o });
const b = (text) => t(text, { bold: true });
const code = (text) => new TextRun({ text, font: MONO, size: 18 });

const step = (n, runs) => new Paragraph({
  spacing: { before: 120, after: 100, line: 300 },
  indent: { left: 360, hanging: 360 },
  children: [t(`${n}.  `, { bold: true }), ...runs],
});

const bullet = (runs) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 },
  spacing: { after: 80, line: 280 },
  children: typeof runs === 'string' ? [t(runs)] : runs,
});

const codeBlock = (lines) => lines.map((line, i) => new Paragraph({
  shading: { type: ShadingType.CLEAR, fill: LIGHT },
  border: { left: { style: BorderStyle.SINGLE, size: 24, color: BLACK, space: 8 } },
  spacing: { after: i === lines.length - 1 ? 200 : 0, line: 260 },
  indent: { left: 240 },
  children: [new TextRun({ text: line || ' ', font: MONO, size: 18 })],
}));

// bloque de código comentado: [linea, explicacion]
const codeWhy = (pairs) => pairs.map(([line, why], i) => new Paragraph({
  shading: { type: ShadingType.CLEAR, fill: LIGHT },
  border: { left: { style: BorderStyle.SINGLE, size: 24, color: BLACK, space: 8 } },
  spacing: { after: i === pairs.length - 1 ? 200 : 0, line: 264 },
  indent: { left: 240 },
  children: why
    ? [new TextRun({ text: line, font: MONO, size: 18 }),
       new TextRun({ text: '   ← ' + why, font: FONT, size: 16, color: GRAY, italics: true })]
    : [new TextRun({ text: line || ' ', font: MONO, size: 18 })],
}));

const infoBox = (runs) => new Paragraph({
  shading: { type: ShadingType.CLEAR, fill: LIGHT },
  border: { left: { style: BorderStyle.SINGLE, size: 36, color: BLACK, space: 10 } },
  spacing: { before: 160, after: 220, line: 290 },
  indent: { left: 120, right: 120 },
  children: runs,
});

// nota al pie: referencia numerada
const fn = (n) => new FootnoteReferenceRun(n);
const ftext = (runs) => new Paragraph({
  spacing: { after: 40, line: 240 },
  children: runs.map(r => typeof r === 'string' ? new TextRun({ text: r, font: FONT, size: 16 }) : r),
});

// recuadro "¿COMO FUNCIONA?": titulo en banda negra + cuerpo sombreado
const howBox = (title, runs) => [
  new Paragraph({
    shading: { type: ShadingType.CLEAR, fill: BLACK },
    spacing: { before: 200, after: 0 },
    indent: { left: 120, right: 120 },
    children: [new TextRun({ text: '¿CÓMO FUNCIONA?  ·  ' + title, font: FONT, bold: true, size: 18, color: 'FFFFFF' })],
  }),
  new Paragraph({
    shading: { type: ShadingType.CLEAR, fill: LIGHT },
    spacing: { before: 0, after: 240, line: 290 },
    indent: { left: 120, right: 120 },
    children: runs,
  }),
];

// salto interno: caja negra clicable estilo botón de la plataforma
const jump = (label, anchor) => new Paragraph({
  alignment: AlignmentType.CENTER,
  shading: { type: ShadingType.CLEAR, fill: BLACK },
  spacing: { before: 240, after: 280, line: 300 },
  children: [new InternalHyperlink({
    anchor,
    children: [new TextRun({ text: '➜  ' + label, font: FONT, bold: true, size: 21, color: 'FFFFFF' })],
  })],
});

// link interno en linea
const goTo = (label, anchor) => new InternalHyperlink({
  anchor,
  children: [new TextRun({ text: label, font: FONT, bold: true, size: 20, color: BLACK, underline: {} })],
});

// tabla minimalista: encabezado negro, filas con linea inferior
const mkTable = (widths, header, rows) => {
  const total = widths.reduce((a, x) => a + x, 0);
  const cell = (content, isHeader, w) => new TableCell({
    width: { size: w, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    shading: { type: ShadingType.CLEAR, fill: isHeader ? BLACK : 'FFFFFF' },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      spacing: { after: 0, line: 264 },
      children: typeof content === 'string'
        ? [new TextRun({ text: content, font: FONT, size: 18, bold: isHeader, color: isHeader ? 'FFFFFF' : BLACK })]
        : content,
    })],
  });
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: BLACK },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: BLACK },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
    },
    rows: [
      new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, true, widths[i])) }),
      ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, false, widths[i])) })),
    ],
  });
};

const spacer = () => new Paragraph({ spacing: { after: 160 }, children: [] });

// ---------- portada ----------
const cover = [
  new Paragraph({ spacing: { before: 2200 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.CLEAR, fill: BLACK },
    spacing: { before: 0, after: 0, line: 276 },
    children: [new TextRun({ text: ' ', size: 10 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.CLEAR, fill: BLACK },
    children: [new TextRun({ text: 'micro:bit DataLab Pro', font: FONT, bold: true, size: 64, color: 'FFFFFF' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.CLEAR, fill: BLACK },
    spacing: { after: 0 },
    children: [new TextRun({ text: 'MANUAL DE USUARIO — GUÍA 1', font: FONT, size: 22, color: 'FFFFFF' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.CLEAR, fill: BLACK },
    spacing: { before: 0, after: 600, line: 276 },
    children: [new TextRun({ text: ' ', size: 10 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text: 'Captura de datos con timestamp (1 variable)', font: FONT, bold: true, size: 36 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: 'y procesamiento básico de los datos', font: FONT, size: 30 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 1400 },
    children: [new TextRun({ text: 'Dos caminos: conexión Serial (USB) o Bluetooth', font: FONT, size: 22, color: GRAY })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 12, color: BLACK, space: 8 } },
    spacing: { before: 200 },
    children: [new TextRun({ text: 'fisicabit.com  ·  Física y micro:bit', font: FONT, size: 20, color: GRAY })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- contenido ----------
const content = [
  h1('1 · QUÉ VAS A APRENDER'),
  body([t('Esta guía recorre, paso a paso, el uso básico de la plataforma micro:bit DataLab Pro con el flujo más común: capturar datos de una sola variable enviados por la micro:bit junto con su timestamp'), fn(1), t(' (marca de tiempo), y luego aplicar un procesamiento básico a esos datos. Los términos técnicos llevan una nota al pie la primera vez que aparecen y están reunidos al final, en el '), goTo('Glosario (sección 13)', 'glosario'), t('.')]),
  bullet([t('Elegir el tipo de conexión ('), b('Camino A: Serial/USB'), t(' o '), b('Camino B: Bluetooth'), t(') y entender las latencias de cada uno.')]),
  bullet('Programar la micro:bit en MakeCode, entendiendo qué hace cada línea del código.'),
  bullet('Conectar, capturar y ver los datos en la gráfica y en la tabla.'),
  bullet([t('Poner en cero el tiempo con '), b('ESTABLECER T=0'), t(', depurar datos y exportar a CSV.')]),
  infoBox([
    b('Requisitos: '),
    t('una micro:bit (V1 o V2), cable USB o Bluetooth, y el navegador '),
    b('Chrome'), t(' o '), b('Edge'),
    t(' en computadora (Windows, Mac o Linux) o Android. La única excepción son iPhone y iPad: Apple no permite Web Serial ni Web Bluetooth'), fn(2), t(' en iOS/iPadOS — en Mac ambas funcionan sin problema.'),
  ]),

  h1('2 · LA PANTALLA PRINCIPAL'),
  body([t('Al abrir el sitio se ve la '), b('barra de herramientas'), t(' (arriba), la '), b('gráfica'), t(' (centro) y el '), b('panel lateral'), t(' con las secciones de configuración (derecha). El estado de la conexión aparece en el extremo superior derecho: '), b('DESCONECTADO'), t('.')]),
  pic('01_pantalla_principal.png', 620, 388),
  cap('Pantalla principal: barra de herramientas, gráfica y panel lateral.'),
  pic('02_toolbar.png', 620, 47),
  cap('Barra de herramientas: CONECTAR (USB), BLUETOOTH, CÁMARA, INFORME, EXPORTAR CSV, LIMPIAR, AYUDA.'),

  // ==================== ELECCION DE CAMINO ====================
  h1('3 · ELEGÍ TU CAMINO: ¿SERIAL O BLUETOOTH?'),
  body([t('La micro:bit puede enviar los datos por '), b('cable USB (conexión Serial)'), t(' o por '), b('Bluetooth (BLE)'), t('. El resto de la guía se divide en dos caminos; solo tenés que seguir uno.')]),
  mkTable([2800, 3236, 3036],
    ['Criterio', 'CAMINO A · Serial (USB)', 'CAMINO B · Bluetooth'],
    [
      ['Velocidad real máxima', '~100 Hz (everyInterval)', '~30–50 Hz'],
      ['Latencia', 'Baja y estable', 'Variable: los datos llegan en lotes'],
      ['Configuración en MakeCode', 'Ninguna extra', 'Extensión bluetooth + "No Pairing Required"'],
      ['Movilidad del experimento', 'Limitada por el cable', 'Total (~10 m, a batería)'],
      ['Dificultad de conexión', 'Muy simple', 'Requiere configurar bien el proyecto'],
    ]),
  spacer(),
  body([b('Recomendación: '), t('usá el '), b('Camino A (Serial)'), t(' siempre que el experimento lo permita: es más simple, más rápido y con tiempos más estables. Reservá el '), b('Camino B (Bluetooth)'), t(' para experimentos donde el cable molesta o es imposible: péndulos largos, carritos, caída libre, sistemas rotantes.')]),

  h2('¿Por qué importa la latencia? (y por qué pedimos el timestamp)'),
  body([t('Los datos no viajan de a uno: tanto el USB como el Bluetooth los entregan al navegador '), b('en lotes'), fn(3), t('. Si la plataforma les pusiera la hora al llegar, todos los puntos de un mismo lote quedarían con el mismo tiempo (además, el reloj del navegador tiene una resolución limitada, de ~16 ms). Con Bluetooth el efecto es mayor: la radio agrupa los datos según su intervalo de conexión (~30–50 ms) y la latencia varía punto a punto.')]),
  body([t('La solución es que '), b('la propia micro:bit marque la hora de cada medición'), t(' con '), code('input.runningTime()'), t(' (milisegundos desde que encendió) y la envíe junto al valor: '), code('tiempo,valor'), t('. Así cada punto lleva el instante real en que se midió, sin importar cuándo ni cómo llegó al navegador. Por eso todos los códigos de esta guía envían el timestamp, y la casilla '), b('“Micro:bit envía timestamp”'), t(' de la plataforma está activada por defecto.')]),
  infoBox([
    b('En resumen: '),
    t('el timestamp de la micro:bit “desarma” los lotes y devuelve a cada punto su tiempo verdadero. Es imprescindible en Bluetooth y muy recomendable en USB para fenómenos rápidos.'),
  ]),
  body([t('Ahora sí, elegí tu camino:')]),
  jump('CAMINO A — CONEXIÓN SERIAL POR USB (RECOMENDADO)', 'caminoA'),
  jump('CAMINO B — CONEXIÓN BLUETOOTH', 'caminoB'),

  // ==================== CAMINO A ====================
  h1('4 · CAMINO A — CONEXIÓN SERIAL POR USB', 'caminoA'),
  h2('4.1 · El programa en MakeCode, línea por línea'),
  body([t('Entrá a '), b('makecode.microbit.org'), t(', creá un '), b('Nuevo proyecto'), t(' y pegá este código (en la vista JavaScript; MakeCode lo convierte a bloques automáticamente). No hace falta ninguna extensión:')]),
  ...codeWhy([
    ['basic.forever(function () {', 'repite para siempre'],
    ['    let t = input.runningTime()', 'timestamp: ms desde el encendido'],
    ['    let valor = input.acceleration(Dimension.X)', 'el sensor a medir'],
    ['    serial.writeLine("" + t + "," + valor)', 'envía "tiempo,valor" + salto de línea'],
    ['    basic.pause(100)', 'espera 100 ms entre lecturas'],
    ['})', null],
  ]),
  body([t('Por qué está escrito así:')]),
  bullet([code('serial.writeLine'), t(' arma una '), b('línea de texto por punto'), t(': el salto de línea final es lo que la plataforma usa para separar un dato del siguiente, y la coma separa el tiempo del valor. Ese es todo el “protocolo”.')]),
  bullet([code('input.runningTime()'), t(' va '), b('dentro'), t(' del bucle, inmediatamente antes de leer el sensor: así el tiempo corresponde al instante de la medición, no al del envío.')]),
  bullet([t('Podés reemplazar '), code('input.acceleration(Dimension.X)'), t(' por '), code('input.temperature()'), t(', '), code('input.lightLevel()'), t(' o '), code('pins.analogReadPin(AnalogPin.P0)'), t(' sin tocar nada más.')]),

  ...howBox('LA COMUNICACIÓN SERIAL POR USB', [
    t('La micro:bit convierte cada línea de texto en una secuencia de bytes que viaja por el cable. Del lado de la computadora, el navegador la recibe mediante Web Serial y la entrega a la plataforma, que corta el flujo en líneas (por el salto de línea) y en columnas (por las comas). Es el mismo mecanismo de los viejos puertos serie de PC: simple, robusto y con latencia baja y pareja. A 115200 baudios viajan unos 11.500 caracteres por segundo — muchísimo más de lo que el programa llega a generar.'),
  ]),

  h2('4.2 · Velocidad real: forever vs everyInterval'),
  body([t('El límite de velocidad no lo pone el puerto (115200 baudios'), fn(4), t(' ≈ 11.500 caracteres/segundo) sino el '), b('scheduler de MakeCode'), fn(5), t(': cada vuelta de '), code('basic.forever'), t(' agrega ~20 ms ocultos. Por eso con '), code('pause(100)'), t(' se obtienen ~8 Hz'), fn(6), t(' reales, y aunque saques la pausa, '), code('forever'), t(' no pasa de ~50 Hz. Para fenómenos rápidos usá '), code('loops.everyInterval'), t(', que no tiene ese sobrecosto:')]),
  ...codeWhy([
    ['loops.everyInterval(10, function () {', 'cada 10 ms exactos: ~100 Hz reales'],
    ['    let t = input.runningTime()', null],
    ['    let valor = input.acceleration(Dimension.X)', null],
    ['    serial.writeLine("" + t + "," + valor)', null],
    ['})', null],
  ]),
  mkTable([3600, 2400, 3072],
    ['Código', 'Frecuencia real', 'Uso típico'],
    [
      ['forever + pause(500-1000)', '1–2 Hz', 'Temperatura, enfriamiento'],
      ['forever + pause(100-200)', '~5–8 Hz', 'Luz ambiental, procesos lentos'],
      ['forever + pause(20-50)', '~14–25 Hz', 'Movimiento general'],
      ['everyInterval(20)', '~50 Hz', 'Oscilaciones, choques'],
      ['everyInterval(10)', '~100 Hz', 'Máximo recomendado'],
    ]),
  spacer(),

  h2('4.3 · Grabar el programa'),
  step(1, [t('Conectá la micro:bit por USB y presioná '), b('Descargar'), t(' en MakeCode. Si el navegador ofrece '), b('emparejar el dispositivo (WebUSB)'), fn(7), t(', aceptá: se graba solo. Si no, copiá el archivo '), code('.hex'), fn(8), t(' a la unidad '), b('MICROBIT'), t(' que aparece como un pendrive.')]),
  step(2, [t('Esperá a que la luz naranja del reverso deje de parpadear: el programa ya está corriendo.')]),

  ...howBox('QUÉ PASA AL PRESIONAR “DESCARGAR”', [
    t('MakeCode compila tu programa (bloques o JavaScript) junto con su sistema de ejecución y lo empaqueta en un único archivo .hex: una imagen de la memoria del microcontrolador. La micro:bit tiene un segundo chip dedicado a la interfaz USB que, al recibir ese archivo, lo graba en la memoria flash del chip principal (la luz naranja parpadea mientras tanto). Desde entonces el programa corre solo cada vez que la placa recibe energía: no necesita la computadora ni MakeCode para funcionar.'),
  ]),

  h2('4.4 · Conectar desde la plataforma'),
  step(3, [t('Verificá que el cable sea '), b('USB de datos'), t(' (algunos solo cargan) y '), b('cerrá MakeCode'), t(' o cualquier consola serial: si otra pestaña tiene el puerto abierto, la plataforma no puede usarlo.')]),
  step(4, [t('Presioná '), b('CONECTAR'), t(' en la barra de herramientas. En la ventanita del navegador elegí el puerto de la micro:bit ('), b('“BBC micro:bit CMSIS-DAP”'), t(' o similar) y presioná '), b('Conectar'), t('. La velocidad (115200 baudios) la configura la plataforma sola.')]),
  body([t('Con esto la conexión está lista. Seguí en la configuración de la plataforma:')]),
  jump('CONTINUÁ EN LA SECCIÓN 6 — CONFIGURAR LA PLATAFORMA', 'configuracion'),

  // ==================== CAMINO B ====================
  h1('5 · CAMINO B — CONEXIÓN BLUETOOTH', 'caminoB'),
  body([t('La conexión inalámbrica usa el servicio '), b('UART'), fn(9), t(' sobre '), b('Bluetooth Low Energy'), t('. Requiere dos configuraciones en MakeCode que, cuando faltan, son la causa típica de que “no conecte”.')]),

  h2('5.1 · Configurar Bluetooth en MakeCode'),
  step(1, [b('Agregar la extensión Bluetooth: '), t('en el editor, abrí '), b('Extensiones'), t(' (en el menú de bloques o en ⚙ → Extensiones), buscá '), code('bluetooth'), t(' y hacé clic en la tarjeta. MakeCode avisa que quitará la extensión '), b('radio'), t(': aceptá (radio y Bluetooth no pueden convivir en el mismo programa).')]),
  step(2, [b('Activar “No Pairing Required”: '), t('abrí '), b('⚙ → Configuración del proyecto'), t(' y seleccioná '), b('“No Pairing Required: Anyone can connect via Bluetooth (JustWorks)”'), t('. Guardá. Sin esto, Chrome/Edge suelen quedarse en “Conectando…”: la micro:bit pide un emparejamiento'), fn(10), t(' que el navegador no completa.')]),
  step(3, [t('Equivalente a mano en '), code('pxt.json'), fn(11), t(': la sección bluetooth debe incluir '), code('"pairing_mode": 0'), t(':')]),
  ...codeBlock([
    '"bluetooth": {',
    '    "open": 1,',
    '    "pairing_mode": 0,',
    '    "whitelist": 0,',
    '    "security_level": null',
    '}',
  ]),
  infoBox([
    b('Importante: '),
    t('al agregar la extensión Bluetooth se desactiva el envío por serial USB (un mismo programa no puede usar los dos). Y cada vez que cambies esta configuración tenés que '), b('volver a grabar el .hex'), t(': los ajustes viven dentro del programa.'),
  ]),

  h2('5.2 · El programa en MakeCode, línea por línea'),
  ...codeWhy([
    ['let t = 0', null],
    ['let valor = 0', null],
    ['bluetooth.startUartService()', 'publica el "canal serie" por BLE'],
    ['', null],
    ['basic.forever(function () {', null],
    ['    t = input.runningTime()', 'timestamp: el instante real de la medición'],
    ['    valor = input.acceleration(Dimension.X)', 'el sensor a medir'],
    ['    bluetooth.uartWriteLine("" + t + "," + valor)', 'igual que serial, pero por radio'],
    ['    basic.pause(100)', '~8 Hz; suficiente para BLE'],
    ['})', null],
  ]),
  bullet([code('bluetooth.startUartService()'), t(' va en el inicio, fuera del bucle: crea el servicio UART que la plataforma busca al conectar. Si falta, aparece el error '), b('“UART no encontrado”'), t('.')]),
  bullet([code('bluetooth.uartWriteLine'), t(' usa el mismo formato '), code('tiempo,valor'), t(' que el serial: para la plataforma ambos caminos son idénticos una vez que el dato llega.')]),

  h2('5.3 · Latencia y límites del BLE'),
  body([t('En BLE los datos no fluyen continuo: cada notificación UART lleva '), b('hasta 20 bytes'), t(' y la radio solo transmite en los '), b('intervalos de conexión'), t(' (~30–50 ms). Resultado: los puntos llegan '), b('en ráfagas'), t(', con latencia variable, y el máximo práctico ronda los '), b('30–50 Hz'), t('. Acá el timestamp de la micro:bit no es opcional: sin él, todos los puntos de una ráfaga quedarían apilados en el mismo instante. Si tu experimento necesita más de ~50 Hz, volvé al '), goTo('Camino A (USB)', 'caminoA'), t('.')]),

  ...howBox('EL UART SOBRE BLUETOOTH LOW ENERGY', [
    t('BLE está pensado para gastar poca energía: la radio no transmite continuo sino en ventanas breves acordadas entre los dos equipos (el intervalo de conexión, típicamente 30–50 ms). El servicio UART simula un puerto serie sobre ese esquema: la micro:bit acumula los caracteres y los envía en paquetes (notificaciones) de hasta 20 bytes cuando se abre la ventana. Por eso los datos llegan en ráfagas y la latencia varía punto a punto — y por eso el timestamp lo pone la micro:bit, no el navegador.'),
  ]),

  h2('5.4 · Grabar y conectar'),
  step(4, [t('Grabá el programa (Descargar → unidad MICROBIT o WebUSB) y esperá la luz naranja. Después podés '), b('desconectar el cable'), t(' y alimentar la micro:bit a batería: el '), code('runningTime()'), t(' sigue corriendo igual.')]),
  step(5, [t('En la plataforma presioná el botón azul '), b('BLUETOOTH'), t('. Aparece primero una guía con los requisitos; verificá los tres puntos y presioná '), b('CONECTAR'), t('.')]),
  pic('04_bluetooth_modal.png', 620, 388),
  cap('Guía de conexión Bluetooth: configuración del proyecto, reinicio y botón CONECTAR.'),
  step(6, [t('En el selector del navegador elegí tu placa: '), b('“BBC micro:bit [XXXXX]”'), t(' (las letras identifican a cada micro:bit). Esperá a que el botón cambie a '), b('BLUETOOTH CONECTADO'), t('.')]),
  infoBox([
    b('Reconexión automática: '),
    t('si la micro:bit se aleja o pierde señal (alcance típico ~10 m), la plataforma reintenta sola hasta 4 veces. Si la placa no aparece en el selector, reiniciala con RESET y verificá que no esté conectada a otro dispositivo.'),
  ]),
  jump('CONTINUÁ EN LA SECCIÓN 6 — CONFIGURAR LA PLATAFORMA', 'configuracion'),

  // ==================== TRONCO COMUN ====================
  h1('6 · CONFIGURAR LA PLATAFORMA', 'configuracion'),
  body([t('Desde acá el camino es el mismo para USB y Bluetooth. Antes de capturar, abrí la vista '), b('CONFIG'), t(' (o el panel lateral) y en la sección '), b('VARIABLES'), t(' verificá dos cosas:')]),
  step(1, [t('La casilla '), b('MICRO:BIT ENVÍA TIMESTAMP'), t(' debe estar '), b('activada'), t(' (es el valor por defecto), porque nuestro programa envía '), code('tiempo,valor'), t('.')]),
  step(2, [b('NÚMERO DE VARIABLES'), t(' en '), b('1 Variable'), t('. Podés cambiar el nombre y el color de la variable. Presioná '), b('APLICAR CONFIGURACIÓN'), t('.')]),
  pic('03_config_variables.png', 240, 635),
  cap('Sección VARIABLES: casilla de timestamp activada y 1 variable configurada.'),
  infoBox([
    b('Regla de oro: '),
    t('el número de valores que envía la micro:bit debe coincidir con el número de variables configurado. Si el programa envía '),
    code('tiempo,valor'), t(' la casilla de timestamp debe estar activada; si envía solo '), code('valor'), t(', desactivada.'),
  ]),

  h1('7 · CAPTURAR DATOS'),
  step(1, [t('Con la conexión establecida, el estado cambia a '), b('CONECTADO — Presiona CAPTURAR'), t(' y aparece el botón '), b('CAPTURAR'), t('.')]),
  pic('05_conectado.png', 620, 47),
  cap('micro:bit conectada: el botón CAPTURAR reemplaza a CONECTAR.'),
  step(2, [t('Presioná '), b('CAPTURAR'), t('. El estado pasa a '), b('CAPTURANDO'), t(' y los puntos aparecen en la gráfica en tiempo real. El indicador verde muestra la frecuencia de muestreo y la cantidad de puntos.')]),
  pic('06_capturando.png', 620, 388),
  cap('Captura en vivo: los datos llegan de la micro:bit y se grafican al instante.'),
  step(3, [t('Cuando termine el experimento presioná '), b('DETENER'), t('. Los datos quedan en memoria para analizarlos.')]),
  pic('07_captura_finalizada.png', 620, 388),
  cap('Captura finalizada: 30 segundos de una oscilación amortiguada (1 variable).'),

  h1('8 · VER LOS DATOS EN LA TABLA'),
  body([t('En la vista '), b('CONFIG'), t(', la sección '), b('DATOS'), t(' muestra la tabla completa: número de punto ('), b('#'), t('), tiempo en segundos ('), b('TIEMPO (S)'), t(') y el valor de la variable. Con el buscador podés filtrar por valor o tiempo, y con la ✕ eliminar una fila puntual.')]),
  pic('08_tabla_datos.png', 620, 254),
  cap('Tabla de datos: tiempo (s) y Variable 1, punto por punto.'),

  h1('9 · PROCESAMIENTO BÁSICO: PONER EL TIEMPO EN CERO'),
  body([t('Al capturar con timestamp, el tiempo cero inicial es el comienzo de la captura. Muchas veces conviene que el '), b('t = 0'), t(' coincida con el inicio del fenómeno (por ejemplo, cuando soltás el péndulo). Para eso está '), b('ESTABLECER T=0'), t('.')]),
  step(1, [t('En la tabla de datos, hacé '), b('clic en la fila'), t(' del punto que querés usar como tiempo cero. La fila se resalta en rojo y arriba aparece '), b('PUNTO #21 SELECCIONADO'), t('.')]),
  pic('09_fila_seleccionada.png', 620, 254),
  cap('Punto nº 21 (t = 2 s) seleccionado en la tabla.'),
  body([t('El punto seleccionado también se marca en rojo en la gráfica (podés seleccionarlo directamente haciendo clic sobre el punto en la gráfica):')]),
  pic('09_punto_seleccionado.png', 620, 388),
  cap('El mismo punto seleccionado, visto en la gráfica.'),
  step(2, [t('En la sección '), b('CONFIGURACIÓN DE GRÁFICAS'), t(' del panel lateral, presioná '), b('ESTABLECER T=0'), t(' (se habilita cuando hay exactamente un punto seleccionado).')]),
  pic('10_establecer_t0.png', 620, 224),
  cap('El botón ESTABLECER T=0, debajo de APLICAR CONFIGURACIÓN.'),
  step(3, [t('Listo: el punto elegido pasa a ser '), b('t = 0'), t('. Los puntos anteriores quedan con tiempo negativo y toda la gráfica y la tabla se recalculan al instante.')]),
  pic('11_t0_aplicado.png', 620, 388),
  cap('Después de ESTABLECER T=0: el eje de tiempo quedó centrado en el nuevo cero.'),
  pic('11_tabla_t0.png', 620, 254),
  cap('La tabla tras el T=0: los primeros puntos tienen ahora tiempo negativo.'),
  infoBox([
    b('Nota: '),
    t('el T=0 también se aplica al exportar CSV: la columna Tiempo del archivo sale ya referida al nuevo cero. Para deshacerlo, seleccioná el primer punto y volvé a presionar ESTABLECER T=0.'),
  ]),

  h1('10 · DEPURAR DATOS'),
  body([t('La sección '), b('DEPURACIÓN DE DATOS'), t(' permite limpiar puntos incorrectos (por ejemplo, los segundos previos al inicio real del fenómeno o un pico espurio):')]),
  bullet([b('ELIMINAR RANGO'), t(': ingresá el número de punto inicial y final (por ejemplo, del 1 al 10) y presioná el botón.')]),
  bullet([b('ELIMINAR SELECCIONADOS'), t(': borrá los puntos que hayas marcado con clic en la gráfica o en la tabla.')]),
  pic('12_depuracion.png', 620, 363),
  cap('Depuración: eliminar un rango de puntos (del 1 al 10) o los seleccionados.'),

  h1('11 · EXPORTAR LOS DATOS (CSV)'),
  body([t('Presioná '), b('EXPORTAR CSV'), fn(12), t(' en la barra de herramientas. Se descarga un archivo '), code('microbit_data_FECHA.csv'), t(' con una columna de tiempo (en la unidad elegida y con el T=0 aplicado) y una columna por variable:')]),
  ...codeBlock([
    'Tiempo,Variable 1',
    '-2.000000,921.000000',
    '-1.900000,856.000000',
    '-1.800000,700.000000',
    '...',
  ]),
  pic('13_exportar.png', 620, 47),
  cap('EXPORTAR CSV queda habilitado en cuanto hay datos capturados.'),
  body([t('Ese archivo se abre directamente en Excel, LibreOffice, GeoGebra o Python, y también puede reimportarse en la plataforma desde '), b('INGRESO DE DATOS'), t(' para seguir analizándolo otro día.')]),

  h1('12 · PROBLEMAS FRECUENTES'),
  h2('Camino A · Serial (USB)'),
  bullet([b('No aparece el puerto: '), t('verificá que el cable USB sea de datos (no solo de carga), probá otro puerto USB y reiniciá el navegador. Cerrá MakeCode u otras consolas seriales que puedan tener el puerto tomado.')]),
  bullet([b('No llegan datos por USB: '), t('el programa debe usar '), code('serial.writeLine()'), t('. Presioná CAPTURAR después de conectar y verificá que el número de variables configurado coincida con lo que envía el código.')]),
  h2('Camino B · Bluetooth'),
  bullet([b('No aparece en el selector: '), t('el programa debe tener '), code('bluetooth.startUartService()'), t('. Reiniciá la micro:bit (botón RESET) y verificá que no esté conectada a otro dispositivo o celular.')]),
  bullet([b('Aparece pero se queda en “Conectando…”: '), t('falta '), b('“No Pairing Required”'), t(' en la configuración del proyecto de MakeCode (en '), code('pxt.json'), t(' debe estar '), code('"pairing_mode": 0'), t('). Corregí, volvé a descargar el .hex y reintentá.')]),
  bullet([b('Se conecta pero no llegan datos: '), t('el programa debe usar '), code('bluetooth.uartWriteLine()'), t('. Presioná CAPTURAR después de conectar y verificá la casilla “Micro:bit envía timestamp”.')]),
  bullet([b('Error “UART no encontrado”: '), t('al programa le falta '), code('bluetooth.startUartService()'), t('. Agregalo y volvé a grabar.')]),
  bullet([b('Error “Not supported” o conexión rara: '), t('caché Bluetooth corrupto del navegador. Entrá a '), code('chrome://bluetooth-internals'), t(' → Devices → olvidá la micro:bit y reconectá. En macOS, quitala también de Preferencias del Sistema → Bluetooth.')]),
  bullet([b('Se desconecta seguido: '), t('acercá la micro:bit (~10 m máximo) y revisá la batería. La plataforma reconecta sola hasta 4 veces.')]),
  bullet([b('No funciona en iPhone/iPad: '), t('Apple no permite Web Bluetooth ni Web Serial en iOS/iPadOS (solo ahí: en Mac funcionan). Usá Chrome o Edge en computadora — incluida una Mac — o Android; en iPad podés cargar datos por CSV.')]),
  h2('Datos'),
  bullet([b('Aviso de formato: '), t('el número de valores por línea no coincide con el número de variables configurado. Ajustá NÚMERO DE VARIABLES o el programa.')]),
  bullet([b('Datos con saltos o apilados en el tiempo: '), t('usá siempre '), code('input.runningTime()'), t(' en el programa y la casilla de timestamp activada (sección 3 explica por qué).')]),
  bullet([b('Datos con picos (spikes): '), t('activá el '), b('Filtro de picos'), t(' en la sección VARIABLES; si persiste, bajá la velocidad de envío.')]),
  body([t('Más ayuda: botón '), b('AYUDA'), t(' dentro de la plataforma, con tutoriales completos de conexión, código para 2 y 3 variables y solución de problemas.')], { spacing: { before: 200, after: 0 } }),

  h1('13 · GLOSARIO', 'glosario'),
  body('Los términos técnicos usados en esta guía, en orden alfabético.'),
  mkTable([2600, 6472],
    ['Término', 'Qué significa'],
    [
      ['Baudios', 'Unidad de velocidad de un puerto serial: símbolos por segundo. A 115200 baudios viajan ~11.500 caracteres por segundo. La plataforma lo configura sola.'],
      ['BLE (Bluetooth Low Energy)', 'Variante del Bluetooth diseñada para consumir poca energía: transmite en ventanas breves en lugar de mantener la radio siempre encendida. Es el Bluetooth de la micro:bit.'],
      ['CSV', 'Formato de texto plano para tablas: una fila por línea, columnas separadas por comas (comma-separated values). Lo abren Excel, LibreOffice, GeoGebra y Python sin conversión.'],
      ['Emparejamiento (pairing)', 'Procedimiento de “presentación” entre dos equipos Bluetooth, a veces con PIN. La opción JustWorks (“No Pairing Required”) lo omite: cualquiera puede conectarse, ideal para el aula.'],
      ['everyInterval', 'Bloque de MakeCode que ejecuta código cada N milisegundos exactos, sin el sobrecosto de forever. Es la vía para llegar a ~100 Hz.'],
      ['Extensión (MakeCode)', 'Paquete de bloques adicionales que se agrega a un proyecto (menú Extensiones). La extensión bluetooth agrega los bloques BLE y reemplaza a radio.'],
      ['forever', 'Bloque de MakeCode que repite su contenido indefinidamente. Cada vuelta agrega ~20 ms ocultos, lo que limita la frecuencia real de muestreo.'],
      ['.hex (archivo)', 'Imagen compilada del programa que se graba en la memoria de la micro:bit. Contiene el código y su sistema de ejecución; la placa lo corre sola al encender.'],
      ['Hz (hertz)', 'Mediciones por segundo. 10 Hz = un dato cada 100 ms. En esta guía siempre refiere a la frecuencia de muestreo del sensor.'],
      ['Intervalo de conexión', 'En BLE, el período acordado entre los dos equipos para intercambiar datos (típico: 30–50 ms). Define el “ritmo” al que llegan las ráfagas.'],
      ['Latencia', 'Tiempo entre que la micro:bit mide un dato y la plataforma lo recibe. En USB es baja y estable; en BLE es variable porque los datos esperan a la próxima ventana de radio.'],
      ['Lote (batch)', 'Grupo de datos que llega junto al navegador en una sola entrega. Sin timestamp de la micro:bit, todos los puntos de un lote quedarían con la misma hora.'],
      ['MakeCode', 'Editor de programación de la micro:bit (makecode.microbit.org). Funciona en el navegador, en bloques o JavaScript, y compila el programa a un archivo .hex.'],
      ['Notificación BLE', 'Paquete de hasta 20 bytes con el que el servicio UART envía datos por Bluetooth. Una línea larga puede repartirse en varias notificaciones.'],
      ['Puerto serial', 'Canal de comunicación que envía los bytes uno tras otro por un mismo hilo. La micro:bit lo ofrece a través del cable USB; el navegador lo lee con Web Serial.'],
      ['pxt.json', 'Archivo de configuración del proyecto MakeCode. Ahí queda guardada, entre otras cosas, la configuración Bluetooth (pairing_mode: 0 = sin emparejamiento).'],
      ['runningTime()', 'Función de MakeCode que devuelve los milisegundos transcurridos desde que la micro:bit encendió. Es el reloj con el que se arma el timestamp.'],
      ['Scheduler', 'Componente del sistema de MakeCode que reparte el tiempo del procesador entre las tareas del programa. Su sobrecosto es lo que limita la velocidad real de forever.'],
      ['Timestamp', 'Marca de tiempo: número que acompaña a cada dato indicando el instante en que se midió (acá, en ms desde el encendido de la micro:bit).'],
      ['UART', 'Protocolo clásico de puerto serie. “UART sobre BLE” es un servicio estándar que simula ese canal por radio; es lo que usa la plataforma para recibir datos por Bluetooth.'],
      ['Web Bluetooth / Web Serial', 'Capacidades del navegador (Chrome/Edge) que permiten a una página web hablar con dispositivos Bluetooth o seriales, previa autorización del usuario. Funcionan en Windows, Mac, Linux y Android; Apple solo las bloquea en iPhone/iPad (iOS/iPadOS).'],
      ['WebUSB', 'Capacidad del navegador que permite a MakeCode grabar el programa en la micro:bit directamente, sin copiar el archivo a mano.'],
    ]),
];

const doc = new Document({
  creator: 'fisicabit',
  title: 'micro:bit DataLab Pro — Manual de usuario 1',
  description: 'Captura de datos con timestamp (1 variable) y procesamiento básico',
  styles: {
    default: { document: { run: { font: FONT, size: 20, color: BLACK } } },
  },
  footnotes: {
    1: { children: [ftext([new TextRun({ text: 'Timestamp: ', font: FONT, size: 16, bold: true }), 'marca de tiempo. Número que acompaña a cada dato indicando el instante en que se midió; acá, los milisegundos desde que encendió la micro:bit.'])] },
    2: { children: [ftext([new TextRun({ text: 'Web Serial y Web Bluetooth: ', font: FONT, size: 16, bold: true }), 'capacidades del navegador (Chrome/Edge) que permiten a una página web comunicarse con un dispositivo por cable o por Bluetooth, siempre con autorización del usuario.'])] },
    3: { children: [ftext([new TextRun({ text: 'Lote: ', font: FONT, size: 16, bold: true }), 'grupo de datos que el sistema entrega junto, en una sola tanda, en lugar de uno por uno.'])] },
    4: { children: [ftext([new TextRun({ text: 'Baudios: ', font: FONT, size: 16, bold: true }), 'velocidad del puerto serial, en símbolos por segundo. No hay que configurarla: la plataforma lo hace sola.'])] },
    5: { children: [ftext([new TextRun({ text: 'Scheduler: ', font: FONT, size: 16, bold: true }), 'el componente de MakeCode que reparte el tiempo del procesador entre las tareas del programa; su sobrecosto fija el límite de velocidad real.'])] },
    6: { children: [ftext([new TextRun({ text: 'Hz (hertz): ', font: FONT, size: 16, bold: true }), 'mediciones por segundo. 10 Hz equivale a un dato cada 100 ms.'])] },
    7: { children: [ftext([new TextRun({ text: 'WebUSB: ', font: FONT, size: 16, bold: true }), 'permite que MakeCode grabe el programa directamente en la placa, sin copiar archivos a mano.'])] },
    8: { children: [ftext([new TextRun({ text: 'Archivo .hex: ', font: FONT, size: 16, bold: true }), 'la imagen compilada del programa, lista para grabarse en la memoria de la micro:bit.'])] },
    9: { children: [ftext([new TextRun({ text: 'UART: ', font: FONT, size: 16, bold: true }), 'protocolo clásico de puerto serie. El servicio “UART sobre BLE” simula ese canal por radio: para la plataforma es como un cable invisible.'])] },
    10: { children: [ftext([new TextRun({ text: 'Emparejamiento (pairing): ', font: FONT, size: 16, bold: true }), 'la “presentación” formal entre dos equipos Bluetooth, a veces con PIN. JustWorks la omite: cualquiera puede conectarse, lo ideal en el aula.'])] },
    11: { children: [ftext([new TextRun({ text: 'pxt.json: ', font: FONT, size: 16, bold: true }), 'archivo de configuración del proyecto MakeCode; se edita desde el explorador de archivos del editor.'])] },
    12: { children: [ftext([new TextRun({ text: 'CSV: ', font: FONT, size: 16, bold: true }), 'texto plano con una fila por línea y columnas separadas por comas; lo abren Excel, LibreOffice, GeoGebra y Python directamente.'])] },
  },
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: '—', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 480, hanging: 240 } }, run: { font: FONT } },
      }],
    }],
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertMillimetersToTwip(22), bottom: convertMillimetersToTwip(22),
          left: convertMillimetersToTwip(20), right: convertMillimetersToTwip(20),
        },
      },
    },
    children: [...cover, ...content],
  }],
});

Packer.toBuffer(doc).then(async (buf) => {
  // docx-js repite el id de los bookmarks; renumerarlos (start/end emparejados)
  const AdmZip = null;
  const { execSync } = require('child_process');
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'docxfix-'));
  const tmpDocx = path.join(tmp, 'doc.docx');
  fs.writeFileSync(tmpDocx, buf);
  execSync(`cd ${tmp} && unzip -q doc.docx word/document.xml`);
  const docXmlPath = path.join(tmp, 'word', 'document.xml');
  let xml = fs.readFileSync(docXmlPath, 'utf8');
  let n = 100;
  const stack = [];
  xml = xml.replace(/<w:bookmark(Start|End)([^>]*?)w:id="\d+"([^>]*?)\/?>(?!<)/g, (m) => m); // noop guard
  xml = xml.replace(/<w:bookmarkStart([^>]*?)w:id="\d+"/g, (m, pre) => { n += 1; stack.push(n); return `<w:bookmarkStart${pre}w:id="${n}"`; });
  xml = xml.replace(/<w:bookmarkEnd([^>]*?)w:id="\d+"/g, (m, pre) => { const id = stack.shift(); return `<w:bookmarkEnd${pre}w:id="${id}"`; });
  fs.writeFileSync(docXmlPath, xml);
  execSync(`cd ${tmp} && zip -q doc.docx word/document.xml`);
  const fixed = fs.readFileSync(tmpDocx);
  const out = path.join(__dirname, '..', 'Manual-1-Captura-1-variable-timestamp.docx');
  fs.writeFileSync(out, fixed);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('written', out, fixed.length);
});
