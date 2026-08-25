# Manuales de usuario — micro:bit DataLab Pro

Guías temáticas en formato Word (.docx) con capturas reales del sitio y pasos guiados,
con la misma estética minimalista de la plataforma (blanco y negro, tipografía Montserrat).

## Guías disponibles

| # | Archivo | Tipo | Contenido |
|---|---------|------|-----------|
| 0 | `Guia-rapida-Captura-de-datos.docx` | Guía rápida (3 págs.) | Capturar datos en 10 pasos con imágenes, para el usuario que solo quiere seguir instrucciones. |
| 1 | `Manual-1-Captura-1-variable-timestamp.docx` | Documentación completa | Captura de datos con timestamp para 1 variable, en dos caminos (Serial recomendado / Bluetooth) con latencias explicadas, código comentado, procesamiento básico (T=0, depuración, CSV), notas al pie y glosario. |

## Estructura

- `img/` — capturas de pantalla usadas en los manuales (PNG a 2× para buena calidad de impresión).
- `herramientas/` — scripts para regenerar las capturas y el documento:
  - `shots.js` — script de Playwright que abre el sitio, simula el flujo completo
    (conexión → captura de una oscilación amortiguada a 10 Hz → selección de punto →
    T=0 → depuración → exportar CSV) y guarda todas las capturas.
  - `makedocx.js` — genera el manual de documentación con la librería `docx` (npm).
  - `quickguide.js` — genera la guía rápida de 10 pasos.

## Cómo regenerar un manual

```bash
# 1. Servir el sitio localmente
python3 -m http.server 8765

# 2. Tomar las capturas (requiere playwright con Chromium)
node herramientas/shots.js

# 3. Generar los documentos (requiere: npm install docx)
node herramientas/makedocx.js   # manual de documentación
node herramientas/quickguide.js # guía rápida
```

Los manuales usan la tipografía **Montserrat** (la misma del informe del sitio).
Si no está instalada, puede descargarse desde [Google Fonts](https://fonts.google.com/specimen/Montserrat).
