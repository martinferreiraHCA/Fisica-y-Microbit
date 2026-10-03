# Librerías del apartado "Diseño de piezas 3D"

Copias locales servidas desde este sitio para no depender de CDNs externos:

- `openscad.js` — [openscad-wasm 0.0.4](https://www.npmjs.com/package/openscad-wasm),
  port de [OpenSCAD](https://openscad.org/) a WebAssembly. Licencia **GPL-2.0**.
  (sha256 base64: `EpqGHDrMEHDqiNiAb6PB8ob8Wmy5bZJS/W5PJ6iAeas=`, idéntico al publicado en npm/unpkg)
- `three.module.js` — [three.js r160](https://threejs.org/). Licencia **MIT**.
- `fisicabit-carton.scad` — biblioteca OpenSCAD propia del modo **Encastre en
  cartón** (ranuras, pestañas, placas extruidas, reglas, transportadores,
  cuadrículas y una tipografía de trazos para rotular sin fuentes). Según la
  variable `material` del diseño, las pestañas salen con sobrante para
  recortar (`carton`), exactas con compensación de kerf (`laser`) o exactas
  (`impresion3d`). Licencia **MIT**. El sitio la escribe en el sistema de archivos del motor y la
  incluye en cada render con `include <fisicabit-carton.scad>`; en OpenSCAD de
  escritorio se usa igual. Las reglas de encastre (ranuras a media altura,
  holgura ajustable, boca ensanchada, barra de calibración por hoja) siguen a
  proyectos libres como [Lamina](https://github.com/marcelfarres/lamina),
  [boxes.py](https://github.com/florianfesti/boxes) y
  [bmsleight/lasercut](https://github.com/bmsleight/lasercut); ver
  `diseños carton/README.md`.
