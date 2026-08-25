const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType,
  BorderStyle, ShadingType, convertMillimetersToTwip,
  Table, TableRow, TableCell, WidthType, VerticalAlign,
} = require('docx');

const SHOTS = path.join(__dirname, '..', 'img');
const img = (name) => fs.readFileSync(path.join(SHOTS, name));

const FONT = 'Montserrat';
const MONO = 'Courier New';
const BLACK = '000000';
const GRAY = '555555';
const LIGHT = 'F5F5F5';

const t = (text, o = {}) => new TextRun({ text, font: FONT, size: 20, ...o });
const b = (text) => t(text, { bold: true });
const code = (text) => new TextRun({ text, font: MONO, size: 18 });

const pic = (name, w, h) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 80, after: 200 },
  children: [new ImageRun({ type: 'png', data: img(name), transformation: { width: w, height: h } })],
});

// paso: número en cuadrado negro + instrucción en una tabla de 2 columnas
const step = (n, runs) => new Table({
  width: { size: 9072, type: WidthType.DXA },
  columnWidths: [700, 8372],
  borders: {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  },
  rows: [new TableRow({
    children: [
      new TableCell({
        width: { size: 700, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        shading: { type: ShadingType.CLEAR, fill: BLACK },
        margins: { top: 60, bottom: 60, left: 60, right: 60 },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [new TextRun({ text: String(n), font: FONT, bold: true, size: 34, color: 'FFFFFF' })],
        })],
      }),
      new TableCell({
        width: { size: 8372, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 60, bottom: 60, left: 200, right: 60 },
        children: [new Paragraph({
          spacing: { after: 0, line: 290 },
          children: runs.map(r => (r instanceof TextRun ? r : r)),
        })],
      }),
    ],
  })],
});

const gap = (h = 160) => new Paragraph({ spacing: { after: h }, children: [] });

const note = (runs) => new Paragraph({
  shading: { type: ShadingType.CLEAR, fill: LIGHT },
  border: { left: { style: BorderStyle.SINGLE, size: 36, color: BLACK, space: 10 } },
  spacing: { before: 60, after: 220, line: 280 },
  indent: { left: 120, right: 120 },
  children: runs,
});

const codeBlock = (lines) => lines.map((line, i) => new Paragraph({
  shading: { type: ShadingType.CLEAR, fill: LIGHT },
  border: { left: { style: BorderStyle.SINGLE, size: 24, color: BLACK, space: 8 } },
  spacing: { after: i === lines.length - 1 ? 200 : 0, line: 260 },
  indent: { left: 240 },
  children: [new TextRun({ text: line || ' ', font: MONO, size: 18 })],
}));

// ---------- documento ----------
const children = [
  // cabecera compacta
  new Paragraph({
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.CLEAR, fill: BLACK },
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: 'micro:bit DataLab Pro', font: FONT, bold: true, size: 40, color: 'FFFFFF' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.CLEAR, fill: BLACK },
    spacing: { after: 120 },
    children: [new TextRun({ text: 'GUÍA RÁPIDA · CAPTURAR DATOS EN 10 PASOS', font: FONT, size: 21, color: 'FFFFFF' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [t('Necesitás: una micro:bit, un cable USB y Chrome o Edge. ', { size: 18, color: GRAY }),
               t('Para más detalle, ver el Manual 1 (documentación completa).', { size: 18, color: GRAY, italics: true })],
  }),

  // PASO 1
  step(1, [b('Programá la micro:bit. '), t('En '), b('makecode.microbit.org'), t(' creá un proyecto nuevo y pegá este código:')]),
  gap(60),
  ...codeBlock([
    'basic.forever(function () {',
    '    serial.writeLine("" + input.runningTime() + "," + input.acceleration(Dimension.X))',
    '    basic.pause(100)',
    '})',
  ]),
  note([t('Cambiá '), code('input.acceleration(Dimension.X)'), t(' por el sensor que quieras: '), code('input.temperature()'), t(', '), code('input.lightLevel()'), t(', etc.')]),

  // PASO 2
  step(2, [b('Grabala. '), t('Conectá la micro:bit por USB y presioná '), b('Descargar'), t(' en MakeCode. Esperá que la luz naranja deje de parpadear. Después '), b('cerrá MakeCode'), t('.')]),
  gap(),

  // PASO 3
  step(3, [b('Abrí la plataforma. '), t('La barra de arriba tiene todos los botones que vas a usar:')]),
  pic('02_toolbar.png', 620, 47),

  // PASO 4
  step(4, [b('Conectá. '), t('Presioná '), b('CONECTAR'), t(', elegí '), b('“BBC micro:bit”'), t(' en la ventanita del navegador y aceptá. El estado cambia a '), b('CONECTADO'), t(':')]),
  pic('05_conectado.png', 620, 47),
  note([b('¿Sin cable? '), t('Presioná '), b('BLUETOOTH'), t(' en su lugar. Ojo: el programa de la micro:bit debe tener la extensión bluetooth y “No Pairing Required” (ver Manual 1, Camino B).')]),

  // PASO 5
  step(5, [b('Presioná CAPTURAR '), t('y hacé el experimento. Los puntos van apareciendo en la gráfica en vivo:')]),
  pic('06_capturando.png', 620, 388),

  // PASO 6
  step(6, [b('Presioná DETENER '), t('cuando termine el fenómeno. Los datos quedan guardados en la página.')]),
  gap(),

  // PASO 7
  step(7, [b('Mirá la tabla. '), t('En la vista '), b('CONFIG'), t(' → sección '), b('DATOS'), t(' está cada punto con su tiempo en segundos:')]),
  pic('08_tabla_datos.png', 620, 254),

  // PASO 8
  step(8, [b('Poné el cero donde empieza el fenómeno. '), t('Clic en la fila del punto elegido (queda roja) y presioná '), b('ESTABLECER T=0'), t(' (en CONFIGURACIÓN DE GRÁFICAS). Todo se recalcula solo:')]),
  pic('09_fila_seleccionada.png', 620, 254),

  // PASO 9
  step(9, [b('Borrá lo que sobra (opcional). '), t('En '), b('DEPURACIÓN DE DATOS'), t(': indicá un rango de puntos y '), b('ELIMINAR RANGO'), t(', o marcá puntos y '), b('ELIMINAR SELECCIONADOS'), t('.')]),
  gap(),

  // PASO 10
  step(10, [b('Guardá tus datos. '), t('Presioná '), b('EXPORTAR CSV'), t('. El archivo se abre en Excel, GeoGebra o Python, y se puede volver a cargar con INGRESO DE DATOS.')]),
  gap(240),

  // problemas típicos ultra cortos
  new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: BLACK, space: 4 } },
    children: [b('SI ALGO NO ANDA')],
  }),
  note([b('No aparece el puerto → '), t('el cable debe ser de datos; cerrá MakeCode y reintentá.')]),
  note([b('Conecta pero no hay datos → '), t('presioná CAPTURAR; verificá que el código sea el del paso 1.')]),
  note([b('Bluetooth no conecta → '), t('falta “No Pairing Required” en MakeCode (Manual 1, sección 5.1).')]),
  note([b('iPhone/iPad → '), t('no soportado por Apple. Usá computadora (Mac incluida) o Android.')]),

  new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 8, color: BLACK, space: 8 } },
    spacing: { before: 300 },
    children: [t('fisicabit.com · Guía rápida — el detalle completo está en el Manual 1', { size: 17, color: GRAY })],
  }),
];

const doc = new Document({
  creator: 'fisicabit',
  title: 'micro:bit DataLab Pro — Guía rápida',
  description: 'Capturar datos en 10 pasos',
  styles: { default: { document: { run: { font: FONT, size: 20, color: BLACK } } } },
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertMillimetersToTwip(16), bottom: convertMillimetersToTwip(16),
          left: convertMillimetersToTwip(18), right: convertMillimetersToTwip(18),
        },
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const out = path.join(__dirname, '..', 'Guia-rapida-Captura-de-datos.docx');
  fs.writeFileSync(out, buf);
  console.log('written', out, buf.length);
});
