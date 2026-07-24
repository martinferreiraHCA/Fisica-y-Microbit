// ============ PIEZA EN BLANCO ============
// Escribí aquí tu propio código OpenSCAD o pegá
// uno existente.
//
// Las variables definidas al inicio aparecen
// automáticamente en el panel PARÁMETROS:
//   ancho = 20;      // [5:50]      → deslizador
//   tipo = 2;        // [1,2,3]     → lista
//   con_tapa = true;               → casilla
//   /* [Grupo] */                  → título de grupo
//   /* [Hidden] */                 → oculta lo que sigue

/* [Dimensiones] */
// Lado del cubo (mm)
lado = 20; // [5:60]
// Diámetro del agujero (mm)
agujero = 8; // [1:30]

/* [Calidad] */
// Resolución de las curvas
resolucion = 64; // [16:160]

/* [Hidden] */
$fn = resolucion;

difference() {
    cube([lado, lado, lado], center = true);
    cylinder(h = lado + 2, d = agujero, center = true);
}
