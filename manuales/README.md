# Manuales de usuario — micro:bit DataLab Pro

Guías temáticas en formato Word (.docx) con capturas reales del sitio y pasos guiados,
con la misma estética minimalista de la plataforma (blanco y negro, tipografía Montserrat).

## Guías disponibles

| # | Archivo | Contenido |
|---|---------|-----------|
| 1 | `Manual-1-Captura-1-variable-timestamp.docx` | Captura de datos con timestamp para 1 variable (USB y Bluetooth) y procesamiento básico: tabla de datos, ESTABLECER T=0 (poner el tiempo en cero), depuración de datos y exportación a CSV. |

## Estructura

- `img/` — capturas de pantalla usadas en los manuales (PNG a 2× para buena calidad de impresión).
- `herramientas/` — scripts para regenerar las capturas y el documento:
  - `shots.js` — script de Playwright que abre el sitio, simula el flujo completo
    (conexión → captura de una oscilación amortiguada a 10 Hz → selección de punto →
    T=0 → depuración → exportar CSV) y guarda todas las capturas.
  - `makedocx.js` — genera el .docx con la librería `docx` (npm) a partir de las capturas.

## Cómo regenerar un manual

```bash
# 1. Servir el sitio localmente
python3 -m http.server 8765

# 2. Tomar las capturas (requiere playwright con Chromium)
node herramientas/shots.js

# 3. Generar el documento (requiere: npm install docx)
node herramientas/makedocx.js
```

Los manuales usan la tipografía **Montserrat** (la misma del informe del sitio).
Si no está instalada, puede descargarse desde [Google Fonts](https://fonts.google.com/specimen/Montserrat).
