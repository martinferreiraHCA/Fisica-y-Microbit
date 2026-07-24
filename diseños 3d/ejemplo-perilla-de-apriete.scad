// ========= PERILLA DE APRIETE (ejemplo) =========
// Perilla moleteada con alojamiento hexagonal para
// una tuerca M4/M5/M6: sirve para apretar a mano
// los tornillos de los soportes.

/* [Perilla] */
// Diámetro de la perilla (mm)
diametro = 30; // [15:60]
// Altura de la perilla (mm)
altura = 12; // [6:25]
// Cantidad de lóbulos de agarre
lobulos = 7; // [4:12]
// Diámetro del tornillo (mm)
tornillo = 4; // [2:8]
// Ancho de la tuerca entre caras (mm)
tuerca = 7; // [4:13]
// Profundidad del alojamiento de la tuerca (mm)
tuerca_alto = 3.5; // [2:8]

/* [Calidad] */
// Resolución de las curvas
resolucion = 64; // [24:160]

/* [Hidden] */
$fn = resolucion;
r = diametro / 2;
r_lobulo = 3.14159 * diametro / lobulos / 2 * 0.8;

difference() {
    union() {
        cylinder(h = altura, r = r - r_lobulo * 0.35);
        // Lóbulos de agarre
        for (i = [0 : lobulos - 1])
            rotate([0, 0, i * 360 / lobulos])
                translate([r - r_lobulo * 0.55, 0, 0])
                    cylinder(h = altura, r = r_lobulo);
    }
    // Pasaje del tornillo
    translate([0, 0, -1])
        cylinder(h = altura + 2, d = tornillo + 0.4);
    // Alojamiento hexagonal de la tuerca
    translate([0, 0, altura - tuerca_alto])
        cylinder(h = tuerca_alto + 1, d = tuerca / cos(30) + 0.4, $fn = 6);
}
