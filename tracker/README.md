# Tracker (copia local para FísicaBit)

Esta carpeta contiene una copia completa de **Tracker Online**, la versión para
navegador de [Tracker](https://opensourcephysics.github.io/tracker-website/),
la herramienta de análisis de video y modelado de **Open Source Physics (OSP)**,
creada por Douglas Brown, Wolfgang Christian y Robert M. Hanson.

- Origen: https://github.com/OpenSourcePhysics/tracker-online (carpeta `docs/`)
- Es el mismo Tracker de escritorio (Java) transpilado a JavaScript con SwingJS,
  por lo que corre **completamente en el navegador**, sin servidor ni instalación.
- Licencia: **GNU GPL v3** (ver [LICENSE](LICENSE)). Los créditos y la licencia
  se conservan tal cual; esta copia solo agrega la página de entrada
  `fisicabit.html`, que carga Tracker a pantalla completa dentro del sitio.

## Archivos

| Archivo | Descripción |
|---|---|
| `fisicabit.html` | Entrada usada por la sección TRACKER de FísicaBit (pantalla completa, en el idioma del navegador). |
| `index.html` | Página original de Tracker Online (referencia). |
| `swingjs/` | Runtime SwingJS + clases transpiladas de Tracker (se cargan bajo demanda). |
| `examples/` | Proyectos de ejemplo (.trz) incluidos en la distribución original. |

## Actualizar la copia

```bash
git clone --depth 1 https://github.com/OpenSourcePhysics/tracker-online
rm -rf tracker/swingjs tracker/examples
cp -r tracker-online/docs/. tracker/
# conservar fisicabit.html y este README
```
