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
   enfriamiento de un líquido, péndulo con soporte de cartón, calentamiento de
   agua y densidad de un sólido.
3. **Armarla a mano**, con una ayuda de 5 pasos: nombre → piezas → ubicar →
   pasos → ficha.

La pantalla arranca en **modo simple**: mover, rotar, agregar piezas, pasos y
ficha. «Más opciones» muestra lo avanzado (salto, vista explotada a mano,
rellenos, rotación numérica, estilo de la ficha, guardar y abrir archivos).

**Agregar pieza** ofrece:

- **Elementos de laboratorio** (se dibujan al instante): soporte universal,
  varilla, nuez, pinza, aro, mesa, bloque, riel, plano inclinado; resorte,
  masas, pesas, portapesas, poleas, carrito, autito, esfera, lenteja, cilindro,
  hilo, regla, dinamómetro, imán; micro:bit, portapilas, sensor de ultrasonido,
  módulo sensor, barrera óptica, protoboard, servo, motor, láser, celular;
  tornillo, tuerca y arandela.
- **Material de vidrio**, con el **volumen elegible de una lista**: vaso de
  bohemia (50 mL a 2 L), probeta graduada (10 mL a 1 L), matraz Erlenmeyer,
  matraz aforado y matraz balón (hasta 1 L); además tubo de ensayo, embudo,
  calorímetro y jeringa.
- **Balanza y calor**: balanza digital, placa calefactora, trípode, rejilla,
  mechero Bunsen y termómetro o sonda.
- **Soportes ya armados**, para poner de una vez lo que más se usa: soporte con
  nuez y varilla, con nuez y pinza, con aro y rejilla, con aro, rejilla y pinza,
  y trípode con rejilla y mechero. Entran con cada pieza por separado (se
  pueden mover, quitar o repartir en pasos) y la lista de piezas las cuenta una
  por una.
- Diseños de **encastre en cartón** (entran armados, con cada pieza suelta y
  con su nombre) y de **impresión 3D** del catálogo.
- Archivos propios `.stl` / `.scad`.

Si en un paso nadie indicó desde dónde entran las piezas, la ficha las dibuja
entrando desde arriba.

Estos elementos son solo para dibujar el armado de la práctica: no aparecen en
el catálogo de piezas para imprimir en 3D.

### De dónde salen los modelos

Todos los elementos de laboratorio son **modelos propios del sitio**: los
genera el código de `elementos.js` a partir de medidas habituales de catálogo
(aproximadas; por ejemplo, un vaso de bohemia de 250 mL mide unos 70 × 95 mm).
No se usan archivos de terceros, así que no hay licencias ajenas que respetar
ni atribuciones que poner. Si alguna vez se quiere un modelo descargado (un
`.stl` con licencia libre), se puede abrir desde «Tus archivos», anotando su
autor y su licencia en este README.

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
- `elementos.js` — elementos de laboratorio (geometría generada en el momento,
  sin OpenSCAD): piezas sueltas, material de vidrio por volumen y soportes ya
  armados (`conjunto`).
- `recetas.js` — formato de receta, guías listas, prompt para la IA y lectura
  de su respuesta.
