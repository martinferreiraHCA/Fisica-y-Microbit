# Diseños 3D

Carpeta de piezas del apartado **Diseño de piezas 3D** del sitio.

**Todas** las piezas del editor viven en esta carpeta: no hay piezas
"incluidas" aparte. Todo archivo **`.scad`** (código OpenSCAD) o **`.stl`**
(malla ya generada) que subas acá aparece automáticamente en el menú de
piezas del editor, con su miniatura.

- **`.scad`**: la pieza es personalizable. Las variables del inicio del
  archivo se convierten en deslizadores; un comentario `// [mín:máx]` en la
  misma línea define el rango y `/* [Grupo] */` agrupa parámetros.
- **`.stl`**: la pieza se muestra y se puede descargar tal cual
  (sin parámetros).

El nombre del archivo se usa como nombre de la pieza (guiones y guiones
bajos se muestran como espacios).

## Cómo agregar piezas desde el editor

En el apartado del sitio (`#piezas3d`), bajo **Genera tu propia pieza**:

- **✦ Asistente con IA**: describís la pieza que necesitás, el sistema
  arma un prompt listo, lo pegás en tu IA (Claude, ChatGPT, Gemini…) y
  traés la respuesta; el editor extrae el código OpenSCAD y lo carga.
  También sirve para modificar una pieza o corregir un error de render.
- **Abrir archivo .scad / .stl**: prueba un archivo de tu computadora en
  el momento, sin subirlo.

Cuando una pieza te guste, usá **Descargar código .scad** para guardarla
en tu equipo. Para incorporarla al catálogo del sitio, el administrador
sube el archivo a esta carpeta desde GitHub.

## Versión en cartón

El mismo apartado tiene arriba el modo **Encastre en cartón** (`#carton`):
piezas planas que se imprimen en A4, se pegan sobre cartón y se encastran.
Con **Convertir a cartón encastrable…** cualquier pieza de esta carpeta se
corta en láminas cruzadas listas para imprimir. Esos diseños viven en la
carpeta `diseños carton`.

## Perilla de apriete para tornillo hexagonal

`perilla-de-apriete-para-tornillo-hexagonal.scad` reúne dos formas de
perilla (redonda de 16 lóbulos y trilobulada con cuello) que convierten una
tuerca o la cabeza de un tornillo en tornillo de mano. Se elige la forma y el
tornillo (M3 a M10, u otra medida entre caras) y el resto de las medidas se
calcula o se fija a mano. En el menú de piezas, al pasar el mouse por su
miniatura se van mostrando las dos formas.

### Miniaturas alternativas

Un diseño `.scad` puede mostrar más de una miniatura en el menú (por ejemplo
una por cada forma que ofrece) con una línea de comentario al inicio:

```
// miniaturas: tipo="redonda" | tipo="trilobulada", tornillo="M3"
```

Cada variante va separada por `|`, y dentro de una variante las asignaciones
van separadas por comas. La primera es la miniatura normal; las demás se van
mostrando, con un fundido, mientras el mouse está sobre la tarjeta.
