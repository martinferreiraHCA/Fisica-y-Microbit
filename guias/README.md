# Guías de armado

Diseñador de **fichas de ensamblaje** con la estética de fisicabit: toma
piezas del catálogo del sitio y arma una guía A4 con el dispositivo armado,
la lista de piezas y un cuadro por paso, en dibujo de línea.

Se entra desde **EXTRAS → Guías de armado**, por `fisicabit.com/guias/` o por
`fisicabit.com/#guias`.

También se abre **dentro del protocolo de práctico** (INFORME ▾ → Protocolo de
práctico → botón *Montaje*): ahí aparecen dos botones más, *Insertar dibujo*
(el dispositivo armado como figura) e *Insertar anexo de armado* (dispositivo
con llamadas, tira de piezas y un dibujo por paso, como parte del protocolo).

## Cómo se usa

Se entra desde **EXTRAS → Guías de armado** (o `fisicabit.com/guias/`). Al abrir
aparecen tres formas de empezar:

1. **Contale a la IA qué querés armar.** Se escribe el montaje con palabras
   propias; el sitio arma un prompt largo (formato, coordenadas, los elementos
   de laboratorio y el catálogo de cartón y 3D leído en el momento); se pega en
   la IA que se use y su respuesta (una «receta» en JSON) se pega de vuelta: la
   guía queda armada, con piezas y pasos.
2. **Empezar con una guía lista**: ley de Hooke, péndulo simple, carrito en
   plano inclinado, segunda ley de Newton, caída libre, máquina de Atwood,
   enfriamiento de un líquido y péndulo con soporte de cartón.
3. **Armarla a mano**, con una ayuda de 5 pasos: nombre → piezas → ubicar →
   pasos → ficha.

La pantalla arranca en **modo simple**: mover, rotar, agregar piezas, pasos y
ficha. «Más opciones» muestra lo avanzado (salto, vista explotada a mano,
rellenos, rotación numérica, estilo de la ficha, guardar y abrir archivos).

**Agregar pieza** ofrece:

- **Elementos de laboratorio** (se dibujan al instante): soporte universal,
  varilla, nuez, pinza, mesa, bloque, riel, plano inclinado; resorte, masas,
  pesas, portapesas, poleas, carrito, autito, esfera, lenteja, cilindro, hilo,
  regla, dinamómetro, imán; micro:bit, portapilas, sensor de ultrasonido,
  módulo sensor, barrera óptica, protoboard, servo, motor, láser, celular;
  vaso, termómetro, jeringa; tornillo, tuerca y arandela.
- Diseños de **encastre en cartón** (entran armados, con cada pieza suelta y
  con su nombre) y de **impresión 3D** del catálogo.
- Archivos propios `.stl` / `.scad`.

Si en un paso nadie indicó desde dónde entran las piezas, la ficha las dibuja
entrando desde arriba.

## Estética

La misma de los manuales de uso (`manuales/`) y del sitio: **blanco, negro
y grises**, Montserrat, sin colores de acento. Banda negra con el nombre,
títulos de sección en mayúsculas con filete grueso, pasos con cuadrado
negro y letra blanca, recuadros con borde negro y etiqueta, notas en gris
`#f5f5f5` con barra negra a la izquierda, pie con filete fino.

## Archivos

- `index.html` — página, estilos del editor y de las hojas A4.
- `app.js` — editor 3D (three.js + `OrbitControls` + `TransformControls`),
  pasos, catálogo, guardado.
- `motor.js` — OpenSCAD en un worker (el mismo `lib/openscad.js` del
  sitio), lectura de STL, separación de las piezas de un armado de cartón
  (`$fb_separar` en `lib/fisicabit-carton.scad`) y sus nombres.
- `arte.js` — dibujo de línea: gris plano o trama de puntos, y contornos
  por cambio de pieza, arista o salto de profundidad, con cámara
  isométrica ajustada.
- `ficha.js` — arma las hojas: portada, lista de piezas, pasos y llamadas.
- `elementos.js` — elementos básicos de laboratorio (geometría generada en el
  momento, sin OpenSCAD).
- `recetas.js` — formato de receta, guías listas, prompt para la IA y lectura
  de su respuesta.
