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

## Créditos

- `conectores-de-varilla.scad` está inspirado en el «Fun science: Universal
  laboratory stand» de ToFe ([Thingiverse 2005771](https://www.thingiverse.com/thing:2005771),
  CC BY-NC-SA): bloque con agujero para la varilla, tornillo lateral y tuerca
  cautiva. El archivo de este repositorio es un diseño propio y paramétrico;
  no copia los modelos originales.
