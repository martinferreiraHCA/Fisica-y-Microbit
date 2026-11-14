# Circuitos (herramienta oculta)

Editor de circuitos muy sencillo, con la estética de fisicabit: dibujo
vectorial en blanco y negro. El único color son las **bandas de las
resistencias** y los **cables** (rojo y negro para + y −, y unos pocos más).

No tiene enlaces desde el sitio. Se entra por `fisicabit.com/circuitos/`, o
desde el protocolo de práctico, que la abre embebida (`?embed=1`).

## Dos editores en la misma herramienta

- **1 · Esquemático** — cuadrícula de 20 px. Cable, resistencia (rectángulo
  o zigzag), pila, batería, fuente CC, LED, diodo, lámpara, interruptor,
  pulsador, capacitor, potenciómetro, LDR, termistor, amperímetro,
  voltímetro, motor, zumbador, tierra, texto y micro:bit (P0, P1, P2, 3V,
  GND). Los puntos de unión se dibujan solos.
- **2 · Protoboard** — placa de 30 columnas con rieles de alimentación.
  Cable puente, resistencia con sus bandas, LED, capacitor, diodo, LDR y
  zumbador entre dos agujeros; pulsador y potenciómetro de huella fija;
  portapilas, micro:bit y motor sueltos, con bornes para enganchar cables.

Cada pestaña tiene su propio dibujo.

## Cómo se usa

- Elegir un componente y **arrastrar de un punto a otro** (o clic y clic):
  el símbolo queda en el medio y se orienta solo. Los de un punto (tierra,
  texto, micro:bit, pulsador, potenciómetro, portapilas, motor) van con un
  clic.
- **Seleccionar**: clic elige, arrastrar mueve, las manijas mueven un
  extremo, flechas del teclado, Supr borra, Ctrl+D duplica, Ctrl+Z / Ctrl+Y
  deshace y rehace, Esc cancela. Rueda: zoom; botón derecho o barra
  espaciadora: desplazar.
- **Resistencias**: doble clic (o clic sobre la que ya está elegida) abre el
  código de colores. Se escribe el valor (`220`, `4.7k`, `4k7`, `1M`) o se
  eligen las bandas; las dos cosas quedan sincronizadas.
- Inspector: rótulo, valor, color del cable, interruptor abierto o cerrado,
  *Invertir* (polaridad), conector de la micro:bit hacia arriba.
- **SVG** y **PNG** descargan la pestaña activa recortada y sin grilla;
  **Guardar / Abrir** usan un archivo `.circuito.json`. El circuito se
  guarda solo en el navegador (`localStorage`, `fisicabit_circuito_v1`).

## Modo embebido

Con `?embed=1` dentro de un `iframe` del mismo origen aparece **Insertar en
el protocolo**, que llama a:

```js
window.parent.FbitProtocolo.recibir({ tipo: 'circuito', vista: 'esquematico' | 'protoboard', png: '<dataURL>', titulo: '' })
```

Para pruebas: `window.__circuitos` (`estado`, `cargar(obj)`,
`exportarPNG(vista)`, `exportarSVG(vista)`, `bandas`, `leerOhm`…).

## Archivos

- `index.html` — página y estilos.
- `app.js` — componentes (símbolos y huellas), lienzo SVG, código de
  colores, exportación.
