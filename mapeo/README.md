# MAPEO · la entrada P1 no es un multímetro

En la práctica de campo eléctrico en la cubeta, la punta de prueba va al pin P1
y la micro:bit lee su tensión. Un multímetro casi no toma corriente de lo que
mide (unos 10 MΩ de entrada). La entrada analógica de la micro:bit sí toma un
poco cada vez que mide, y la punta apoyada en el agua es una fuente de mucha
resistencia (de unos pocos kΩ a decenas de kΩ, según el agua y cuánto se moje
la punta). Resultado: el mapa sale parejo y con buena forma, pero los valores
quedan corridos respecto de los que da un multímetro.

## Qué pasa en cada placa

| | micro:bit V1 (nRF51822) | micro:bit V2 (nRF52833) |
|---|---|---|
| Cómo mide | Conversor con divisor resistivo en la entrada | Capacitor de muestreo de 2,5 pF |
| Configuración del programa | 10 bits, entrada con prescaler 1/3, referencia VDD/3 | Tiempo de adquisición de 3 µs, muestreo continuo |
| Qué le hace a la punta | Durante cada conversión (68 µs) la entrada es una resistencia de unos 390 kΩ hacia una tensión interna. Fuera de la conversión es un circuito abierto | Cada muestra toma una carga muy chica. Con 3 µs el fabricante admite hasta 10 kΩ de fuente |
| Corrimiento sin capacitor | De 1 % a 12 % de la escala (punta de 20 kΩ a 100 kΩ) | Menos de 1 % |
| Con 100 nF entre P1 y GND | Menos de 1 % (menos de 0,5 % con puntas de hasta 50 kΩ) | Menos de 1 % (menos de 0,5 % con puntas de hasta 50 kΩ) |

En las dos placas los anillos P0, P1 y P2 tienen además una resistencia fija de
10 MΩ hacia 3V (la del sensor táctil). Con una punta de 20 kΩ corre la lectura
unas milésimas de volt: es lo que queda cuando el capacitor está puesto.

Los números de la tabla salen de `simulacion_entrada.py`, que modela el
muestreo de cada placa con los datos del fabricante. Es un cálculo, no una
medida: para medirlo en una placa real está la prueba de más abajo.

## La solución

**Un capacitor cerámico de 100 nF (marcado «104») entre P1 y GND**, en los
mismos cocodrilos de la micro:bit. El capacitor se carga a la tensión de la
punta a través del agua y, cuando la placa mide, es él quien entrega la
corriente. Sirve igual para la V1 y la V2.

Con el capacitor puesto:

- Al apoyar la punta en un punto nuevo hay que esperar un instante antes de
  presionar A (con 100 nF y una punta de 50 kΩ, unos 25 ms).
- El programa de MAPEO espera 5 ms entre una lectura y la siguiente para que el
  capacitor se recupere.

Si hace falta más exactitud, un **seguidor de tensión** entre la punta y P1 lo
elimina del todo, incluida la resistencia de 10 MΩ: un operacional de entrada y
salida de riel a riel que trabaje con 3 V (por ejemplo MCP6002), con la punta
en la entrada no inversora, la salida unida a la entrada inversora y a P1, y
alimentado desde 3V y GND. El LM358 no sirve: con 3 V no llega a toda la
escala.

Esto es independiente de la caída de tensión en el contacto entre cada placa y
el agua (por la que junto a los electrodos no se leen 0 V y 3,3 V): esa caída
está en la cubeta y la ve igual un multímetro. MAPEO la trata aparte, con
«Medir los electrodos».

## Cómo verificarlo en la placa

En MAPEO → **Montaje y conexiones** → **Probar la entrada P1** (`entrada.js`).

1. Tres resistencias iguales (de 47 kΩ a 220 kΩ) en serie entre 3V y GND.
2. Con el programa de MAPEO cargado, tocar con P1 el pin 3V, el punto A (1/3) y
   el punto B (2/3), presionando A en cada uno.
3. Poner el capacitor de 100 nF entre P1 y GND y repetir.

La prueba calcula con qué resistencia carga la entrada, hacia qué tensión
interna tira y cuánto se correría la lectura en la cubeta; con las dos pasadas
muestra cuánto corrige el capacitor. Como referencia, la simulación de una V1
con resistencias de 100 kΩ da 0,97 V y 1,91 V sin capacitor (ideales 1,10 V y
2,20 V; suponiendo que la tensión interna es 0 V) y 1,11 V y 2,20 V con él. Conviene hacerla en una V1 y en una V2: no
dan lo mismo.

Una comprobación más directa: medir el mismo punto de la cubeta con un
multímetro y con la micro:bit, sin y con el capacitor.

## Fuentes

- Nordic Semiconductor, *Determining capacitor size and maximum sampling
  frequency for a nRF51 ADC voltage divider* (S. Sverrisson, 2014): resistencia
  de entrada por prescaler (129,7 kΩ, 194,6 kΩ y 389,2 kΩ), duración de la
  conversión (20, 36 y 68 µs) y entrada abierta cuando no se muestrea.
  <https://devzone.nordicsemi.com/cfs-file/__key/communityserver-discussions-components-files/4/ADC-voltage-divider-_2D00_-calculating-capacitor-size-v2.pdf>
- Nordic DevZone, *nRF51822 what is the input current/impedance*.
  <https://devzone.nordicsemi.com/f/nordic-q-a/568/nrf51822-what-is-the-input-current-impedance>
- Lectura analógica de la V1 (mbed, usado por microbit-dal): `analogin_api.c`.
  <https://github.com/lancaster-university/mbed-classic/blob/master/targets/hal/TARGET_NORDIC/TARGET_MCU_NRF51822/analogin_api.c>
- Lectura analógica de la V2 (CODAL): `NRF52ADC.cpp`, tiempo de adquisición de
  3 µs. <https://github.com/lancaster-university/codal-nrf52/blob/master/source/NRF52ADC.cpp>
- Nordic, nRF52833 Product Specification, SAADC, tabla de tiempo de
  adquisición y resistencia de fuente máxima.
  <https://docs.nordicsemi.com/bundle/ps_nrf52833/page/saadc.html>
- Nordic, *Measuring Lithium battery voltage with nRF52*: capacitor externo en
  la entrada. <https://devzone.nordicsemi.com/nordic/nordic-blog/b/blog/posts/measuring-lithium-battery-voltage-with-nrf52>
- micro:bit, conector de borde: resistencia externa de 10 MΩ en los anillos.
  <https://tech.microbit.org/hardware/edgeconnector/>

Lo que no está documentado y se supuso en la simulación: la tensión interna de
la entrada de la V1 con esta configuración (se probó con 0 V y con media
escala) y el ritmo de muestreo de fondo de la V2 (se tomó 11 kHz).
