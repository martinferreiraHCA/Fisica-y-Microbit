# Diseños de encastre en cartón

Carpeta de diseños del modo **Encastre en cartón** del apartado *Diseño 3D*
del sitio (`#carton`). La idea: elementos de laboratorio de bajo costo hechos
con piezas **planas** que se **imprimen en hojas A4**, se **pegan sobre
cartón**, se **cortan con cúter** y se **unen por encastre**, sin pegamento.

Todo archivo **`.scad`** que subas acá aparece automáticamente en el menú de
piezas del modo cartón, con su miniatura (vista armada en 3D).

## Qué hace el sitio con cada diseño

- Renderiza el **plano de corte** (2D), las **marcas de tinta** (reglas,
  transportadores, textos) y el **armado en 3D** con OpenSCAD en el navegador.
- Reparte las piezas en **hojas A4** con una **barra de calibración de
  100 mm** en cada hoja. Las piezas más grandes que una hoja salen en varias,
  con franjas de superposición.
- **Imprime / guarda en PDF** al 100 % y **descarga un SVG** en milímetros
  (sirve también para una cortadora láser).
- Las variables del inicio se convierten en deslizadores, como en las piezas
  3D: `espesor` (grosor del cartón) y `holgura` (ancho extra de las ranuras)
  están en todos los diseños.

## Diseños incluidos

| Archivo | Piezas | Para qué |
|---|---|---|
| `peine-de-ajuste.scad` | 1 | **Imprimilo primero**: ranuras de distinto ancho para elegir la `holgura` que encastra justo con tu cartón. |
| `plantilla-carton.scad` | 2 | Punto de partida: dos piezas cruzadas con regla y rótulos. |
| `pie-para-varilla.scad` | 6 (2 distintas) | Pie para sostener una varilla vertical (soportes de laboratorio). |
| `plano-inclinado.scad` | 4 (3 distintas) | Rampa con ángulo ajustable, regla de recorrido y ángulo impreso. |
| `soporte-de-pendulo.scad` | 5 (4 distintas) | Soporte con escala de amplitud (0° abajo) y regla del largo del hilo. |
| `atril-para-microbit.scad` | 3 (2 distintas) | Atril inclinado para la micro:bit (pantalla, brújula, acelerómetro). |
| `regla-y-transportador.scad` | 2 | Regla de 20 cm y transportador de 180°, para pegar sobre cartón. |

## Cómo se escribe un diseño

La biblioteca [`lib/fisicabit-carton.scad`](../lib/fisicabit-carton.scad) la
agrega el sitio sola; en OpenSCAD de escritorio escribí al inicio
`include <fisicabit-carton.scad>` (con la carpeta `lib` en la ruta).

```openscad
/* [Cartón] */
espesor = 3;  // [1:0.5:8]
holgura = 0;  // [-0.6:0.1:0.8]

// Una pieza = un módulo 2D. Las MARCAS (regla, texto…) van dentro del
// difference(), como si fueran agujeros: se imprimen pero no se cortan.
module a() difference() { rect(100, 50, 2); translate([50, 0]) ranura(25); translate([5, 0]) regla(90); }
module b() difference() { rect(100, 50, 2); translate([50, 50]) rotate(180) ranura(25); }

module plano()  { a(); translate([0, 58]) b(); }                    // piezas a cortar (separadas)
module armado() { translate([-50, 0, 0]) laja_xz() a(); translate([0, -50, 0]) laja_yz() b(); }
```

Módulos disponibles: `ranura(prof)`, `ranura_interior(largo)`,
`pestana(largo, ancho)`, `agujero(d)`, `rect(ancho, alto, r)`,
`laja()` / `laja_xz()` / `laja_yz()`, y de tinta: `regla()`,
`transportador()`, `texto()`, `arco()`, `linea()`, `flecha()`,
`cuadricula()`, `doblez()`, `marca(){…}`. Los textos usan una tipografía de
trazos propia (el motor del navegador no tiene fuentes).

El **asistente con IA** del sitio genera un prompt con estas mismas
convenciones para que una IA (Claude, ChatGPT, Gemini…) diseñe el elemento en
pocas piezas encastrables.

## Convertir una pieza 3D en cartón

En el modo *Impresión 3D*, **Convertir a cartón encastrable…** corta
cualquier pieza (también un STL) en láminas verticales cruzadas que se
encastran a media altura (tipo rejilla). Las ranuras se calculan sobre la
malla (una vertical por cada cruce) y el resultado es un diseño de cartón
editable: escala, espesor y holgura.

## Importar un SVG de otro programa libre

**Abrir archivo .svg** convierte el SVG en un diseño de cartón y lo reparte en
hojas A4 con calibración. Sirve para usar generadores libres como
[boxes.py](https://www.festi.info/boxes.py/) (cajas y gradillas con dientes,
GPL-3.0) o [Joinery](https://clementzheng.github.io/joinery/) (uniones entre
piezas, MIT).

## Consejos de taller

- Cartón corrugado común: 3 mm (simple) o 5–7 mm (doble). Medilo y ponelo en
  `espesor`.
- Cortado a mano, una ranura del ancho exacto del cartón suele quedar justa;
  el **peine de ajuste** te dice si conviene `holgura` positiva o negativa.
- Imprimí siempre al **100 %** y verificá la barra de 100 mm con una regla.
- Entre una ranura y el borde dejá al menos dos veces el espesor de material.

## Proyectos libres consultados

- [Lamina](https://github.com/marcelfarres/lamina) (AGPL-3.0): referencia de
  las reglas de láminas encastradas (ranuras a media altura, holgura, boca
  ensanchada, barra de calibración por hoja).
- [boxes.py](https://github.com/florianfesti/boxes) (GPL-3.0),
  [bmsleight/lasercut](https://github.com/bmsleight/lasercut) (BSD-2-Clause),
  [lasercut-box-openscad](https://github.com/larsch/lasercut-box-openscad) (MIT):
  convenciones de uniones por pestañas y ranuras en OpenSCAD.
- [Joinery](https://github.com/clementzheng/joinery) (MIT) y
  [VectorRuler](https://github.com/Robbbb/VectorRuler) (MIT): uniones entre
  piezas y reglas vectoriales imprimibles.
- [OpenSCAD](https://openscad.org/) (GPL-2.0) vía
  [openscad-wasm](https://www.npmjs.com/package/openscad-wasm): hace todo el
  trabajo geométrico (secciones `projection(cut = true)`, booleanos 2D y
  exportación a SVG) dentro del navegador.
