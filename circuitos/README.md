# Circuitos (herramienta oculta)

Editor de circuitos sencillo, con la estética de fisicabit. La interfaz y el
esquemático van en blanco y negro (el único color son los cables). La
protoboard tiene dos estilos: **Realista**, con dibujos a color parecidos a
los de Tinkercad, y **Línea**, en blanco y negro, para imprimir.

No tiene enlaces desde el sitio. Se entra por `fisicabit.com/circuitos/`, o
desde el protocolo de práctico, que la abre embebida (`?embed=1`).

## Dos editores en la misma herramienta

- **1 · Esquemático** — cuadrícula de 20 px; los puntos de unión se dibujan
  solos.
- **2 · Protoboard** — placa de 30 o 60 columnas con rieles de alimentación,
  o **Sin protoboard** (ver más abajo). En la barra se elige el estilo
  **Realista / Línea** (se recuerda en el navegador y se guarda con el
  circuito).

Cada pestaña tiene su propio dibujo.

## Catálogo con buscador

Los componentes salen de la base `componentes.js` (unos 140, en 10
categorías). El panel izquierdo tiene el **buscador** (tecla `/` o Ctrl+K;
busca por nombre, alias, categoría y descripción, sin distinguir mayúsculas
ni tildes; Esc lo limpia), el filtro *Solo los que están en Tinkercad* y las
categorías plegables con sus miniaturas, dibujadas con la misma función que el
lienzo: una lista con los símbolos en el esquemático y un **mosaico de dos
columnas** con el dibujo grande en la protoboard. Un resultado que solo existe en la otra pestaña aparece atenuado y, al
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
- **Ejemplos**: cinco circuitos listos (LED en P0, LDR en divisor a P1,
  ultrasonido con extensor, servo con pilas aparte, campo eléctrico en
  cubeta sin protoboard).
- **SVG** y **PNG** descargan la pestaña activa recortada, sin grilla ni
  avisos; **Guardar / Abrir** usan un archivo `.circuito.json`. El circuito se
  guarda solo en el navegador (`localStorage`, `fisicabit_circuito_v1`).

## Montaje sin protoboard

En la pestaña 2, el selector de tamaño de la placa tiene la opción **Sin
protoboard** (`proto.cols = 0` en el archivo). Sirve para los montajes que no
llevan placa: la micro:bit, una cubeta, pilas, un motor, cables con pinzas.

- No se dibuja la placa y no hay agujeros ni columnas que unan: dos puntos
  son el mismo nodo solo si coinciden o si los une un cable.
- Las piezas de dos patas se colocan de un punto a otro (cada 10 px) y las de
  huella fija, cada 20 px. El cable se engancha a los terminales de cualquier
  pieza.
- Los estilos Realista y Línea, los avisos, el vínculo con el esquemático y
  **← Generar esquemático** funcionan igual. **Generar protoboard →** siempre
  arma una placa.
- Al pasar un circuito con placa a «Sin protoboard», las piezas dejan de
  unirse por las columnas y la barra de estado lo avisa.

### Cubetas para el campo eléctrico

Categoría **Campo eléctrico**: cuatro cubetas vistas de arriba, para dibujar
el montaje de la práctica de MAPEO.

- **Realista**: es la bandeja imprimible del sitio
  (`../diseños 3d/bandeja-para-mapeo-de-campo-electrico.scad`, con sus valores
  por defecto, a 2 px por mm): plástico gris claro como en el visor de piezas
  3D, zona de mapeo de 140 × 100 mm con la cuadrícula grabada cada 1 cm y una
  línea gruesa cada 5, muescas en el borde, nervios que guían las chapas (a
  10 mm de la cuadrícula), asientos de los electrodos puntuales (a 80 mm) y el
  pico en una esquina; con agua, los electrodos de metal y una pinza cocodrilo
  en cada uno. Los colores de MAPEO dicen qué es cada cosa: **−** azul, **+**
  rojo y la punta de prueba amarilla.
- **Línea**: lo mismo en blanco y negro, con los puntos de medida cada 2 cm.
- La forma de los electrodos (`proto.forma`): placas paralelas
  (`cubeta-placas`), conductores cilíndricos (`cubeta-cilindros`), placa y
  cilindro (`cubeta-placa-cilindro`) y coaxial (`cubeta-coaxial`: cilindro
  central + y aro −, como la plantilla de MAPEO; la bandeja 3D no trae esa
  variante).
- **Punta de prueba** a elegir en el panel derecho (`el.punta`): punta de
  tester, clavo con pinza cocodrilo, aguja larga o destornillador. Cambia solo
  el dibujo.
- Tres terminales: la pinza de cada electrodo (**−** y **+**) y el borne del
  cable de la punta (**PUNTA**, que para los avisos es una salida analógica).
  La punta va acostada dentro de la cubeta; su cable viene dibujado con ella,
  sale por encima de la pared derecha y baja por fuera hasta el borne. En el esquemático son un bloque con esos tres pines.
- El ejemplo *Campo eléctrico en cubeta (MAPEO)* une GND, 3V y P1 con cables
  en ángulo recto, sin cruces.

Si cambia la bandeja 3D, hay que cambiar el dibujo también acá (`cubetaGeo`,
`puntaSVG` y `PROTO.cubeta` en `app.js`, `NATIVOS.cubeta` en `arte.js`).

En el estilo Realista, un cable no dibuja su terminación en el extremo donde
sigue otro cable: los tramos en codo se ven como un solo cable.

## micro:bit: versión, extensor y pines

En el inspector de la placa se elige la **versión** (V1 / V2) y la
**conexión**: simple (los 5 anillos) o con **extensor** (un borne por pin; ■
comparte la pantalla, ○ comparte un botón, ◆ bus I2C). Al tocar un pin (en el
dibujo o en la lista del inspector) aparece su ficha: para qué sirve, para qué
no y qué tener en cuenta en esa versión.

### Los pines de la micro:bit como fuente

En **Alimentación** hay tres entradas para usar la placa como fuente sin
dibujarla entera: **3V de la micro:bit**, **GND de la micro:bit** y **Pin de la
micro:bit (P0, P1, P2…)**. En el esquemático son una etiqueta con el nombre del
pin; en la protoboard, un trozo del borde de la placa con su anillo.

- Al elegir uno se puede **cambiar el pin** (3V, GND o cualquiera del extensor)
  y, si no hay una placa en el dibujo, la **versión** de la micro:bit; debajo
  aparece para qué sirve y para qué no ese pin.
- Los pines sueltos con el **mismo nombre son un mismo punto** aunque no haya
  un cable entre ellos (como las etiquetas de un esquema), y también lo son con
  ese pin de la placa si está dibujada.
- Para los **avisos** cuentan como pines de la micro:bit: un LED sin resistencia
  entre un pin y GND, 9 V al 3V o un sensor analógico en un pin que no mide se
  marcan igual que con la placa entera.
- En el archivo son los componentes `mb-3v`, `mb-gnd` y `mb-pin`, con el pin
  elegido en `pin`.

## Los mismos sensores que en MakeCode + FisicaBit

La extensión FisicaBit de MakeCode (`pxt-fisicabit-usb`) trae, para el
simulador, el dibujo de cada sensor (`parts/*.svg`) y cómo se conecta
(`pxtparts.json`). El editor **lee esos mismos archivos** (`partes.js`), así el
estudiante ve el sensor igual en el simulador de MakeCode y en el circuito:

- En la protoboard **realista**, el HC-SR04, el HY-SRF05 y la sonda DS18B20 se
  dibujan con el dibujo de la extensión, con sus patas en el mismo orden.
- La ficha del componente muestra **En MakeCode + FisicaBit**: a qué pin de la
  micro:bit lo lleva cada bloque, los bloques que lo usan, **Armar esta
  conexión** (el circuito ya armado, igual que en el simulador) y
  **Programarlo en MakeCode** (abre el editor del sitio con un programa que
  lee el sensor y lo envía a fisicabit.com).
- El catálogo los marca «con bloques en MakeCode» y tiene un filtro para ver
  solo esos; **Ejemplos** suma uno por sensor.
- En el panel **MAKECODE + FISICABIT** del sitio, el botón **Sensores** de la
  barra lista los mismos sensores con su dibujo, su conexión, **Ver el
  circuito** (`circuitos/?parte=<id>`) y **Programa de ejemplo**.

**Se actualiza solo.** Al abrir, se usa la copia que viene con el sitio
(`partes/partes.json`) y, si hay red, se lee la extensión de GitHub: un sensor
nuevo en `pxtparts.json` aparece en el catálogo sin tocar el sitio, con su
dibujo, sus patas (los rótulos del dibujo), su conexión (los pines por defecto
de sus bloques) y sus bloques en español. Para que además tenga ficha completa
(datos, hoja de datos, avisos), se lo agrega a `componentes.js` con
`parte: '<id>'` y las patas en el mismo orden que el dibujo. La copia del sitio
se renueva con `node circuitos/partes/actualizar.mjs`.

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

- El capacitor electrolítico lleva `pol: true` en su `esq`: el símbolo marca la
  polaridad (placa recta y signo + del lado de la pata «+», placa curva del
  negativo).
- Esquemático: símbolos propios de dos patas (resistencia, pila, LED,
  inductor, zener, fusible…), de tres patas (`npn`, `pnp`, `nmos`, `pmos`,
  `pot3`, `conmutador`, `opamp`, `regulador`) y `bloque` (caja con los pines
  rotulados a los lados; es también el dibujo de reserva).
- Protoboard: piezas propias (entre ellas `cubeta`), `axial`, `radial`, `to92`, `to220`, `dip`,
  `modulo` y `libre` (caja suelta con un borne por pin, que es el dibujo de
  reserva; artes propios: servo, pila9v, pila-boton, multimetro, altavoz).

## Protoboard realista

El estilo **Realista** (`arte.js`) cambia solo el dibujo: los terminales de
cada pieza son los mismos que en Línea, así que las redes, los avisos, los
circuitos guardados y la generación de una vista a partir de la otra no
dependen del estilo. Un LED y un pulsador pueden cambiar de **color** desde el
panel derecho.

- **Dibujos propios**: la protoboard, la micro:bit V1 y V2 y su extensor, los
  cables, la resistencia con sus bandas, capacitores, diodos, inductor,
  fusible, LDR, termistor, fotodiodo y fototransistor, TO-92, TO-220,
  integrados DIP, el módulo genérico (plaqueta con tira de pines) y los
  sueltos: portapilas, batería de 9 V, pila botón, motor, parlante,
  multímetros, fuente, generador, osciloscopio, celda solar, lámpara,
  ventilador y la caja genérica.
- **Dibujos de [Wokwi Elements](https://github.com/wokwi/wokwi-elements)**
  1.9.2 (licencia MIT, © Uri Shaked; el paquete, sin cambios, está en
  `../lib/wokwi-elements.bundle.min.js` y su licencia en
  `../lib/wokwi-elements.LICENSE`): LED y LED infrarrojo (`led`), LED RGB
  (`rgb-led`), pulsador (`pushbutton-6mm`), potenciómetro (`potentiometer`),
  zumbadores (`buzzer`), interruptor deslizante (`slide-switch`), HC-SR04 y
  HC-SR04P (`hc-sr04`), PIR (`pir-motion-sensor`), MPU6050 (`mpu6050`), LCD
  16 × 2 y LCD I2C (`lcd1602`), HX711 (`hx711`), encoder (`ky-040`), sensor de
  gas (`gas-sensor`), sensor de sonido (`small-sound-sensor`), display de 7
  segmentos (`7segment`), DHT11 y DHT22 (`dht22`), OLED (`ssd1306`), joystick
  (`analog-joystick`), NeoPixel (`neopixel`), relé (`ks2e-m-dc5`), servo
  (`servo`) y teclado 4 × 4 (`membrane-keypad`).

El paquete se carga una sola vez, al entrar por primera vez a la protoboard
realista. Cada elemento se instancia fuera de pantalla, su SVG (con los
estilos ya resueltos) se copia a un `<symbol>` y en el lienzo va como `<use>`:
no queda ningún componente web en el dibujo, y el SVG y el PNG exportados
llevan adentro los símbolos que usan. Si el paquete no carga, la protoboard
pasa sola al estilo Línea y lo avisa en la barra de estado.

Cómo se acomoda cada dibujo de Wokwi a nuestros terminales (tabla `WOKWI` de
`arte.js`, por id de componente):

- `pines`: sus patas caen sobre nuestros agujeros; la escala y el giro salen
  de la primera y la última (el paso entre patas queda igual al de la placa).
- `dos`: piezas de dos patas entre dos agujeros cualesquiera (LED, zumbador);
  el cuerpo queda de pie y, si los agujeros están más lejos, las patas se
  alargan.
- `patas`: cuando el orden o la cantidad de patas no coincide (DHT, OLED,
  joystick, NeoPixel, relé), el cuerpo va sobre una tira de pines propia,
  rotulada con nuestros nombres.
- `libre`: sueltos (servo, LCD I2C, teclado); el dibujo, un conector en
  nuestros bornes y los cables que los unen.

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
`generar(desde, sinPreguntar)`, `estilo`, `ponerEstilo('real' | 'linea')`,
`arteListo()` → promesa que se cumple cuando están los dibujos de Wokwi…).

## Archivos

- `index.html` — página y estilos.
- `app.js` — motor e interfaz: formas de dibujo, lienzo SVG, catálogo, fichas,
  redes, avisos, vínculo y generación de una vista a partir de la otra, código
  de colores, exportación.
- `arte.js` — estilo Realista de la protoboard: dibujos propios y carga de los
  de Wokwi Elements.
- `componentes.js` — base de componentes (datos).
- `partes.js` — sensores de la extensión FisicaBit de MakeCode: lee
  `pxtparts.json`, los dibujos y los bloques, y arma el programa de ejemplo.
  `partes/partes.json` es la copia que se usa sin red.
- `microbit.js` — pines de la micro:bit por versión, recomendaciones y
  revisión de un circuito (datos y reglas).
