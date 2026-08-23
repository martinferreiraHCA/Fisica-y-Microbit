const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType,
  BorderStyle, ShadingType, LevelFormat, PageBreak, convertMillimetersToTwip
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

const pic = (name, w, h, opts = {}) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 120, after: 40 },
  children: [new ImageRun({
    type: 'png', data: img(name),
    transformation: { width: w, height: h },
    outline: { type: 'solidFill', solidFillType: 'rgb', value: '000000', width: 1 },
  })],
  ...opts,
});

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 420, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: BLACK, space: 4 } },
  children: [new TextRun({ text, font: FONT, bold: true, size: 26, color: BLACK })],
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
  border: {
    left: { style: BorderStyle.SINGLE, size: 24, color: BLACK, space: 8 },
  },
  spacing: { after: i === lines.length - 1 ? 200 : 0, line: 260 },
  indent: { left: 240 },
  children: [new TextRun({ text: line || ' ', font: MONO, size: 18 })],
}));

const infoBox = (runs) => new Paragraph({
  shading: { type: ShadingType.CLEAR, fill: LIGHT },
  border: {
    left: { style: BorderStyle.SINGLE, size: 36, color: BLACK, space: 10 },
  },
  spacing: { before: 160, after: 220, line: 290 },
  indent: { left: 120, right: 120 },
  children: runs,
});

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
    spacing: { after: 2000 },
    children: [new TextRun({ text: 'y procesamiento básico de los datos', font: FONT, size: 30 })],
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
  body('Esta guía recorre, paso a paso, el uso básico de la plataforma micro:bit DataLab Pro con el flujo más común: capturar datos de una sola variable enviados por la micro:bit junto con su timestamp (marca de tiempo), y luego aplicar un procesamiento básico a esos datos.'),
  bullet('Programar la micro:bit para enviar una variable con timestamp.'),
  bullet('Configurar la plataforma (número de variables y casilla de timestamp).'),
  bullet('Conectar por USB o Bluetooth y capturar datos en vivo.'),
  bullet('Ver los datos en la gráfica y en la tabla.'),
  bullet([t('Poner en cero el tiempo con '), b('ESTABLECER T=0'), t('.')]),
  bullet('Depurar datos (eliminar puntos incorrectos) y exportar a CSV.'),
  infoBox([
    b('Requisitos: '),
    t('una micro:bit (V1 o V2), cable USB o Bluetooth, y el navegador '),
    b('Chrome'), t(' o '), b('Edge'),
    t(' en computadora o Android. La conexión Bluetooth no funciona en iOS/Safari.'),
  ]),

  h1('2 · LA PANTALLA PRINCIPAL'),
  body([t('Al abrir el sitio se ve la '), b('barra de herramientas'), t(' (arriba), la '), b('gráfica'), t(' (centro) y el '), b('panel lateral'), t(' con las secciones de configuración (derecha). El estado de la conexión aparece en el extremo superior derecho: '), b('DESCONECTADO'), t('.')]),
  pic('01_pantalla_principal.png', 620, 388),
  cap('Pantalla principal: barra de herramientas, gráfica y panel lateral.'),
  pic('02_toolbar.png', 620, 47),
  cap('Barra de herramientas: CONECTAR (USB), BLUETOOTH, CÁMARA, INFORME, EXPORTAR CSV, LIMPIAR, AYUDA.'),

  h1('3 · PROGRAMAR LA MICRO:BIT'),
  body([t('En '), b('makecode.microbit.org'), t(' creá un proyecto nuevo. El programa debe enviar cada lectura como una línea de texto con el formato '), code('tiempo,valor'), t(': el primer número es el timestamp en milisegundos ('), code('input.runningTime()'), t(') y el segundo es la variable medida.')]),
  h2('3.1 · Conexión por USB (serial)'),
  ...codeBlock([
    'basic.forever(function () {',
    '    let t = input.runningTime()',
    '    let valor = input.acceleration(Dimension.X)',
    '    serial.writeLine("" + t + "," + valor)',
    '    basic.pause(100)',
    '})',
  ]),
  body([t('Este ejemplo envía la aceleración en X unas 8 veces por segundo. Podés reemplazar '), code('input.acceleration(Dimension.X)'), t(' por cualquier otro sensor, por ejemplo '), code('input.temperature()'), t(' o '), code('pins.analogReadPin(AnalogPin.P0)'), t('.')]),
  h2('3.2 · Conexión por Bluetooth'),
  body([t('Agregá la extensión '), b('bluetooth'), t(' (menú Extensiones) y verificá que en la configuración del proyecto esté habilitado '), b('“No Pairing Required”'), t('. El código es el mismo, pero usando el servicio UART:')]),
  ...codeBlock([
    'let t = 0',
    'let valor = 0',
    'bluetooth.startUartService()',
    '',
    'basic.forever(function () {',
    '    t = input.runningTime()',
    '    valor = input.acceleration(Dimension.X)',
    '    bluetooth.uartWriteLine("" + t + "," + valor)',
    '    basic.pause(100)',
    '})',
  ]),
  infoBox([
    b('Importante: '),
    t('al agregar la extensión Bluetooth se desactiva el serial USB. Para volver a usar USB hay que quitar la extensión Bluetooth.'),
  ]),

  h1('4 · CONFIGURAR LA PLATAFORMA'),
  body([t('Antes de conectar, abrí la vista '), b('CONFIG'), t(' (o el panel lateral) y en la sección '), b('VARIABLES'), t(' verificá dos cosas:')]),
  step(1, [t('La casilla '), b('MICRO:BIT ENVÍA TIMESTAMP'), t(' debe estar '), b('activada'), t(' (es el valor por defecto), porque nuestro programa envía '), code('tiempo,valor'), t('.')]),
  step(2, [b('NÚMERO DE VARIABLES'), t(' en '), b('1 Variable'), t('. Podés cambiar el nombre y el color de la variable. Presioná '), b('APLICAR CONFIGURACIÓN'), t('.')]),
  pic('03_config_variables.png', 240, 635),
  cap('Sección VARIABLES: casilla de timestamp activada y 1 variable configurada.'),
  infoBox([
    b('Regla de oro: '),
    t('el número de valores que envía la micro:bit debe coincidir con el número de variables configurado. Si el programa envía '),
    code('tiempo,valor'), t(' la casilla de timestamp debe estar activada; si envía solo '), code('valor'), t(', desactivada.'),
  ]),

  h1('5 · CONECTAR Y CAPTURAR'),
  h2('5.1 · Conectar'),
  step(1, [t('Conectá la micro:bit por cable y presioná '), b('CONECTAR'), t(' (USB), o presioná '), b('BLUETOOTH'), t(' para la conexión inalámbrica.')]),
  step(2, [t('En la ventana del navegador elegí el dispositivo '), b('“BBC micro:bit”'), t(' y aceptá.')]),
  pic('04_bluetooth_modal.png', 620, 388),
  cap('Guía de conexión Bluetooth: pasos previos y botón CONECTAR.'),
  step(3, [t('El estado cambia a '), b('CONECTADO — Presiona CAPTURAR'), t(' y aparece el botón '), b('CAPTURAR'), t('.')]),
  pic('05_conectado.png', 620, 47),
  cap('micro:bit conectada: el botón CAPTURAR reemplaza a CONECTAR.'),
  h2('5.2 · Capturar datos'),
  step(4, [t('Presioná '), b('CAPTURAR'), t('. El estado pasa a '), b('CAPTURANDO'), t(' y los puntos aparecen en la gráfica en tiempo real. El indicador verde muestra la frecuencia de muestreo y la cantidad de puntos.')]),
  pic('06_capturando.png', 620, 388),
  cap('Captura en vivo: los datos llegan de la micro:bit y se grafican al instante.'),
  step(5, [t('Cuando termine el experimento presioná '), b('DETENER'), t('. Los datos quedan en memoria para analizarlos.')]),
  pic('07_captura_finalizada.png', 620, 388),
  cap('Captura finalizada: 30 segundos de una oscilación amortiguada (1 variable).'),

  h1('6 · VER LOS DATOS EN LA TABLA'),
  body([t('En la vista '), b('CONFIG'), t(', la sección '), b('DATOS'), t(' muestra la tabla completa: número de punto ('), b('#'), t('), tiempo en segundos ('), b('TIEMPO (S)'), t(') y el valor de la variable. Con el buscador podés filtrar por valor o tiempo, y con la ✕ eliminar una fila puntual.')]),
  pic('08_tabla_datos.png', 620, 254),
  cap('Tabla de datos: tiempo (s) y Variable 1, punto por punto.'),

  h1('7 · PROCESAMIENTO BÁSICO: PONER EL TIEMPO EN CERO'),
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

  h1('8 · DEPURAR DATOS'),
  body([t('La sección '), b('DEPURACIÓN DE DATOS'), t(' permite limpiar puntos incorrectos (por ejemplo, los segundos previos al inicio real del fenómeno o un pico espurio):')]),
  bullet([b('ELIMINAR RANGO'), t(': ingresá el número de punto inicial y final (por ejemplo, del 1 al 10) y presioná el botón.')]),
  bullet([b('ELIMINAR SELECCIONADOS'), t(': borrá los puntos que hayas marcado con clic en la gráfica o en la tabla.')]),
  pic('12_depuracion.png', 620, 363),
  cap('Depuración: eliminar un rango de puntos (del 1 al 10) o los seleccionados.'),

  h1('9 · EXPORTAR LOS DATOS (CSV)'),
  body([t('Presioná '), b('EXPORTAR CSV'), t(' en la barra de herramientas. Se descarga un archivo '), code('microbit_data_FECHA.csv'), t(' con una columna de tiempo (en la unidad elegida y con el T=0 aplicado) y una columna por variable:')]),
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

  h1('10 · PROBLEMAS FRECUENTES'),
  bullet([b('No aparece el dispositivo al conectar: '), t('verificá que el programa esté grabado en la micro:bit y, en Bluetooth, que la extensión bluetooth esté agregada con “No Pairing Required”.')]),
  bullet([b('Se conecta pero no llegan datos: '), t('presioná CAPTURAR después de conectar y verificá que la casilla “Micro:bit envía timestamp” coincida con el formato del programa.')]),
  bullet([b('Aviso de formato: '), t('el número de valores por línea no coincide con el número de variables configurado. Ajustá NÚMERO DE VARIABLES o el programa.')]),
  bullet([b('Datos con saltos de tiempo: '), t('usá siempre '), code('input.runningTime()'), t(' en el programa; el reloj del navegador tiene resolución limitada (~16 ms).')]),
  body([t('Más ayuda: botón '), b('AYUDA'), t(' dentro de la plataforma, con tutoriales completos de conexión, código para 2 y 3 variables y solución de problemas.')], { spacing: { before: 200, after: 0 } }),
];

const doc = new Document({
  creator: 'fisicabit',
  title: 'micro:bit DataLab Pro — Manual de usuario 1',
  description: 'Captura de datos con timestamp (1 variable) y procesamiento básico',
  styles: {
    default: {
      document: { run: { font: FONT, size: 20, color: BLACK } },
    },
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

Packer.toBuffer(doc).then(buf => {
  const out = path.join(__dirname, '..', 'Manual-1-Captura-1-variable-timestamp.docx');
  fs.writeFileSync(out, buf);
  console.log('written', out, buf.length);
});
