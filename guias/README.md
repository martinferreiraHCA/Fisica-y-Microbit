# Guías de armado (herramienta oculta)

Diseñador de **fichas de ensamblaje** con la estética de fisicabit: toma
piezas del catálogo del sitio y arma una guía A4 con el dispositivo armado,
la lista de piezas y un cuadro por paso, en dibujo de línea.

No tiene enlaces desde el sitio. Se entra por `fisicabit.com/guias/` o por
`fisicabit.com/#guias`.

## Cómo se usa

1. **Editor 3D** → *Agregar pieza*: diseños de **encastre en cartón** (entran
   armados, con cada pieza suelta y con su nombre), de **impresión 3D** (se
   elige la pieza y sus medidas), **ferretería** (varilla, tornillo, tuerca,
   arandela, bloque, micro:bit) o un archivo propio `.stl` / `.scad`.
2. Ubicar cada pieza donde va en el conjunto: gizmo de **mover / rotar**
   (con salto de 1, 5 o 10 mm y 15°, 45° o 90°) o los campos de posición y
   rotación; *apoyar en el piso*, *centrar*, *duplicar*.
3. **Pasos de armado**: cada pieza entra en un paso (A, B, C…). Con
   **Entrada** se aleja la pieza hacia donde está antes de colocarla: la
   ficha la dibuja ahí, resaltada, con una flecha hasta su lugar.
   *Entrada automática* las levanta solas; *Usar esta vista* fija desde
   dónde se dibuja el paso; *Vista previa del paso* lo muestra al momento.
4. **Ficha**: nombre, versión, autor, descripción, color de acento, grosor
   de línea. Sale una **portada** (conjunto armado con llamadas A, B, C… y
   el texto de cada paso) y el **manual de ensamblado** (lista de piezas y
   un cuadro por paso). *Imprimir / PDF* la guarda o la imprime en A4.

La guía se guarda sola en el navegador y se puede **descargar / abrir**
como archivo `.guia.json`.

## Archivos

- `index.html` — página, estilos del editor y de las hojas A4.
- `app.js` — editor 3D (three.js + `OrbitControls` + `TransformControls`),
  pasos, catálogo, guardado.
- `motor.js` — OpenSCAD en un worker (el mismo `lib/openscad.js` del
  sitio), lectura de STL, separación de las piezas de un armado de cartón
  (`$fb_separar` en `lib/fisicabit-carton.scad`) y sus nombres.
- `arte.js` — dibujo de línea: color plano o trama de puntos, y contornos
  por cambio de pieza, arista o salto de profundidad, con cámara
  isométrica ajustada.
- `ficha.js` — arma las hojas: portada, lista de piezas, pasos y llamadas.
