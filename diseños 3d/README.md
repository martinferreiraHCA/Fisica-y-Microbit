# Diseños 3D

Carpeta de piezas del apartado **Diseño de piezas 3D** del sitio.

Todo archivo **`.scad`** (código OpenSCAD) o **`.stl`** (malla ya generada)
que subas acá aparece automáticamente en el menú de piezas del editor,
con su miniatura.

- **`.scad`**: la pieza es personalizable. Las variables del inicio del
  archivo se convierten en deslizadores; un comentario `// [mín:máx]` en la
  misma línea define el rango y `/* [Grupo] */` agrupa parámetros.
- **`.stl`**: la pieza se muestra y se puede descargar tal cual
  (sin parámetros).

El nombre del archivo se usa como nombre de la pieza (guiones y guiones
bajos se muestran como espacios).
