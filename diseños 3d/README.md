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
- **Subir a la carpeta del sitio**: abre esta carpeta en GitHub para
  subir el archivo y que quede en el catálogo (requiere permisos en el
  repositorio).

Cuando una pieza te guste, usá **Descargar código .scad** y subila acá.
