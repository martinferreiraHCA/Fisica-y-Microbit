# Circuitos (herramienta oculta)

Editor de circuitos sencillo, con la estética de fisicabit: dibujo vectorial
en blanco y negro. El único color son las **bandas de las resistencias**, los
**cables** y el borne + / − de las fuentes sueltas.

No tiene enlaces desde el sitio. Se entra por `fisicabit.com/circuitos/`, o
desde el protocolo de práctico, que la abre embebida (`?embed=1`).

## Dos editores en la misma herramienta

- **1 · Esquemático** — cuadrícula de 20 px; los puntos de unión se dibujan
  solos.
- **2 · Protoboard** — placa de 30 o 60 columnas con rieles de alimentación.

Cada pestaña tiene su propio dibujo.

## Catálogo con buscador

Los componentes salen de la base `componentes.js` (unos 130, en 9
categorías). El panel izquierdo tiene el **buscador** (tecla `/` o Ctrl+K;
busca por nombre, alias, categoría y descripción, sin distinguir mayúsculas
ni tildes; Esc lo limpia), el filtro *Solo los que están en Tinkercad* y las
categorías plegables con sus miniaturas, dibujadas con la misma función que el
lienzo. Un resultado que solo existe en la otra pestaña aparece atenuado y, al
elegirlo, cambia de pestaña.

Al pasar por un componente (o al elegirlo en el dibujo) el panel derecho
muestra su **ficha**: descripción, uso en física, datos, patas con su función,
**Hoja de datos ↗** y *En la micro:bit*: a qué pin conviene llevar cada pata y
qué problemas trae, según la versión (V1 / V2).

## Cómo se usa

- Los componentes de dos patas se colocan **arrastrando de un punto a otro**
  (o clic y clic): el símbolo queda en el medio y se orienta solo. Los
  bloques, los símbolos de tres patas, los integrados, los módulos y los
  elementos sueltos van con **un clic**. El **Cable** está siempre en la barra
  (tecla C).
- **Seleccionar**: clic elige; arrastrar mueve (los cables enganchados
  acompañan); arrastrar el fondo o Mayús+clic elige varios; las manijas mueven
  un extremo; **R** gira; flechas; Supr; Ctrl+D duplica; Ctrl+A elige todo;
  Ctrl+Z / Ctrl+Y; Esc cancela y suelta. Rueda: zoom; botón derecho o barra
  espaciadora: desplazar.
- **Resistencias**: doble clic (o clic sobre la que ya está elegida) abre el
  código de colores. Se escribe el valor (`220`, `4.7k`, `4k7`, `1M`) o se
  eligen las bandas; quedan sincronizados.
- **Ejemplos**: cuatro circuitos listos (LED en P0, LDR en divisor a P1,
  ultrasonido con extensor, servo con pilas aparte).
- **SVG** y **PNG** descargan la pestaña activa recortada, sin grilla ni
  avisos; **Guardar / Abrir** usan un archivo `.circuito.json`. El circuito se
  guarda solo en el navegador (`localStorage`, `fisicabit_circuito_v1`).

## micro:bit: versión, extensor y pines

En el inspector de la placa se elige la **versión** (V1 / V2) y la
**conexión**: simple (los 5 anillos) o con **extensor** (un borne por pin; ■
comparte la pantalla, ○ comparte un botón, ◆ bus I2C). Al tocar un pin (en el
dibujo o en la lista del inspector) aparece su ficha: para qué sirve, para qué
no y qué tener en cuenta en esa versión.

## Avisos de compatibilidad

Con una micro:bit en el dibujo, el editor calcula las **redes** (qué patas
quedan unidas: cada media columna y cada riel de la protoboard son un nodo;
los cables y los puntos coincidentes unen) y `microbit.js` las revisa. El
botón **Avisos** de la barra muestra cuántos hay (en negro si hay errores) y
abre la lista: ✕ error, ▲ aviso, ● información. Al pasar por un aviso se
marcan en el lienzo los elementos y el pin; con un clic quedan elegidos.

## Las dos vistas están vinculadas

- **Generar protoboard →** / **← Generar esquemático** (en la barra, junto a
  las pestañas) arma la otra pestaña a partir de la lista de conexiones de la
  actual: mismos componentes, rótulos, valores, versión y conexión de la
  micro:bit, y **las mismas redes**. Si la otra vista ya tenía algo, pide
  confirmación; es un solo paso de deshacer. Lo que no existe en la vista
  destino (tierra, texto, interruptor en la protoboard) se omite y se avisa
  en la barra de estado. En el esquemático, los símbolos de tierra son la red
  del GND de la placa.
- **Esquemático → protoboard**: las piezas van de izquierda a derecha, junto
  al canal (dos en serie comparten columna; las que se unen a las patas de
  arriba de un integrado van en la mitad de arriba); fuentes a la izquierda,
  micro:bit y demás elementos sueltos abajo; el positivo y la masa van por los
  rieles (rojo y negro) y cada señal con puentes de un color. Si no entra en
  30 columnas, pasa a la placa de 60.
- **Protoboard → esquemático**: trazado por pistas. La micro:bit arriba a la
  izquierda, una pista horizontal por red (el positivo primero, en rojo), la
  fila de componentes debajo y la masa al fondo; cada pata llega a su pista
  por un tramo vertical propio. Dos piezas de dos patas en serie se unen
  directo, sin pista.
- **Indicador**: junto al botón dice **Vistas iguales ✓** o **Vistas
  distintas** (al tocarlo, qué difiere: «R1 está en el esquemático y no en la
  protoboard», «P0 está unido a LED1 (A) solo en el esquemático»). Empareja
  los elementos por componente y rótulo (y si no alcanza, por orden) y compara
  las redes de las dos vistas. No aparece si una de las dos está vacía.

## Formas de dibujo

Cada entrada de la base dice cómo se dibuja en cada vista (`esq.f`,
`proto.f`; el esquema completo está en el encabezado de `componentes.js`):

- Esquemático: símbolos propios de dos patas (resistencia, pila, LED,
  inductor, zener, fusible…), de tres patas (`npn`, `pnp`, `nmos`, `pmos`,
  `pot3`, `conmutador`, `opamp`, `regulador`) y `bloque` (caja con los pines
  rotulados a los lados; es también el dibujo de reserva).
- Protoboard: piezas propias, `axial`, `radial`, `to92`, `to220`, `dip`,
  `modulo` y `libre` (caja suelta con un borne por pin, que es el dibujo de
  reserva; artes propios: servo, pila9v, pila-boton, multimetro, altavoz,
  arduino).

Los circuitos guardados con el formato anterior (cada elemento con `t`)
siguen abriendo: cada pieza pasa al componente equivalente de la base.

## Modo embebido

Con `?embed=1` dentro de un `iframe` del mismo origen aparece **Insertar en
el protocolo**, que llama a:

```js
window.parent.FbitProtocolo.recibir({ tipo: 'circuito', vista: 'esquematico' | 'protoboard', png: '<dataURL>', titulo: '' })
```

Para pruebas: `window.__circuitos` (`estado`, `cargar(obj)`,
`exportarPNG(vista)`, `exportarSVG(vista)`, `redes(vista)`, `avisos()`,
`buscar(texto)`, `pata(id, nombre)`, `ejemplo(i)`, `vinculo()` → `{ igual, difs }`,
`generar(desde, sinPreguntar)`…).

## Archivos

- `index.html` — página y estilos.
- `app.js` — motor e interfaz: formas de dibujo, lienzo SVG, catálogo, fichas,
  redes, avisos, vínculo y generación de una vista a partir de la otra, código
  de colores, exportación.
- `componentes.js` — base de componentes (datos).
- `microbit.js` — pines de la micro:bit por versión, recomendaciones y
  revisión de un circuito (datos y reglas).
