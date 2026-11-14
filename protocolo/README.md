# Protocolo de práctico (herramientas del docente)

En la barra del sitio, **INFORME ▾ → Protocolo de práctico** abre el mismo
editor del informe con otro documento: el **protocolo** que el docente
escribe para sus estudiantes. También se entra con `fisicabit.com/#protocolo`.

El informe del estudiante y el protocolo conviven en el mismo proyecto: se
guardan juntos (autoguardado, archivo de proyecto, Google Drive) y se cambia
de uno a otro desde el menú. Todo lo del editor sirve en los dos: partes,
portada, texto con formato, tablas, ecuaciones, imágenes, vista previa y
descarga en PDF y Word.

## Qué agrega el protocolo

- **Plantilla propia**: Objetivos · Fundamento teórico · Materiales ·
  Montaje experimental · Programación de la micro:bit · Procedimiento ·
  Registro de datos · Análisis y preguntas (y «Seguridad y cuidados»).
- Grupo **Laboratorio** en la cinta (este archivo, `protocolo.js`, se carga
  la primera vez que se usa):

| Botón | Qué hace |
|-------|----------|
| **Montaje** | Abre el diseñador de guías de armado (`guias/?embed=1`). *Insertar dibujo* pone el dispositivo armado como figura; *Insertar anexo de armado* agrega la parte «Anexo · Ensamblado del montaje experimental» con el dispositivo, la tira de piezas y un dibujo por paso. |
| **Circuito** | Abre el editor de circuitos (`circuitos/?embed=1`): esquemático o protoboard. *Insertar en el protocolo* agrega la pestaña activa como figura. |
| **Teórica** | Gráfica de hasta 3 funciones (el modelo esperado) con modelos listos (MRU, MRUV, caída libre, péndulo, MAS, Hooke, Ohm, RC…), o ejes en blanco con cuadrícula para graficar a mano. |
| **Bloques** | Programas listos para enviar datos a fisicabit.com y «Mis prácticas» de MakeCode. Los bloques los dibuja el render oficial de MakeCode con la extensión FisicaBit, en el idioma del sitio. |
| **IA** | Arma un prompt para escribir o adaptar un protocolo e importa la respuesta. |

## El prompt de IA siempre está al día

Cada vez que se arma, el prompt lee del sitio lo que hay **en ese momento**:

- el catálogo de **piezas 3D** y de **cartón encastrable** (API de GitHub,
  carpetas `diseños 3d` y `diseños carton`): al subir un `.scad` nuevo, la
  pieza aparece sola en la lista y en el prompt, con su descripción y sus
  parámetros;
- los **bloques de la extensión FisicaBit** (se leen de
  `pxt-fisicabit-usb`: versión y textos de los bloques en español);
- los **ajustes de curva** y los **módulos del menú EXTRAS** (del propio DOM).

El docente suma el tema, el curso, lo que se mide, los elementos del catálogo
que va a usar, **elementos propios** (`Carrito: chasis, 4 ruedas, eje` → un
elemento con sus partes) y la **secuencia de ensamblaje** (escrita, o la de
la guía de armado que tenga abierta en el diseñador).

Nada se envía a ningún servicio: el prompt se copia y se pega en la IA que
se use. La respuesta viene en Markdown con un formato fijo y se importa:

- `# Título` → título del protocolo; cada `## Parte` → una parte del editor;
- listas, tablas Markdown, `$fórmulas$` y `$$fórmulas$$` → contenido editable;
- un bloque ```` ```typescript ```` → la **imagen de los bloques** de MakeCode;
- `[[GRAFICA: y = … | x: 0 a 1 | ejeX: … | ejeY: … | titulo: …]]` → gráfica
  teórica dibujada; `[[EJES: …]]` → ejes en blanco;
- `[[CIRCUITO: …]]` y `[[MONTAJE: …]]` → quedan marcados en gris para que el
  docente los inserte con su herramienta.

## Archivos

- `protocolo.js` — ventanas de las herramientas, intérprete de fórmulas,
  gráfica teórica, render de bloques, lectura del catálogo, prompt e
  importación de Markdown. Usa `window.Informe.api` (definida en
  `index.html`, módulo INFORME).
- `../guias/` — diseñador de guías de armado (modo embebido).
- `../circuitos/` — editor de circuitos (modo embebido).
